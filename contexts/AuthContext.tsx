
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PointTransaction, FoodListing, ChatMessage, B2BListing, CarbonStandard, CarbonProject, ProjectCategory, TradeOffer } from '../types';
import { db } from '../services/db';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, name: string, location: string, password?: string, role?: 'user' | 'enterprise') => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  earnPoints: (amount: number, description: string) => void;
  redeemPoints: (amount: number, description: string) => boolean;
  transferCredits: (region: string, amount: number) => Promise<void>; 
  
  // Handshake Protocol
  offers: TradeOffer[];
  pendingOfferCount: number; 
  activeBids: TradeOffer[]; 
  broadcastOffer: (region: string, price: number) => Promise<void>;
  updateOfferPrice: (offerId: string, newPrice: number) => Promise<void>;
  acceptTradeOffer: (offerId: string) => Promise<void>;
  rejectTradeOffer: (offerId: string) => Promise<void>;

  // B2B Market
  b2bListings: B2BListing[];
  createB2BListing: (amount: number, price: number, vintage: number) => Promise<void>; 
  buyB2BListing: (listingId: string, amount: number, retire: boolean) => Promise<void>;

  submitRating: (rating: number) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  communityUsers: User[]; 
  
  // Community Features
  listings: FoodListing[];
  postListing: (listing: Omit<FoodListing, 'id' | 'createdAt' | 'status' | 'giverId' | 'giverName' | 'giverRating'>) => void;
  claimListing: (listingId: string, pickupMethod: string) => string; 
  completeListing: (code: string) => FoodListing | null; 
  deleteListing: (listingId: string) => Promise<void>;
  
  // Chat Features
  messages: ChatMessage[];
  sendMessage: (listingId: string, text: string) => void;
  isTyping: boolean; 
  
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [b2bListings, setB2BListings] = useState<B2BListing[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [communityUsers, setCommunityUsers] = useState<User[]>([]);
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [activeBids, setActiveBids] = useState<TradeOffer[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    const unsubscribeAuth = db.onAuthStateChanged((user) => {
        setUser(user);
        setIsLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- DATA SUBSCRIPTIONS (REQUIRE AUTH) ---
  useEffect(() => {
    if (!user) {
        // Clear data on logout
        setListings([]);
        setB2BListings([]);
        setMessages([]);
        setCommunityUsers([]);
        setOffers([]);
        setActiveBids([]);
        return;
    }

    // 1. Common Subscriptions (All Auth Users)
    // Eco-Share Hub
    const unsubscribeListings = db.subscribeToListings((data) => {
        setListings(data);
    });

    // Chat
    const unsubscribeChats = db.subscribeToMessages((data) => {
        setMessages(data);
    });

    // 2. Role Specific Subscriptions
    let unsubscribeB2B = () => {};
    let unsubscribeUsers = () => {};
    let unsubscribeRoleSpecific = () => {};

    if (user.role === 'enterprise') {
        // ENTERPRISE ONLY: B2B Market, Community Aggregation (All Users), Active Bids
        unsubscribeB2B = db.subscribeToB2BListings((data) => {
            setB2BListings(data);
        });

        unsubscribeUsers = db.subscribeToUsers((data) => {
            // Filter users for community aggregation
            setCommunityUsers(data.filter(u => u.role === 'user' || !u.role));
        });

        unsubscribeRoleSpecific = db.subscribeToEnterpriseBids(user.id, setActiveBids);
    } else {
        // INDIVIDUAL USER ONLY: Trade Requests (Offers)
        unsubscribeRoleSpecific = db.subscribeToUserOffers(user.id, setOffers);
    }

    return () => {
        unsubscribeListings();
        unsubscribeChats();
        unsubscribeB2B();
        unsubscribeUsers();
        unsubscribeRoleSpecific();
    };
  }, [user]); // Re-run when user changes (login/logout)

  // --- AUTH METHODS ---

  const login = async (email: string, password?: string) => {
      await db.login(email, password);
  };

  const signup = async (email: string, name: string, location: string, password?: string, role: 'user' | 'enterprise' = 'user') => {
      const newUser: User = {
        id: Date.now().toString(), 
        email,
        name,
        location,
        password, 
        role, 
        walletBalance: role === 'enterprise' ? 0 : 100, 
        pointsHistory: [{
            id: Date.now().toString(),
            date: new Date().toISOString(),
            amount: role === 'enterprise' ? 0 : 100,
            description: "Account Created",
            type: 'earned',
            standard: 'ReplateIQ Verified'
        }],
        rating: 5.0,
        ratingCount: 0
      };
      
      await db.signup(newUser);
  };

  const logout = async () => {
      await db.logout();
  };

  const resetPassword = async (email: string) => {
    return new Promise<void>((resolve) => setTimeout(resolve, 1000));
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    await db.updateUser(user.id, data);
  };

  const getAllUsers = async () => {
      return await db.getAllUsers();
  };

  // --- POINTS & WALLET ---
  
  const earnPoints = async (amount: number, description: string) => {
    if (!user) return;
    await db.addPoints(user.id, amount, description);
  };

  const redeemPoints = (amount: number, description: string): boolean => {
    if (!user || user.walletBalance < amount) return false;
    const newBalance = user.walletBalance - amount;
    const history = [{
        id: Date.now().toString(),
        date: new Date().toISOString(),
        amount,
        description,
        type: 'redeemed'
    } as PointTransaction, ...user.pointsHistory];
    updateUser({ walletBalance: newBalance, pointsHistory: history });
    return true;
  };

  // Handshake Protocol
  const broadcastOffer = async (region: string, price: number) => {
      if(!user || user.role !== 'enterprise') return;
      await db.broadcastOffer(user.id, user.name, region, price);
  };

  const updateOfferPrice = async (offerId: string, newPrice: number) => {
      if (!user || user.role !== 'enterprise') return;
      await db.updateOfferPrice(offerId, newPrice);
  };

  const acceptTradeOffer = async (offerId: string) => {
      if(!user) return;
      await db.acceptTradeOffer(offerId, user.id);
  };

  const rejectTradeOffer = async (offerId: string) => {
      if(!user) return;
      await db.rejectTradeOffer(offerId);
  };

  // Legacy
  const transferCredits = async (region: string, amount: number) => {
      if (!user) return;
      await db.transferCredits(user.id, region, amount);
  };

  const createB2BListing = async (amount: number, price: number, vintage: number) => {
      if (!user) return;
      const project = db.getCommunityProject();
      const listing: B2BListing = {
          id: Date.now().toString(),
          sellerId: user.id,
          sellerName: user.name,
          sellerVerified: user.kycVerified || false,
          amount,
          pricePerCredit: price,
          project, 
          vintage,
          serialNumberRange: "", 
          status: 'active',
          createdAt: new Date().toISOString()
      };
      await db.createB2BListing(listing);
  };

  const buyB2BListing = async (listingId: string, amount: number, retire: boolean) => {
      if (!user) return;
      await db.buyB2BListing(user.id, listingId, amount, retire);
  };

  const submitRating = async (rating: number) => {
      console.log(`Rating submitted: ${rating}`);
  };

  // --- LISTINGS & CHAT ---
  const postListing = async (data: any) => { if (user) await db.addListing({ ...data, giverId: user.id, giverName: user.name, giverRating: user.rating, status: 'available', createdAt: new Date().toISOString(), id: Date.now().toString() }); };
  
  const claimListing = (id: string, method: string) => { 
      if (!user) return "";
      const code = Math.floor(1000 + Math.random()*9000).toString();
      db.updateListing(id, { status: 'claimed', claimedBy: user.id, claimedByName: user.name, claimCode: code, pickupMethod: method });
      sendMessage(id, `System: I've claimed this item via ${method}.`);
      return code;
  };

  const completeListing = (code: string) => {
      const listing = listings.find(l => l.status === 'claimed' && l.claimCode === code);
      if(listing) {
          db.updateListing(listing.id, {status: 'completed'});
          
          // --- REALISTIC & FAIR CARBON CREDIT CALCULATION ---
          // 1kg CO2e approx = 10 Credits (Micro-credits). 
          const totalPoints = Math.round(listing.carbonSaved * 10) + 5; 
          const splitPoints = Math.floor(totalPoints / 2); // 50% split

          // Award to Receiver (Claimed By)
          if(listing.claimedBy) {
              db.addPoints(listing.claimedBy, splitPoints, `Verified Pickup: ${listing.title} (50% Share)`);
          }

          // Award to Giver (Original Poster) - Fairness Update
          if(listing.giverId) {
              db.addPoints(listing.giverId, splitPoints, `Food Rescued: ${listing.title} (50% Share)`);
          }

          return listing;
      }
      return null;
  };

  const deleteListing = async (id: string) => { if(user) await db.deleteListing(id); };
  
  const sendMessage = async (id: string, text: string) => {
      if(user) {
          await db.sendMessage({ id: Date.now().toString(), listingId: id, senderId: user.id, text, timestamp: new Date().toISOString() });
      }
  };

  return (
    <AuthContext.Provider value={{ 
        user, login, signup, updateUser, logout, resetPassword, 
        earnPoints, redeemPoints, transferCredits, createB2BListing, buyB2BListing, b2bListings,
        offers, activeBids, broadcastOffer, acceptTradeOffer, rejectTradeOffer, updateOfferPrice,
        pendingOfferCount: offers.length, 
        submitRating, getAllUsers, communityUsers,
        listings, postListing, claimListing, completeListing, deleteListing,
        messages, sendMessage, isTyping,
        isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};


import React, { useState, useEffect, useRef } from 'react';
import { analyzeCarbonFootprint, predictDishDetails } from '../services/geminiService';
import { CarbonAnalysis, CarbonScenario, FoodListing, DishPrediction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { searchAddress, lookupZip } from '../services/mockLocationService';
import { Leaf, Recycle, MapPin, Truck, Trash2, Snowflake, Footprints, Loader2, CheckCircle, Award, ShieldCheck, KeyRound, X, Star, MessageCircle, Send, Camera, Image as ImageIcon, Navigation, ExternalLink, Bus, Bike, Car, ThumbsUp, ThumbsDown, AlertTriangle, Clock, Wand2, Plus, Flame, ChefHat, Info, ArrowRight, History, Search, HeartHandshake, AlertCircle } from 'lucide-react';

const CommunityHub: React.FC = () => {
  const { user, earnPoints, submitRating, listings, postListing, claimListing, completeListing, deleteListing, messages, sendMessage, isTyping } = useAuth();
  const [dishName, setDishName] = useState("");
  const [quantity, setQuantity] = useState(2);
  const [foodImage, setFoodImage] = useState<string | undefined>(undefined);
  const [analysis, setAnalysis] = useState<CarbonAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isPredicting, setIsPredicting] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [calories, setCalories] = useState<number | null>(null);
  const [refinements, setRefinements] = useState<DishPrediction['refinements']>([]);
  const [newIngredient, setNewIngredient] = useState("");

  const [streetAddress, setStreetAddress] = useState("");
  const [isAddressFocused, setIsAddressFocused] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);

  const [searchLocation, setSearchLocation] = useState("");
  
  const [giverTab, setGiverTab] = useState<'active' | 'history'>('active');
  const [receiverTab, setReceiverTab] = useState<'browse' | 'history'>('browse');

  useEffect(() => {
      if (user?.location) {
          const parts = user.location.split(',');
          if (parts.length > 0) setStreetAddress(parts[0].trim());
          
          const zipMatch = user.location.match(/\b\d{5}\b/);
          if (zipMatch) {
              setSearchLocation(zipMatch[0]); 
          } else {
              setSearchLocation(""); 
          }
      }
  }, [user]);

  useEffect(() => {
    if (streetAddress.length > 1 && isAddressFocused) {
        const timeoutId = setTimeout(async () => {
            const results = await searchAddress(streetAddress);
            setAddressSuggestions(results);
            setShowSuggestions(true);
        }, 300);
        return () => clearTimeout(timeoutId);
    } else {
        setShowSuggestions(false);
    }
  }, [streetAddress, isAddressFocused]);

  useEffect(() => {
    if (zipCode.length === 5) {
        const fetchZip = async () => {
            setIsZipLoading(true);
            const result = await lookupZip(zipCode);
            if (result) {
                setCity(result.city);
                setState(result.state);
                setCountry(result.country);
            }
            setIsZipLoading(false);
        };
        fetchZip();
    }
  }, [zipCode]);

  const handleSelectAddress = (addr: string) => {
    setStreetAddress(addr);
    setShowSuggestions(false);
  };
  
  const [selectedScenario, setSelectedScenario] = useState<CarbonScenario | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const [modalMode, setModalMode] = useState<'verify' | 'rate' | 'claim' | 'message' | 'pickup' | null>(null);
  const [userRating, setUserRating] = useState(0);
  
  const [activeListing, setActiveListing] = useState<FoodListing | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [pickupAnalysis, setPickupAnalysis] = useState<{netImpact: number, travelEmissions: number, isWorthIt: boolean} | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<'walk' | 'bike' | 'transit' | 'car' | null>(null);

  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<'giver' | 'receiver'>('giver');
  const [claimedCode, setClaimedCode] = useState<string | null>(null);

  const [listingToDelete, setListingToDelete] = useState<FoodListing | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (modalMode === 'message') {
        scrollToBottom();
    }
  }, [messages, modalMode, isTyping]);

  const handlePredictDish = async () => {
      if (!dishName.trim()) return;
      setIsPredicting(true);
      try {
          const result = await predictDishDetails(dishName);
          setIngredients(result.ingredients);
          setCalories(result.calories);
          setRefinements(result.refinements);
      } catch (e) {
          console.error(e);
      } finally {
          setIsPredicting(false);
      }
  };

  const handleRefineIngredient = (target: string, selection: string) => {
      const updatedIngredients = ingredients.map(ing => 
          ing.toLowerCase().includes(target.toLowerCase()) ? `${selection} ${target}` : ing
      );
      setIngredients(updatedIngredients);
      setRefinements(prev => prev.filter(r => r.targetIngredient !== target));
  };

  const handleAddIngredient = () => {
      if (newIngredient.trim()) {
          setIngredients([...ingredients, newIngredient.trim()]);
          setNewIngredient("");
      }
  };

  const handleRemoveIngredient = (idx: number) => {
      setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleAnalyze = async () => {
    const fullLocality = `${streetAddress}, ${city}, ${state} ${zipCode}`;
    if (!dishName || !streetAddress || !city) return;
    setIsLoading(true);
    setSelectedScenario(null);
    setPointsEarned(null);
    try {
      const result = await analyzeCarbonFootprint(dishName, quantity, fullLocality);
      setAnalysis(result);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => { if (typeof reader.result === 'string') { setFoodImage(reader.result); } };
          reader.readAsDataURL(file);
      }
  };

  const initiateAction = (scenario: CarbonScenario) => {
    if (scenario.icon === 'trash' || scenario.icon === 'snowflake') {
        completePersonalAction(scenario);
    } else {
        setSelectedScenario(scenario);
    }
  };

  const handlePostListing = () => {
      if (!analysis || !selectedScenario) return;
      const fullLocation = `${streetAddress}, ${city}, ${state} ${zipCode}`;
      const wasteScenario = analysis.scenarios.find(s => s.icon === 'trash');
      const aiWasteEmission = wasteScenario ? wasteScenario.co2e : 0;
      // FALLBACK: If AI thinks waste emission is 0, use standard 0.8kg per serving as baseline
      const standardWasteEmission = 0.8 * analysis.quantity;
      const baselineEmission = Math.max(aiWasteEmission, standardWasteEmission);
      
      const actualSavings = Math.max(0, baselineEmission - selectedScenario.co2e);
      
      postListing({
          title: analysis.dishName,
          quantity: analysis.quantity,
          location: fullLocation,
          image: foodImage,
          distance: "0.5km",
          tags: ["Free", selectedScenario.icon === 'bike' ? "Eco-Ride" : "Pickup"],
          carbonSaved: parseFloat(actualSavings.toFixed(2)),
          ingredients: ingredients,
          caloriesPerServing: calories || 0
      });
      setAnalysis(null); setSelectedScenario(null); setDishName(""); setFoodImage(undefined); setIngredients([]); setCalories(null); setRefinements([]);
      alert("Successfully posted to Community Hub!");
  };

  const handleOpenVerify = () => { setModalMode('verify'); setVerificationCode(""); setVerificationError(null); setActiveListing(null); };

  const handleVerifyCode = async () => {
      const listing = completeListing(verificationCode);
      if (listing) { setActiveListing(listing); setModalMode('rate'); } else { setVerificationError("Invalid Code. Ensure receiver has claimed the item."); }
  };

  const handleRateAndComplete = async () => {
      if (userRating === 0) return;
      await submitRating(userRating);
      const points = activeListing ? Math.round(activeListing.carbonSaved * 10) + 5 : 50; 
      earnPoints(points, `Eco-Share Verified: ${activeListing?.title || 'Exchange'}`);
      setPointsEarned(points); setModalMode(null); setActiveListing(null);
  };

  const completePersonalAction = (scenario: CarbonScenario) => {
    if (!analysis) return;
    const points = 10;
    earnPoints(points, `Action: ${scenario.action}`);
    setPointsEarned(points);
    setAnalysis(null);
  };

  const handleInitClaim = (listing: FoodListing) => { setActiveListing(listing); setPickupAnalysis(null); setSelectedTransport(null); setModalMode('pickup'); };

  const analyzePickup = () => {
      if (!activeListing || !selectedTransport) return;
      const distStr = activeListing.distance.toLowerCase().replace('km', '').trim();
      const distance = parseFloat(distStr) || 1.0;
      const roundTrip = distance * 2;
      let factor = 0;
      if (selectedTransport === 'car') factor = 0.192;
      if (selectedTransport === 'transit') factor = 0.105;
      const travelEmissions = roundTrip * factor;
      const netImpact = activeListing.carbonSaved - travelEmissions;
      setPickupAnalysis({ travelEmissions: parseFloat(travelEmissions.toFixed(2)), netImpact: parseFloat(netImpact.toFixed(2)), isWorthIt: netImpact > 0 });
  };

  const handleConfirmClaim = () => { 
      if (!activeListing || !selectedTransport) return; 
      // FIX: Ensure claimed code is set instantly in state from the return value
      const code = claimListing(activeListing.id, selectedTransport); 
      setClaimedCode(code); 
      setModalMode('claim'); 
  };
  
  const handleViewClaimDetails = (listing: FoodListing) => { setClaimedCode(listing.claimCode || ""); setActiveListing(listing); setModalMode('claim'); };
  const handleDeleteClick = (listing: FoodListing) => { setListingToDelete(listing); };
  const handleConfirmDelete = async () => { if (listingToDelete) { await deleteListing(listingToDelete.id); setListingToDelete(null); } };
  const handleMessage = (listing: FoodListing) => { setActiveListing(listing); setModalMode('message'); setMessageText(""); };
  const handleSendMessage = () => { if (!messageText.trim() || !activeListing) return; sendMessage(activeListing.id, messageText); setMessageText(""); };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'trash': return <Trash2 size={24} className="text-gray-500" />;
      case 'snowflake': return <Snowflake size={24} className="text-blue-500" />;
      case 'bike': return <Recycle size={24} className="text-emerald-500" />;
      case 'walk': return <Footprints size={24} className="text-emerald-600" />;
      case 'car': return <Truck size={24} className="text-orange-500" />;
      default: return <Leaf size={24} />;
    }
  };

  const currentChatMessages = activeListing ? messages.filter(m => m.listingId === activeListing.id) : [];
  const filteredListings = listings.filter(l => l.status === 'available' && l.giverId !== user?.id && (searchLocation === "" || l.location.toLowerCase().includes(searchLocation.toLowerCase())));
  const receiverHistory = listings.filter(l => l.claimedBy === user?.id && l.status === 'completed');
  const giverHistory = listings.filter(l => l.giverId === user?.id && l.status === 'completed');
  const activeGiverListings = listings.filter(l => l.giverId === user?.id && l.status !== 'completed');

  const renderModalContent = () => {
      if (!modalMode) return null;
      if (modalMode === 'pickup') return (
          <>
            <div className="bg-emerald-700 p-5 flex justify-between items-center shrink-0"><h3 className="text-white font-bold flex items-center gap-2 text-lg"><Navigation size={20} /> Pickup Planner</h3><button onClick={() => setModalMode(null)} className="text-emerald-200 hover:text-white bg-emerald-800/50 p-1 rounded-full"><X size={20}/></button></div><div className="p-6 md:p-8 overflow-y-auto"><h4 className="font-bold text-gray-800 text-xl mb-2 text-center">How will you pick this up?</h4><p className="text-sm text-gray-500 text-center mb-8">We calculate the net carbon impact of your trip.</p><div className="grid grid-cols-2 gap-4 mb-8">{(['walk', 'bike', 'transit', 'car'] as const).map(mode => (<button key={mode} onClick={() => { setSelectedTransport(mode); setPickupAnalysis(null); }} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${selectedTransport === mode ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md scale-105' : 'border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200'}`}>{mode === 'walk' && <Footprints size={28}/>}{mode === 'bike' && <Bike size={28}/>}{mode === 'transit' && <Bus size={28}/>}{mode === 'car' && <Car size={28}/>}<span className="capitalize font-bold text-sm">{mode === 'transit' ? 'Bus/Train' : mode}</span></button>))}</div>{selectedTransport && !pickupAnalysis && (<button onClick={analyzePickup} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 transition animate-fade-in">Analyze Trip Impact</button>)}{pickupAnalysis && (<div className="animate-fade-in space-y-4"><div className={`p-5 rounded-2xl border-2 ${pickupAnalysis.isWorthIt ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}><div className="flex items-center justify-center gap-2 mb-4">{pickupAnalysis.isWorthIt ? (<div className="bg-green-100 text-green-700 p-2.5 rounded-full"><ThumbsUp size={24} /></div>) : (<div className="bg-red-100 text-red-700 p-2.5 rounded-full"><ThumbsDown size={24} /></div>)}<span className={`text-2xl font-black ${pickupAnalysis.isWorthIt ? 'text-green-800' : 'text-red-800'}`}>{pickupAnalysis.isWorthIt ? 'Worth It!' : 'Not Recommended'}</span></div><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-gray-600 font-medium">Food Carbon Saved:</span><span className="font-bold text-emerald-600">+{activeListing?.carbonSaved}kg</span></div><div className="flex justify-between"><span className="text-gray-600 font-medium">Travel Emissions:</span><span className="font-bold text-red-500">-{pickupAnalysis.travelEmissions} kg</span></div><div className="border-t border-gray-300/50 pt-3 flex justify-between font-bold text-base"><span>Net Impact:</span><span className={pickupAnalysis.isWorthIt ? 'text-green-700' : 'text-red-700'}>{pickupAnalysis.netImpact > 0 ? '+' : ''}{pickupAnalysis.netImpact} kg</span></div></div></div>{!pickupAnalysis.isWorthIt && (<div className="flex items-start gap-2 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl"><AlertTriangle size={16} className="mt-0.5 shrink-0" />Driving for this pickup creates more pollution than saving the food prevents. Consider walking or biking!</div>)}<button onClick={handleConfirmClaim} className={`w-full py-4 rounded-xl font-bold shadow-lg text-white text-lg transition ${pickupAnalysis.isWorthIt ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 hover:bg-gray-500'}`}>{pickupAnalysis.isWorthIt ? 'Confirm & Claim' : 'Claim Anyway'}</button></div>)}</div>
          </>
      );
      if (modalMode === 'verify') return (<><div className="bg-emerald-700 p-5 flex justify-between items-center shrink-0"><h3 className="text-white font-bold flex items-center gap-2 text-lg"><ShieldCheck size={20} className="text-emerald-200" /> Verify Exchange</h3><button onClick={() => setModalMode(null)} className="text-emerald-200 hover:text-white bg-emerald-800/50 p-1 rounded-full"><X size={20} onClick={() => { setVerificationCode(""); setModalMode(null); }} /></button></div><div className="p-6 md:p-8"><div className="text-center mb-8"><div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm"><KeyRound size={36} /></div><h4 className="text-xl font-bold text-gray-800 mb-1">Enter Receiver's Eco-ID</h4><p className="text-sm text-gray-500">Ask the receiver for the 4-digit code to unlock your credits.</p></div><div className="space-y-6"><input type="text" maxLength={4} value={verificationCode} onChange={(e) => { setVerificationCode(e.target.value.replace(/[^0-9]/g, '')); setVerificationError(null); }} placeholder="0000" className="w-full text-center text-4xl font-mono tracking-[0.5em] p-6 bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner" />{verificationError && (<p className="text-red-500 text-sm text-center font-bold animate-pulse bg-red-50 py-2 rounded-lg">{verificationError}</p>)}<button onClick={handleVerifyCode} disabled={verificationCode.length !== 4} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5">Verify Code</button><button onClick={() => setModalMode(null)} className="w-full text-gray-400 font-bold text-sm py-2 hover:text-gray-600">Cancel</button></div></div></>);
      if (modalMode === 'rate') return (<><div className="bg-emerald-700 p-5 flex justify-between items-center shrink-0"><h3 className="text-white font-bold flex items-center gap-2 text-lg"><Star size={20} className="text-yellow-300 fill-yellow-300" /> Rate Receiver</h3></div><div className="p-6 md:p-8"><div className="text-center mb-8"><h4 className="text-2xl font-bold text-gray-800 mb-2">How was it?</h4><p className="text-gray-500">Rate {activeListing?.claimedBy ? "the receiver" : "the interaction"} to maintain community trust.</p></div><div className="flex justify-center gap-4 mb-10">{[1, 2, 3, 4, 5].map((star) => (<button key={star} onClick={() => setUserRating(star)} className="transition transform hover:scale-110 active:scale-95 group"><Star size={40} className={`${userRating >= star ? 'fill-yellow-400 text-yellow-500' : 'text-gray-200 group-hover:text-yellow-200'} transition-colors`} /></button>))}</div><button onClick={handleRateAndComplete} disabled={userRating === 0} className="w-full bg-emerald-800 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-emerald-900 transition disabled:opacity-50">Submit & Claim Credits</button></div></>);
      if (modalMode === 'claim') return (<><div className="bg-teal-700 p-5 flex justify-between items-center shrink-0"><h3 className="text-white font-bold flex items-center gap-2 text-lg"><ShieldCheck size={20} /> Claim Details</h3><button onClick={() => setModalMode(null)} className="text-teal-200 hover:text-white bg-teal-800/50 p-1 rounded-full"><X size={20}/></button></div><div className="p-0 overflow-y-auto"><div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center shadow-inner"><p className="opacity-90 font-medium mb-2 uppercase tracking-wide text-xs">Verified Carbon Impact</p><div className="flex items-center justify-center gap-2 text-4xl font-extrabold mb-1"><Leaf className="fill-white" size={32} />{activeListing?.carbonSaved}kg CO2</div><div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-medium mt-2 backdrop-blur-sm">Shared Credit: {(activeListing?.carbonSaved || 0) * 5} CC each</div></div><div className="p-6 md:p-8 space-y-6"><div className="flex items-center gap-5">{activeListing?.image ? (<img src={activeListing.image} alt="Food" className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shadow-sm" />) : (<div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300"><Leaf size={32}/></div>)}<div><h4 className="font-bold text-gray-900 text-xl">{activeListing?.title}</h4><p className="text-gray-500 font-medium">{activeListing?.quantity} Servings • {activeListing?.giverName}</p></div></div>{activeListing && (activeListing.ingredients || activeListing.caloriesPerServing) && (<div className="bg-orange-50 border border-orange-100 rounded-2xl p-5"><div className="flex items-center gap-2 mb-3"><Info size={18} className="text-orange-500"/><h5 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Nutrition Info</h5></div>{activeListing.caloriesPerServing && (<div className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2"><Flame size={16}/> Est. {activeListing.caloriesPerServing} kcal per serving</div>)}{activeListing.ingredients && (<div className="flex flex-wrap gap-2">{activeListing.ingredients.map((ing, i) => (<span key={i} className="text-xs bg-white border border-orange-200 text-gray-600 px-3 py-1.5 rounded-lg shadow-sm font-medium">{ing}</span>))}</div>)}</div>)}</div></div><div className="border-t border-b border-gray-100 py-6 space-y-5"><div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pickup Location</p><div className="flex items-start justify-between bg-gray-50 p-4 rounded-xl border border-gray-100"><div className="flex items-start gap-3 text-gray-800"><MapPin className="text-emerald-600 mt-1 shrink-0" size={20} /><div><p className="font-bold text-sm">{activeListing?.location}</p><p className="text-xs text-gray-500 mt-0.5">Approx. {activeListing?.distance} away</p></div></div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeListing?.location || "")}`} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline bg-blue-50 px-2 py-1 rounded">Directions <ExternalLink size={10} /></a></div></div><button onClick={() => setModalMode('message')} className="w-full bg-white text-emerald-700 py-4 rounded-xl font-bold border-2 border-emerald-100 flex items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 transition"><MessageCircle size={20} /> Chat to Coordinate</button></div>{activeListing?.status === 'claimed' && activeListing?.claimedBy === user?.id && (<div className="bg-gray-100 p-6 rounded-2xl text-center border border-gray-200"><p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-bold">Show this Eco-ID to Giver</p><span className="font-mono text-5xl font-black text-gray-800 tracking-widest">{claimedCode || activeListing.claimCode}</span></div>)}<button onClick={() => setModalMode(null)} className="w-full py-3 font-bold text-gray-400 hover:text-gray-600 transition">Close</button></>);
      if (modalMode === 'message') return (<><div className="bg-emerald-700 p-5 flex justify-between items-center shrink-0"><h3 className="text-white font-bold flex items-center gap-2 text-lg"><MessageCircle size={20} /> {activeListing?.giverName} {isTyping && <span className="text-[10px] font-normal opacity-80 animate-pulse ml-2 bg-emerald-800 px-2 py-0.5 rounded-full">typing...</span>}</h3><button onClick={() => setModalMode(null)} className="text-emerald-200 hover:text-white bg-emerald-800/50 p-1 rounded-full"><X size={20}/></button></div><div className="flex-1 bg-gray-50 p-4 md:p-6 overflow-y-auto">{currentChatMessages.length === 0 && (<div className="text-center py-10"><div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400"><MessageCircle size={24} /></div><p className="text-gray-400 text-sm font-medium">Start the conversation about picking up {activeListing?.title}.</p></div>)}{currentChatMessages.map((msg, idx) => { const isMe = msg.senderId === user?.id; return (<div key={idx} className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}><p className="leading-relaxed">{msg.text}</p><div className={`text-[10px] mt-1.5 text-right font-medium opacity-70`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div></div></div>); })}{isTyping && (<div className="flex justify-start mb-4"><div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div></div></div>)}<div ref={messagesEndRef} /></div><div className="p-4 bg-white border-t border-gray-100 shrink-0"><div className="flex gap-3"><input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="flex-1 p-4 bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition"/><button onClick={handleSendMessage} disabled={!messageText.trim()} className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition shadow-md hover:shadow-lg hover:-translate-y-0.5"><Send size={24} /></button></div></div></>);
      return null;
  };

  return (
    <div className="animate-fade-in relative">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Eco-Share Hub</h2>
        <p className="text-gray-500 mt-1">Reduce waste, earn Carbon Points.</p>
        <div className="flex justify-center mt-6">
            <div className="bg-gray-100 p-1.5 rounded-xl flex text-sm font-bold shadow-inner">
                <button onClick={() => { setUserRole('giver'); setAnalysis(null); setPointsEarned(null); setSelectedScenario(null); }} className={`px-8 py-2.5 rounded-lg transition-all duration-300 ${userRole === 'giver' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>I have food</button>
                <button onClick={() => { setUserRole('receiver'); setAnalysis(null); setPointsEarned(null); setSelectedScenario(null); }} className={`px-8 py-2.5 rounded-lg transition-all duration-300 ${userRole === 'receiver' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>I need food</button>
            </div>
        </div>
      </div>

      {userRole === 'receiver' ? (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-center gap-3 mb-8">
                 <button onClick={() => setReceiverTab('browse')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${receiverTab === 'browse' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200 hover:text-emerald-600'}`}><Search size={16} />Find Food</button>
                 <button onClick={() => setReceiverTab('history')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${receiverTab === 'history' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200 hover:text-emerald-600'}`}><HeartHandshake size={16} />My Impact</button>
             </div>

             {receiverTab === 'browse' ? (
                 <>
                    {listings.filter(l => l.status === 'claimed' && l.claimedBy === user?.id).length > 0 && (
                        <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6 mb-8 shadow-sm">
                            <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2 text-lg"><Clock size={20}/> Your Pending Pickups</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{listings.filter(l => l.status === 'claimed' && l.claimedBy === user?.id).map(item => (<div key={item.id} className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition flex justify-between items-center cursor-pointer group" onClick={() => handleViewClaimDetails(item)}><div className="flex items-center gap-4">{item.image ? <img src={item.image} alt="mini" className="w-14 h-14 rounded-lg object-cover" /> : <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center"><Leaf size={20} className="text-orange-300"/></div>}<div><p className="font-bold text-gray-800 group-hover:text-orange-600 transition">{item.title}</p><div className="flex items-center gap-2 text-xs mt-1"><span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded"><Leaf size={10}/> -{item.carbonSaved}kg</span></div></div></div><div className="bg-orange-100 text-orange-700 p-2 rounded-full group-hover:bg-orange-200 transition"><ShieldCheck size={20}/></div></div>))}</div>
                        </div>
                    )}

                    <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-xl"><MapPin size={24} className="text-emerald-600"/> Nearby Available Food</h3>
                            <div className="relative w-full md:w-64"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} placeholder="Filter by Zip Code..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium"/></div>
                        </div>
                        <div className="flex justify-end mb-4"><span className="text-sm font-medium text-gray-500">Showing {filteredListings.length} results</span></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredListings.length === 0 && (<div className="col-span-full py-24 text-center text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-100"><Leaf size={64} className="mx-auto mb-4 opacity-20" /><p className="text-lg font-medium">No food available in this location.</p><p className="text-sm opacity-60">Try changing your location filter.</p></div>)}
                            {filteredListings.map((item) => (
                                <div key={item.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                                    <div className="h-56 w-full overflow-hidden relative bg-gray-50">{item.image ? (<img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />) : (<div className="w-full h-full flex items-center justify-center text-gray-200"><Leaf size={64} /></div>)}<div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent opacity-70"></div><div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20"><Leaf size={12} className="fill-emerald-700"/> Saves {item.carbonSaved}kg</div>{item.caloriesPerServing && (<div className="absolute bottom-4 left-4 bg-emerald-950/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10"><Flame size={12} className="text-orange-400 fill-orange-400"/> {item.caloriesPerServing} kcal</div>)}</div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-3"><div className="flex-1"><h4 className="font-bold text-gray-900 text-xl leading-tight group-hover:text-emerald-700 transition line-clamp-1">{item.title}</h4><span className="text-xs font-bold text-gray-400 mt-1 block uppercase tracking-wide">{item.quantity} Servings</span></div><div className="flex flex-col items-end"><div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100"><Star size={12} className="fill-yellow-500 text-yellow-500" /><span className="font-bold text-xs">{item.giverRating.toFixed(1)}</span></div></div></div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-5 font-medium"><span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg"><MapPin size={14} className="text-gray-400"/> {item.location.split(',')[0]}</span><span className="bg-gray-50 px-2.5 py-1.5 rounded-lg">{item.distance} away</span></div>
                                        {item.ingredients && item.ingredients.length > 0 && (<div className="mb-6 flex-1"><div className="flex flex-wrap gap-2">{item.ingredients.slice(0, 3).map((ing, i) => (<span key={i} className="text-[10px] font-bold bg-white text-gray-600 px-2.5 py-1 rounded-md border border-gray-100 shadow-sm">{ing}</span>))}{item.ingredients.length > 3 && (<span className="text-[10px] font-bold text-gray-400 px-1 py-1">+{item.ingredients.length - 3} more</span>)}</div></div>)}
                                        <div className="mt-auto grid grid-cols-2 gap-3"><button onClick={() => handleMessage(item)} className="bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition">Message</button><button onClick={() => handleInitClaim(item)} className="bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition">Claim</button></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </>
             ) : (
                 <div>
                     <h3 className="font-bold text-gray-800 text-xl mb-6 flex items-center gap-2"><History size={24} className="text-emerald-600"/> My Rescued Food</h3>
                     {receiverHistory.length === 0 ? (<div className="text-center py-20 bg-white rounded-3xl border border-gray-100"><Leaf size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">You haven't rescued any food yet.</p><p className="text-sm text-gray-400">Start browsing to make an impact!</p></div>) : (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{receiverHistory.map(item => (<div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col group hover:shadow-md transition"><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><CheckCircle size={20}/></div><div><h4 className="font-bold text-gray-800 line-clamp-1">{item.title}</h4><p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p></div></div><span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">-{item.carbonSaved}kg CO2</span></div><div className="mt-auto pt-4 border-t border-gray-50 text-xs text-gray-500 flex justify-between"><span>From: {item.giverName}</span><span className="font-medium text-emerald-600">Completed</span></div></div>))}</div>)}
                 </div>
             )}
          </div>
      ) : (
          <div className="animate-fade-in">
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="flex justify-between items-center lg:hidden"><button onClick={handleOpenVerify} className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 hover:bg-emerald-100 transition"><ShieldCheck size={16} /> Verify Exchange</button></div>
                    {!analysis ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                            <h3 className="font-bold text-gray-800 mb-6 text-xl flex items-center gap-2"><Plus className="bg-emerald-100 text-emerald-600 rounded-full p-1" size={24}/> Post a Listing</h3>
                            <div className="space-y-5">
                                <div className="relative"><label className="block text-sm font-bold text-gray-700 mb-2">What food do you have?</label><div className="flex gap-2"><input type="text" value={dishName} onChange={(e) => setDishName(e.target.value)} placeholder="e.g. Leftover Lasagna" className="flex-1 p-3.5 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"/><button onClick={handlePredictDish} disabled={isPredicting || !dishName} className="bg-purple-50 text-purple-700 border border-purple-100 p-3.5 rounded-xl hover:bg-purple-100 transition active:scale-95 disabled:opacity-50 shadow-sm" title="Auto-detect Ingredients">{isPredicting ? <Loader2 className="animate-spin" size={24}/> : <Wand2 size={24}/>}</button></div></div>
                                {refinements.length > 0 && (<div className="bg-purple-50 p-5 rounded-xl border border-purple-100 animate-fade-in"><h4 className="text-purple-900 font-bold text-sm mb-3 flex items-center gap-2"><ChefHat size={16}/> Refine Details</h4><div className="space-y-3">{refinements.map((ref, idx) => (<div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-purple-100"><p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">{ref.category}</p><div className="flex flex-wrap gap-2">{ref.options.map((opt, oIdx) => (<button key={oIdx} onClick={() => handleRefineIngredient(ref.targetIngredient, opt)} className="text-xs font-medium bg-gray-50 hover:bg-purple-600 hover:text-white border border-gray-200 px-3 py-1.5 rounded-full transition">{opt}</button>))}</div></div>))}</div></div>)}
                                {(ingredients.length > 0 || calories !== null) && (<div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50"><div className="flex justify-between items-center mb-3"><label className="text-sm font-bold text-gray-700">Ingredients</label>{calories && (<span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1"><Flame size={12} /> ~{calories} kcal</span>)}</div><div className="flex flex-wrap gap-2 mb-4">{ingredients.map((ing, idx) => (<span key={idx} className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm font-medium">{ing}<button onClick={() => handleRemoveIngredient(idx)} className="hover:text-red-500 ml-1 bg-gray-100 rounded-full p-0.5"><X size={10}/></button></span>))}</div><div className="flex gap-2"><input type="text" value={newIngredient} onChange={(e) => setNewIngredient(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()} placeholder="Add extra ingredient..." className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"/><button onClick={handleAddIngredient} className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition"><Plus size={16}/></button></div></div>)}
                                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-gray-700 mb-2">Servings</label><input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} className="w-full p-3.5 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"/></div><div><label className="block text-sm font-bold text-gray-700 mb-2">Zip Code</label><div className="relative"><input type="text" placeholder="Zip" value={zipCode} onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, ''))} maxLength={5} className="w-full p-3.5 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"/>{isZipLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600"/>}</div></div></div>
                                <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Address</label><div className="relative group z-20"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Start typing your address..." value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} onFocus={() => setIsAddressFocused(true)} onBlur={() => setTimeout(() => setIsAddressFocused(false), 200)} className="w-full pl-10 pr-3 py-3.5 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition"/>{showSuggestions && addressSuggestions.length > 0 && (<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">{addressSuggestions.map((suggestion, idx) => (<button key={idx} type="button" onClick={() => handleSelectAddress(suggestion)} className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm text-gray-700 font-medium flex items-center gap-2"><Navigation size={14} className="text-emerald-500" /> {suggestion}</button>))}</div>)}</div>{city && (<div className="flex gap-2 text-xs font-bold text-gray-400 bg-gray-50 p-2 rounded-lg"><span>{city}, {state}, {country}</span></div>)}</div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">Photo (Optional)</label><label className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition h-32 relative overflow-hidden group bg-gray-50">{foodImage ? (<img src={foodImage} alt="Preview" className="w-full h-full object-cover absolute top-0 left-0" />) : (<><Camera size={24} className="text-gray-400 mb-2 group-hover:text-emerald-500 transition" /><span className="text-xs text-gray-400 font-medium group-hover:text-emerald-600">Tap to upload picture</span></>)}{foodImage && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="text-white text-xs font-bold">Change Photo</span></div>)}<input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label></div>
                                
                                <button onClick={handleAnalyze} disabled={!dishName || !streetAddress || !city || isLoading || ingredients.length === 0} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed relative">{isLoading ? <Loader2 className="animate-spin" /> : <Recycle />}Calculate Impact</button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
                            {pointsEarned ? (<div className="text-center py-10"><div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pop-in"><Award size={48} /></div><h3 className="text-3xl font-extrabold text-gray-800 mb-2">+{pointsEarned} Carbon Credits!</h3><p className="text-gray-500 mb-8">Transaction Verified & Added to Wallet</p><button onClick={() => { setAnalysis(null); setPointsEarned(null); setFoodImage(undefined); setIngredients([]); setCalories(null); setRefinements([]); }} className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-emerald-700 transition">Post Another</button></div>) : (
                                <>
                                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-6 text-white shadow-lg mb-6"><div className="flex items-start gap-4"><div className="bg-white/20 p-3 rounded-full"><Leaf size={32} className="text-emerald-100" /></div><div><h3 className="text-lg font-bold text-white mb-1">Eco Recommendation</h3><p className="text-emerald-50 leading-relaxed text-sm">{analysis.recommendation}</p></div></div></div>
                                <div><h3 className="font-bold text-gray-800 text-lg mb-4">Choose Action</h3><div className="space-y-3">{analysis.scenarios.map((scenario, idx) => (<div key={idx} className={`relative p-4 rounded-xl border-2 transition-all ${scenario.isRecommended ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>{scenario.isRecommended && (<div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Best Choice</div>)}<div className="flex items-center gap-4"><div className={`p-3 rounded-full ${scenario.isRecommended ? 'bg-emerald-100' : 'bg-gray-50'}`}>{getIcon(scenario.icon)}</div><div className="flex-1"><div className="flex justify-between items-center mb-1"><h4 className="font-bold text-gray-800 text-sm">{scenario.action}</h4><span className="font-mono text-sm font-bold text-gray-600">{scenario.co2e} kg</span></div><p className="text-xs text-gray-500">{scenario.description}</p></div></div>{selectedScenario === scenario ? (<div className="mt-4 flex gap-2 animate-fade-in">{(scenario.icon !== 'trash' && scenario.icon !== 'snowflake') ? (<><button onClick={handlePostListing} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-700 transition">Post to Hub</button><button onClick={handleOpenVerify} className="flex-1 bg-white border border-emerald-600 text-emerald-700 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-50 transition">Direct Trade</button></>) : (<button onClick={() => initiateAction(scenario)} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-700 transition">Confirm Action</button>)}</div>) : (<button onClick={() => initiateAction(scenario)} className="w-full mt-3 py-2 rounded-lg text-sm font-bold border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-500 transition">Select</button>)}</div>))}</div></div>
                                <button onClick={() => { setAnalysis(null); setSelectedScenario(null); setFoodImage(undefined); }} className="text-gray-400 font-bold hover:text-gray-600 text-sm mx-auto block mt-6">Cancel</button>
                                </>
                            )}
                        </div>
                    )}
                  </div>

                  <div className="lg:col-span-7">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-xl"><Clock size={24} className="text-emerald-600" /> My Listings</h3>
                        <div className="flex items-center gap-2"><div className="flex bg-gray-100 p-1 rounded-lg"><button onClick={() => setGiverTab('active')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${giverTab === 'active' ? 'bg-white shadow text-emerald-800' : 'text-gray-500'}`}>Active</button><button onClick={() => setGiverTab('history')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${giverTab === 'history' ? 'bg-white shadow text-emerald-800' : 'text-gray-500'}`}>History</button></div><button onClick={handleOpenVerify} className="hidden lg:flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition shadow-sm"><ShieldCheck size={16} /> Verify</button></div>
                      </div>

                      {giverTab === 'active' ? (
                          <>
                            {activeGiverListings.length === 0 ? (<div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center"><Leaf size={64} className="text-gray-200 mb-4" /><p className="text-gray-500 font-medium text-lg">No active listings.</p><p className="text-sm text-gray-400 mt-2">Post new food to share!</p></div>) : (<div className="grid md:grid-cols-2 gap-4">{activeGiverListings.map(item => (<div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 transition group hover:shadow-lg relative"><button onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }} className="absolute top-2 right-2 p-1.5 text-gray-400 bg-white border border-gray-200 rounded-lg hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition z-10 shadow-sm" title="Remove Post"><Trash2 size={16} /></button><div className="flex items-start gap-4">{item.image ? (<img src={item.image} alt={item.title} className="w-20 h-20 rounded-xl object-cover shadow-sm" />) : (<div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100"><Leaf size={24} className="text-gray-300" /></div>)}<div className="flex-1 min-w-0"><div className="flex justify-between items-start pr-6"><h4 className="font-bold text-gray-800 text-lg truncate group-hover:text-emerald-700 transition">{item.title}</h4></div><div className="flex items-center gap-2 mt-1 mb-2">{item.status === 'claimed' ? (<span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">Claimed</span>) : (<span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">Active</span>)}<span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span></div>{item.status === 'claimed' && (<div className="mt-2 bg-orange-50 p-2 rounded-lg border border-orange-100"><p className="text-xs text-orange-600 font-bold mb-2 flex items-center gap-1"><Truck size={12}/> Pickup via {item.pickupMethod}</p><div className="text-xs text-gray-600 mb-2">Claimed by: <strong>{item.claimedByName}</strong></div><button onClick={handleOpenVerify} className="w-full text-xs bg-white text-orange-700 font-bold py-2 rounded-lg border border-orange-200 hover:bg-orange-100 transition shadow-sm">Verify Code</button></div>)}</div></div></div>))}</div>)}
                          </>
                      ) : (
                          <>
                            {giverHistory.length === 0 ? (<div className="text-center py-20 bg-white rounded-3xl border border-gray-100"><History size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">No completed exchanges yet.</p></div>) : (<div className="space-y-4">{giverHistory.map(item => (<div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between opacity-80 hover:opacity-100 transition"><div className="flex items-center gap-4"><div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><CheckCircle size={20}/></div><div><h4 className="font-bold text-gray-800">{item.title}</h4><p className="text-xs text-gray-500">Given to: {item.claimedByName} • {new Date(item.createdAt).toLocaleDateString()}</p></div></div><div className="text-right"><span className="block font-bold text-emerald-600 text-sm">Completed</span><span className="text-xs text-gray-400">Saved {item.carbonSaved}kg CO2</span></div></div>))}</div>)}
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {listingToDelete && (<div className="fixed inset-0 bg-emerald-950/40 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm" onClick={() => setListingToDelete(null)}><div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}><div className="text-center"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={24} className="text-red-500" /></div><h3 className="text-lg font-bold text-gray-900 mb-2">Remove Listing?</h3><p className="text-sm text-gray-500 mb-6">Are you sure you want to delete <span className="font-bold">{listingToDelete.title}</span>? This action cannot be undone.</p><div className="flex gap-3"><button onClick={() => setListingToDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition">Cancel</button><button onClick={handleConfirmDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 border border-transparent transition">Delete</button></div></div></div></div>)}

      {modalMode && (
        <div className="fixed inset-0 bg-emerald-950/40 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm" onClick={() => { if(modalMode !== 'rate') { setModalMode(null); setVerificationCode(""); setActiveListing(null); setPickupAnalysis(null); } }}>
            <div className={`bg-white rounded-3xl w-full max-w-sm md:max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col ${modalMode === 'message' ? 'h-[600px]' : ''}`} onClick={e => e.stopPropagation()}>
                {renderModalContent()}
            </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHub;

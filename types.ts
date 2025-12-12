
export enum HealthGoal {
  GeneralHealth = "General Health",
  WeightLoss = "Weight Loss",
  LowCarb = "Low Carb",
  LowTriglycerides = "Lower Triglycerides/Cholesterol",
  MuscleGain = "Muscle Gain",
  DiabeticFriendly = "Diabetic Friendly"
}

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
export type CuisineType = "Global" | "Indian" | "Thai" | "Asian" | "Chinese" | "Italian" | "European" | "Mediterranean" | "Japanese" | "Korean" | "Lebanese" | "American" | "Mexican";
export type TransportMode = 'walk' | 'bike' | 'transit' | 'car';

// KYOTO / INTERNATIONAL STANDARDS - SIMPLIFIED FOR CLOSED LOOP
export type CarbonStandard = 'ReplateIQ Verified' | 'Gold Standard' | 'VCS'; 

export enum ProjectCategory {
  AvoidedEmissions = "Avoided Food Waste Emissions"
}

export interface CarbonProject {
  id: string;
  name: string;
  category: ProjectCategory;
  location: string;
  country: string;
  standard: CarbonStandard;
  methodology: string; // e.g. "ReplateIQ-Methane-Avoidance-001"
  sdgGoals: number[]; // e.g. [12, 13]
  image: string;
  description: string;
}

export interface PointTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'earned' | 'redeemed' | 'sold' | 'bought' | 'retired' | 'listed';
  verificationHash?: string; // Ledger Hash
  standard?: CarbonStandard;
  vintage?: number; 
  serialNumber?: string;
}

export interface TradeOffer {
    id: string;
    enterpriseId: string;
    enterpriseName: string;
    targetUserId: string; // The user receiving the offer
    region: string; // For context
    amount: number; // Credits requested
    pricePerCredit: number; // The Bid
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    createdAt: string;
}

export interface B2BListing {
    id: string;
    sellerId: string;
    sellerName: string;
    sellerVerified: boolean;
    amount: number;
    pricePerCredit: number;
    project: CarbonProject; // Always ReplateIQ Community Project
    vintage: number;
    serialNumberRange: string;
    status: 'active' | 'sold' | 'retired';
    createdAt: string;
}

export interface RetirementCertificate {
    id: string;
    beneficiary: string;
    amount: number;
    project: string;
    vintage: number;
    serialNumber: string;
    date: string;
    hash: string;
}

export interface User {
  id: string;
  role?: 'user' | 'enterprise'; 
  walletId?: string; 
  email: string;
  password?: string; 
  name: string;
  location: string;
  avatar?: string;
  walletBalance: number; // For Enterprise: Active Inventory
  retiredBalance?: number; // For Enterprise: Retired/Offset Inventory
  pointsHistory: PointTransaction[];
  rating: number;
  ratingCount: number;
  kycVerified?: boolean; // Regulatory Requirement
}

export interface UserProfile {
  name: string;
  restrictions: string[];
  healthGoals: HealthGoal[];
}

export interface HealthySwap {
  original: string;
  replacement: string;
  reason: string;
  calorieReduction: string;
}

export interface NutritionMetrics {
  calories: number;
  protein: string;
  carbs: string;
  fats: string;
}

export interface AlternativeDish {
  name: string;
  description: string;
}

export interface Recipe {
  id?: string;
  createdAt?: string;
  recipeName: string;
  description: string;
  ingredients: string[];
  missingIngredients?: string[]; 
  flexibleIngredients?: string[]; 
  instructions: string[];
  nutrition: {
    standard: NutritionMetrics;
    healthy: NutritionMetrics;
  };
  healthTips: string[];
  healthySwaps: HealthySwap[];
  alternativeDishes: AlternativeDish[]; 
  matchScore?: number;
}

export type ViewMode = 'pantry' | 'dish-search' | 'profile' | 'community';

export interface CarbonScenario {
  action: string;
  co2e: number;
  description: string;
  icon: 'trash' | 'snowflake' | 'bike' | 'car' | 'walk';
  isRecommended: boolean;
}

export interface CarbonAnalysis {
  dishName: string;
  quantity: number;
  scenarios: CarbonScenario[];
  recommendation: string;
  impactSummary: string;
}

export interface FoodListing {
  id: string;
  title: string;
  quantity: number;
  ingredients?: string[]; 
  caloriesPerServing?: number;
  image?: string;
  giverId: string;
  giverName: string;
  giverRating: number;
  location: string;
  distance: string;
  tags: string[];
  status: 'available' | 'claimed' | 'completed';
  claimCode?: string;
  claimedBy?: string;
  claimedByName?: string;
  pickupMethod?: string;
  carbonSaved: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  listingId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface DishPrediction {
  ingredients: string[];
  calories: number;
  refinements: {
    category: string; 
    targetIngredient: string; 
    options: string[]; 
  }[];
}

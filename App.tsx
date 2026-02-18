
import React, { useState, useEffect } from 'react';
import { UserProfile, ViewMode, Recipe, HealthGoal, MealType, CuisineType } from './types';
import { generateRecipeFromIngredients, analyzeDish } from './services/geminiService';
import { useAuth } from './contexts/AuthContext';
import AuthScreen from './components/AuthScreen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import ProfileSettings from './components/ProfileSettings';
import RecipeCard from './components/RecipeCard';
import CommunityHub from './components/CommunityHub';
import LandingPage from './components/LandingPage';
import EnterpriseDashboard from './components/EnterpriseDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
// import LifetimeGate from './components/subscription/LifetimeGate';
import DevTools from './components/dev/DevTools';
import { ChefHat, Search, User, Plus, X, Loader2, Sparkles, ScanLine, LogOut, Sun, Moon, Coffee, Sunset, Leaf, Star, LayoutDashboard, ChevronRight, Settings, Wallet, History, Globe, ChevronDown, ListPlus, AlertTriangle } from 'lucide-react';

const INITIAL_PROFILE: UserProfile = {
  name: "Guest",
  restrictions: [],
  healthGoals: [HealthGoal.GeneralHealth]
};

// --- CONFIGURATION ---
// Set this to FALSE for Production (Hides Developer Tools)
const DEBUG_MODE = false;


function App() {
  const { user, logout, isLoading: isAuthLoading, pendingOfferCount } = useAuth();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#FFFFFF' });
      StatusBar.setOverlaysWebView({ overlay: false });
    }
  }, []);

  const [showLanding, setShowLanding] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [history, setHistory] = useState<Recipe[]>([]);
  const [view, setView] = useState<ViewMode>('pantry');
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [dishSearch, setDishSearch] = useState("");
  const [mealType, setMealType] = useState<MealType>("Dinner");
  const [cuisine, setCuisine] = useState<CuisineType>("Global");
  const [loadingState, setLoadingState] = useState<'pantry' | 'analyze' | null>(null);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setShowLanding(false);
      const key = `replateiq_profile_${user.id}`;
      const savedProfile = localStorage.getItem(key);
      let loadedProfile = INITIAL_PROFILE;
      if (savedProfile) { loadedProfile = JSON.parse(savedProfile); }
      // FORCE NAME FROM AUTH USER
      setProfile({ ...loadedProfile, name: user.name });
      const savedHistory = localStorage.getItem(`replateiq_history_${user.id}`);
      if (savedHistory) setHistory(JSON.parse(savedHistory)); else setHistory([]);
    } else {
      setProfile(INITIAL_PROFILE); setHistory([]); setGeneratedRecipe(null); setPantryItems([]); setView('pantry');
    }
  }, [user]);

  useEffect(() => { if (user) { localStorage.setItem(`replateiq_profile_${user.id}`, JSON.stringify(profile)); } }, [profile, user]);

  const saveToHistory = (recipe: Recipe) => {
    if (!user) return;
    const newHistory = [recipe, ...history];
    setHistory(newHistory);
    localStorage.setItem(`replateiq_history_${user.id}`, JSON.stringify(newHistory));
  };

  const handleAddItem = () => { if (newItem.trim()) { setPantryItems([...pantryItems, newItem.trim()]); setNewItem(""); } };
  const handleRemoveItem = (index: number) => { const newItems = [...pantryItems]; newItems.splice(index, 1); setPantryItems(newItems); };

  const handleGenerateFromPantry = async (specificDishName?: string) => {
    if (pantryItems.length === 0) { setError("Please add at least one ingredient."); return; }
    setLoadingState('pantry'); setError(null); setGeneratedRecipe(null);
    try {
      const recipe = await generateRecipeFromIngredients(pantryItems, profile, mealType, cuisine, specificDishName);
      setGeneratedRecipe(recipe); saveToHistory(recipe);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { setLoadingState(null); }
  };

  const handleDishAnalysis = async (dishName?: string) => {
    const term = dishName || dishSearch;
    if (!term.trim()) return;
    setLoadingState('analyze'); setError(null); setGeneratedRecipe(null);
    try {
      const recipe = await analyzeDish(term, profile);
      setGeneratedRecipe(recipe); saveToHistory(recipe);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { setLoadingState(null); }
  };

  const handleSelectAlternative = (altDishName: string) => { if (view === 'pantry' && pantryItems.length > 0) { handleGenerateFromPantry(altDishName); } else { handleDishAnalysis(altDishName); } };

  // CHANGED: Redirect to AuthScreen (showLanding = false) on logout
  const handleLogout = () => {
    logout();
    setShowLanding(false);
  };

  if (isAuthLoading) { return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>; }
  if (!user) { if (showLanding) return <LandingPage onGetStarted={() => setShowLanding(false)} onLogin={() => setShowLanding(false)} />; return <AuthScreen onBackToLanding={() => setShowLanding(true)} />; }
  if (user.role === 'enterprise') { return <EnterpriseDashboard />; }

  const NavItem = ({ mode, icon, label, badgeCount }: { mode: ViewMode, icon: React.ReactNode, label: string, badgeCount?: number }) => (
    <button onClick={() => { setView(mode); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${view === mode ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 font-medium'}`}>
      <div className={`transition-transform duration-200 ${view === mode ? 'scale-110 text-emerald-600' : 'group-hover:scale-110 text-gray-400'}`}>{icon}</div><span className="text-sm">{label}</span>
      {badgeCount && badgeCount > 0 ? (<div className="absolute right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">{badgeCount}</div>) : null}
      {view === mode && !badgeCount && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
  );

  const LoadingScreen = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-emerald-600 animate-fade-in"><Loader2 size={48} className="animate-spin mb-4" /><p className="text-xl font-bold text-emerald-950 animate-pulse">{text}</p><div className="mt-6 space-y-3 text-gray-500 text-center max-w-md bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div><p>Calculating standard calories & macros...</p></div><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 animate-ping delay-75"></div><p>Identifying healthy ingredient swaps...</p></div><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-purple-500 animate-ping delay-150"></div><p>Generating alternative dish ideas...</p></div></div></div>
  );

  const renderContent = () => {
    if (view === 'community') return (
      <ErrorBoundary>
        <CommunityHub />
      </ErrorBoundary>
    );
    if (view === 'profile') return (<div className="max-w-6xl mx-auto"><ProfileSettings profile={profile} history={history} onSave={(p) => { setProfile(p); setView('pantry'); }} onSelectHistory={(r) => { setGeneratedRecipe(r); setView('pantry'); }} onLogout={handleLogout} /></div>);
    if (view === 'dish-search') {
      if (loadingState === 'analyze') return <LoadingScreen text="Analyzing Dish..." />;
      if (generatedRecipe) return (<div className="max-w-5xl mx-auto animate-fade-in pb-10"><button onClick={() => setGeneratedRecipe(null)} className="mb-6 text-emerald-600 font-bold hover:underline flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-emerald-50 w-fit transition">← Back to Search</button><RecipeCard recipe={generatedRecipe} onSelectAlternative={handleSelectAlternative} /></div>);
      return (<div className="max-w-4xl mx-auto pt-8 px-4 animate-fade-in"><div className="text-center mb-10"><h2 className="text-4xl font-extrabold text-emerald-950 mb-4 tracking-tight">Analyze & Optimize</h2><p className="text-emerald-800/70 text-lg max-w-2xl mx-auto">Enter a dish name to uncover its nutritional profile and get healthy, tailored alternatives.</p></div><div className="bg-white p-2 rounded-2xl shadow-xl shadow-emerald-900/5 border border-emerald-100/50 flex items-center mb-12 transform hover:scale-[1.005] transition duration-300 focus-within:ring-2 focus-within:ring-emerald-500/20"><Search className="ml-4 text-emerald-500" size={24} /><input type="text" value={dishSearch} onChange={(e) => setDishSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleDishAnalysis()} placeholder="e.g. Lasagna, Butter Chicken, Caesar Salad" className="flex-1 p-4 bg-transparent outline-none text-lg text-emerald-950 placeholder-emerald-800/40 font-medium" /><button onClick={() => handleDishAnalysis()} disabled={!dishSearch.trim()} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-200">Analyze</button></div><div className="grid md:grid-cols-2 gap-6"><div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition group"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition"><ScanLine size={24} /></div><h4 className="font-bold text-blue-900 mb-2 text-lg">Deep Insights</h4><p className="text-blue-800/80 leading-relaxed">We break down the calories, protein, carbs, and fats of the standard recipe so you know exactly what you're eating.</p></div><div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 hover:shadow-lg transition group"><div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition"><Sparkles size={24} /></div><h4 className="font-bold text-emerald-900 mb-2 text-lg">Smart Swaps</h4><p className="text-emerald-800/80 leading-relaxed">Based on your profile ({profile.healthGoals[0]}), we suggest ingredient swaps to lower triglycerides or carbs without losing flavor.</p></div></div></div>);
    }
    if (loadingState === 'pantry') return <LoadingScreen text="Consulting AI Nutritionist..." />;
    if (generatedRecipe) return (<div className="max-w-5xl mx-auto animate-fade-in pb-10"><button onClick={() => setGeneratedRecipe(null)} className="mb-6 text-emerald-600 font-bold hover:underline flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-emerald-50 w-fit transition">← Back to Kitchen</button><RecipeCard recipe={generatedRecipe} onSelectAlternative={handleSelectAlternative} /></div>);

    return (
      <div className="max-w-5xl mx-auto pt-4 px-4 animate-fade-in">
        <div className="text-center mb-10"><h2 className="text-4xl font-extrabold text-emerald-950 tracking-tight mb-3">What's in your kitchen?</h2><p className="text-emerald-800/70 text-lg">Add ingredients, set the time, and let AI generate a recipe.</p></div>
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Meal Time</label><div className="grid grid-cols-2 gap-3">{(['Breakfast', 'Lunch', 'Snack', 'Dinner'] as MealType[]).map((t) => (<button key={t} onClick={() => setMealType(t)} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border-2 ${mealType === t ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{t === 'Breakfast' && <Coffee size={24} className="mb-2" />}{t === 'Lunch' && <Sun size={24} className="mb-2" />}{t === 'Snack' && <ChefHat size={24} className="mb-2" />}{t === 'Dinner' && <Sunset size={24} className="mb-2" />}<span className="text-xs font-bold">{t}</span></button>))}</div></div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Cuisine Preference</label><div className="relative"><Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={20} /><select value={cuisine} onChange={(e) => setCuisine(e.target.value as CuisineType)} className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 font-bold appearance-none cursor-pointer transition hover:bg-gray-100"><option value="Global">Global (Surprise Me)</option><option value="Indian">Indian</option><option value="Italian">Italian</option><option value="Mexican">Mexican</option><option value="Chinese">Chinese</option><option value="Thai">Thai</option><option value="Japanese">Japanese</option><option value="Asian">Asian (General)</option><option value="European">European</option><option value="Mediterranean">Mediterranean</option><option value="Korean">Korean</option><option value="Lebanese">Lebanese</option><option value="American">American</option></select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} /></div></div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Available Ingredients</label><div className="flex gap-2"><input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddItem()} placeholder="e.g. Eggs, Avocado, Dal" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-emerald-900 font-medium placeholder-emerald-800/40" /><button onClick={() => handleAddItem()} className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition active:scale-95 shadow-md shadow-emerald-100"><Plus size={24} /></button></div></div>
          </div>
          <div className="lg:col-span-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full opacity-50 -z-0"></div>
              <div className="relative z-10 flex flex-col h-full"><label className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2"><LayoutDashboard size={16} /> Your Pantry List</label><div className="flex flex-wrap gap-3 mb-4 flex-1 content-start">{pantryItems.map((item, idx) => (<span key={`item-${idx}`} className="bg-white text-emerald-900 border border-emerald-100 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 animate-pop-in hover:shadow-md transition cursor-default shadow-sm group">{item}<button onClick={() => handleRemoveItem(idx)} className="text-emerald-300 hover:text-red-500 transition"><X size={16} /></button></span>))}{pantryItems.length === 0 && (<div className="w-full flex-1 flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50"><ChefHat size={48} className="mb-4 opacity-20" /><span className="text-lg font-medium opacity-50">Your pantry is empty</span><span className="text-sm opacity-40">Add ingredients from the left panel</span></div>)}</div><button onClick={() => handleGenerateFromPantry()} disabled={pantryItems.length === 0} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:-translate-y-1 active:scale-[0.99]"><Sparkles size={24} />Generate {cuisine !== 'Global' ? cuisine : ''} {mealType} Recipe</button></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* <LifetimeGate /> */}
      {DEBUG_MODE && <DevTools />}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 h-screen sticky top-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 pb-4"><div className="flex items-center gap-3 mb-2 cursor-pointer group" onClick={() => setView('pantry')}><div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform"><ChefHat size={28} /></div><h1 className="text-xl font-extrabold tracking-tight text-emerald-950 group-hover:text-emerald-700 transition-colors">ReplateIQ.ai</h1></div><p className="text-xs text-gray-400 font-medium pl-1">Eat Smarter. Live Better.</p></div>
        <nav className="flex-1 px-4 space-y-2 py-6"><NavItem mode="pantry" icon={<LayoutDashboard size={20} />} label="My Kitchen" /><NavItem mode="dish-search" icon={<Search size={20} />} label="Analyze Dish" /><NavItem mode="community" icon={<Leaf size={20} />} label="Eco-Share Hub" /><div className="pt-6 mt-6 border-t border-gray-100"><p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account</p><NavItem mode="profile" icon={<User size={20} />} label="Profile & Wallet" badgeCount={pendingOfferCount} /></div></nav>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50"><div className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-gray-100/80 p-2 -mx-2 rounded-xl transition-all group" onClick={() => setView('profile')}>{user.avatar ? (<img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-emerald-200 transition-colors" />) : (<div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border-2 border-white shadow-sm group-hover:bg-emerald-200 transition-colors">{user.name.charAt(0)}</div>)}<div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">{user.name}</p><div className="flex items-center gap-1 text-xs text-emerald-600 mt-0.5"><Leaf size={10} className="fill-emerald-500 text-emerald-500" /><span className="font-bold">{user.walletBalance} CC</span></div></div></div><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-emerald-900/60 bg-emerald-50/50 border border-emerald-100/50 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 shadow-sm"><LogOut size={14} className="opacity-70 group-hover:opacity-100" /> Sign Out</button></div>
      </aside>
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="md:hidden bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-200 px-4 py-3 flex items-center justify-between"><div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('pantry')}><div className="bg-emerald-600 text-white p-1.5 rounded-lg"><ChefHat size={18} /></div><h1 className="text-lg font-bold text-emerald-900">ReplateIQ.ai</h1></div><div className="flex items-center gap-3 cursor-pointer relative" onClick={() => setView('profile')}><div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100"><Leaf size={14} className="fill-emerald-400 text-emerald-500" /><span className="text-xs font-bold text-emerald-700">{user.walletBalance} CC</span></div><div className="relative">{user.avatar ? (<img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />) : (<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">{user.name.charAt(0)}</div>)}{pendingOfferCount > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}</div></div></header>
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 bg-gray-50/50"><div className="max-w-7xl mx-auto">{error && (<div className="bg-orange-50 text-orange-600 p-4 rounded-xl border border-orange-100 mb-6 flex items-center justify-between animate-fade-in shadow-sm"><span className="flex items-center gap-2 font-medium"><div className="w-2 h-2 rounded-full bg-orange-500" /> {error}</span><button onClick={() => setError(null)} className="p-1 hover:bg-orange-100 rounded-lg"><X size={18} /></button></div>)}{renderContent()}</div></main>
      </div>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50"><div className="flex justify-around items-center h-16 max-w-lg mx-auto"><button onClick={() => { setView('pantry'); }} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'pantry' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}><LayoutDashboard size={24} strokeWidth={view === 'pantry' ? 2.5 : 2} /><span className="text-[10px] font-medium">Kitchen</span></button><button onClick={() => { setView('dish-search'); }} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'dish-search' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}><Search size={24} strokeWidth={view === 'dish-search' ? 2.5 : 2} /><span className="text-[10px] font-medium">Analyze</span></button><button onClick={() => { setView('community'); }} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'community' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}><Leaf size={24} strokeWidth={view === 'community' ? 2.5 : 2} /><span className="text-[10px] font-medium">Eco-Share</span></button><button onClick={() => { setView('profile'); }} className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${view === 'profile' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'} relative`}><User size={24} strokeWidth={view === 'profile' ? 2.5 : 2} />{pendingOfferCount > 0 && <div className="absolute top-1 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce" />}<span className="text-[10px] font-medium">Profile</span></button></div></nav>
      <style>{`.pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); } @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } @keyframes pop-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fade-in { animation: fade-in 0.4s ease-out forwards; } .animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }`}</style>
    </div>
  );
}

export default App;

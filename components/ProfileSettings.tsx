
import React, { useState } from 'react';
import { UserProfile, HealthGoal, Recipe } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Save, User, Clock, ChevronRight, Settings, Wallet, ShoppingBag, Camera, LogOut, Building2, Heart, X, CheckCircle, Loader2, Copy, History, ChefHat, TrendingUp, HandCoins, ArrowUpDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface ProfileSettingsProps {
  profile: UserProfile;
  history: Recipe[];
  onSave: (profile: UserProfile) => void;
  onSelectHistory: (recipe: Recipe) => void;
  onLogout: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, history, onSave, onSelectHistory, onLogout }) => {
  const { user, redeemPoints, updateUser, offers, acceptTradeOffer, rejectTradeOffer } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'wallet' | 'trades'>('settings');
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [newRestriction, setNewRestriction] = useState("");
  const [sortOption, setSortOption] = useState<'price' | 'date'>('price');
  const [walletFilter, setWalletFilter] = useState<'all' | 'earned' | 'spent'>('all');

  const [redeemModal, setRedeemModal] = useState<{ title: string; defaultAmount: number; color: string; icon: any } | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [recipient, setRecipient] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<React.ReactNode | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleToggleGoal = (goal: HealthGoal) => {
    const goals = localProfile.healthGoals.includes(goal) ? localProfile.healthGoals.filter(g => g !== goal) : [...localProfile.healthGoals, goal];
    setLocalProfile({ ...localProfile, healthGoals: goals });
  };

  const addRestriction = () => {
    if (newRestriction.trim()) { setLocalProfile({ ...localProfile, restrictions: [...localProfile.restrictions, newRestriction.trim()] }); setNewRestriction(""); }
  };

  const removeRestriction = (index: number) => {
    const newRestrictions = [...localProfile.restrictions]; newRestrictions.splice(index, 1); setLocalProfile({ ...localProfile, restrictions: newRestrictions });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => { if (typeof reader.result === 'string') { updateUser({ avatar: reader.result }); } };
          reader.readAsDataURL(file);
      }
  };

  const openRedeemModal = (item: any) => {
      setRedeemModal(item);
      const maxBalance = user ? user.walletBalance : 0;
      const initialAmount = maxBalance < item.defaultAmount ? maxBalance : item.defaultAmount;
      setCustomAmount(initialAmount.toString());
      setRecipient(""); setSuccessMessage(null); setGeneratedCode(null);
  };

  const handleAcceptOffer = async (offerId: string) => {
      try { await acceptTradeOffer(offerId); alert("Offer Accepted! Payment will be processed."); } catch (e: any) { alert(e.message || "Failed to accept offer"); }
  };

  const handleRejectOffer = async (offerId: string) => {
      try { 
          // Replaced window.confirm with simple check or just direct call to avoid sandbox errors
          // In a real app, use a custom modal. For now, direct action is safer for the sandbox.
          await rejectTradeOffer(offerId); 
      } catch (e: any) { 
          alert(e.message || "Failed to reject offer"); 
      }
  };

  const handleConfirmRedeem = async () => {
      if (!user || !redeemModal) return;
      const amount = parseInt(customAmount);
      if (isNaN(amount) || amount <= 0) { alert("Please enter a valid amount"); return; }
      if (amount > user.walletBalance) { alert("Insufficient credits!"); return; }
      if (redeemModal.title === 'Sell Credits to Corp' && !recipient.trim()) { alert("Please enter your wallet address/payment details."); return; }
      if (redeemModal.title === 'Donate to Charity' && !recipient.trim()) { alert("Please enter charity details."); return; }

      setIsRedeeming(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let desc = "";
      let successMsg: React.ReactNode = "";

      if (redeemModal.title === 'Grocery Coupon') {
          const code = `SAVE-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          desc = `Grocery Coupon (${code}) purchased`;
          setGeneratedCode(code);
          successMsg = (<div><p>Coupon Generated Successfully!</p><div className="bg-gray-100 p-3 rounded-lg mt-2 font-mono text-xl font-black text-gray-800 tracking-widest border-2 border-dashed border-gray-300">{code}</div></div>);
      } else if (redeemModal.title === 'Sell Credits to Corp') {
          desc = `Sold credits to Corp (Dest: CORP-BUYBACK-001)`;
          successMsg = (<div><p>Transfer Initiated Successfully.</p><p className="text-xs mt-1 text-gray-500">Payment will be sent to: <span className="font-mono">{recipient}</span></p></div>);
      } else {
          desc = `Donation to ${recipient}`;
          successMsg = `Successfully donated ${amount} CC to ${recipient}!`;
      }

      const success = redeemPoints(amount, desc);
      setIsRedeeming(false);
      if (success) { setSuccessMessage(successMsg); }
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert("Copied to clipboard!"); };

  const TabButton = ({ id, icon, label, badge }: { id: typeof activeTab, icon: React.ReactNode, label: string, badge?: boolean }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 relative ${activeTab === id ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-500 hover:bg-gray-50'}`}>
        {icon}{label}{badge && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2" />}{activeTab === id && <ChevronRight size={16} className="ml-auto opacity-50"/>}
    </button>
  );

  const rewardOptions = [
      { title: "Grocery Coupon", defaultAmount: 500, color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100", icon: <ShoppingBag size={24}/> },
      { title: "Sell Credits to Corp", defaultAmount: 1000, color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100", icon: <Building2 size={24}/> },
      { title: "Donate to Charity", defaultAmount: 100, color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", icon: <Heart size={24}/> }
  ];

  const sortedOffers = [...offers].sort((a, b) => {
      if (sortOption === 'price') return b.pricePerCredit - a.pricePerCredit;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="animate-fade-in pb-20 md:pb-0 relative">
      <div className="flex items-center gap-5 mb-8 px-2 md:px-0">
        <div className="relative group">
            {user?.avatar ? <img src={user.avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition duration-300" /> : <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-105 transition duration-300"><User size={40} /></div>}
            <label className="absolute bottom-0 right-0 bg-white text-emerald-600 p-2 rounded-full cursor-pointer hover:bg-gray-50 shadow-md border border-gray-100 transition active:scale-95"><Camera size={14} /><input type="file" accept="image/*" className="hidden" onChange={handleFileChange} /></label>
        </div>
        <div><h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">{localProfile.name}</h2><p className="text-gray-500 font-medium">ReplateIQ.ai Member</p></div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-3">
            <div className="flex md:hidden bg-white rounded-xl p-1 mb-6 shadow-sm border border-gray-100">
                <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500'}`}><Settings size={16} /></button>
                <button onClick={() => setActiveTab('wallet')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'wallet' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500'}`}><Wallet size={16} /></button>
                <button onClick={() => setActiveTab('trades')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 relative ${activeTab === 'trades' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500'}`}><HandCoins size={16} />{offers.length > 0 && <div className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}</button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500'}`}><Clock size={16} /></button>
            </div>
            <div className="hidden md:flex flex-col gap-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                <TabButton id="settings" icon={<Settings size={18}/>} label="Settings & Goals" />
                <TabButton id="wallet" icon={<Wallet size={18}/>} label="Wallet & Rewards" />
                <TabButton id="trades" icon={<HandCoins size={18}/>} label="Trade Requests" badge={offers.length > 0} />
                <TabButton id="history" icon={<Clock size={18}/>} label="Recipe History" />
                <div className="border-t border-gray-100 my-2 pt-2"></div>
                <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 text-emerald-900/60 bg-emerald-50/50 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-transparent"><LogOut size={18} /> Log Out</button>
            </div>
        </div>

        <div className="md:col-span-9">
          
          {activeTab === 'wallet' && (
              <div className="animate-fade-in space-y-8">
                  {/* WALLET CARD - Compact & Sleek */}
                  <div className="max-w-[340px] aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group hover:scale-[1.01] transition-transform duration-500 mx-auto md:mx-0">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400 opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                      <div className="flex justify-between items-start relative z-10">
                          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10"><User size={12} className="text-emerald-200" /><span className="text-[10px] font-bold tracking-wider uppercase">ReplateIQ.ai</span></div>
                          <Wallet className="text-emerald-200/50" size={24} />
                      </div>
                      <div className="relative z-10"><p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1">Available Credits</p><div className="flex items-baseline gap-2"><span className="text-4xl font-black tracking-tight">{user?.walletBalance}</span><span className="text-lg font-medium text-emerald-300">CC</span></div></div>
                      <div className="flex justify-between items-end relative z-10">
                          <div><p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Card Holder</p><p className="text-sm font-bold tracking-wide">{user?.name.toUpperCase()}</p></div>
                          <div className="text-right cursor-pointer hover:opacity-80 transition" onClick={() => user?.walletId && copyToClipboard(user.walletId)} title="Click to copy ID"><p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">ID</p><div className="flex items-center gap-1"><p className="font-mono text-xs opacity-80">{user?.walletId || 'NC-XXXX-XXXX'}</p><Copy size={10} className="text-emerald-300"/></div></div>
                      </div>
                  </div>

                  {/* REDEEM SECTION */}
                  <div>
                      <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><ShoppingBag size={20} className="text-emerald-600"/> Redeem Credits</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{rewardOptions.map((item, idx) => (<button key={idx} onClick={() => openRedeemModal(item)} className={`p-5 rounded-2xl border text-left transition-all hover:shadow-lg hover:-translate-y-1 group bg-white border-gray-100`}><div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${item.color.split(' ')[0]} ${item.color.split(' ')[1]}`}>{item.icon}</div><h4 className="font-bold text-gray-800 mb-1">{item.title}</h4><span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">From {item.defaultAmount} CC</span></button>))}</div>
                  </div>

                  {/* RESTORED HISTORY SECTION */}
                  <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                              <History size={20} className="text-emerald-600"/> Transaction History
                          </h3>
                          <div className="flex bg-gray-100 p-1 rounded-lg">
                              {(['all', 'earned', 'spent'] as const).map(f => (
                                  <button key={f} onClick={() => setWalletFilter(f)} className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition ${walletFilter === f ? 'bg-white shadow text-emerald-800' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
                              ))}
                          </div>
                      </div>
                      <div className="space-y-3">
                          {user?.pointsHistory
                              .filter(t => {
                                  if (walletFilter === 'all') return true;
                                  if (walletFilter === 'earned') return t.type === 'earned';
                                  return t.type === 'redeemed' || t.type === 'sold' || t.type === 'bought';
                              })
                              .map((tx, i) => (
                              <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-emerald-100 transition animate-fade-in">
                                  <div className="flex items-center gap-4">
                                      <div className={`p-2.5 rounded-full flex items-center justify-center w-10 h-10 ${tx.type === 'earned' ? 'bg-emerald-100 text-emerald-600' : tx.type === 'sold' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                          {tx.type === 'earned' ? <ArrowDownLeft size={18}/> : tx.type === 'sold' ? <HandCoins size={18}/> : <ArrowUpRight size={18}/>}
                                      </div>
                                      <div>
                                          <p className="font-bold text-gray-800 text-sm line-clamp-1">{tx.description}</p>
                                          <p className="text-xs text-gray-400 font-medium">{new Date(tx.date).toLocaleDateString()} &bull; {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                      </div>
                                  </div>
                                  <span className={`font-mono font-bold text-sm ${tx.type === 'earned' ? 'text-emerald-600' : tx.type === 'sold' ? 'text-purple-600' : 'text-orange-600'}`}>
                                      {tx.type === 'earned' ? '+' : '-'}{tx.amount} CC
                                  </span>
                              </div>
                          ))}
                          {(!user?.pointsHistory || user.pointsHistory.length === 0) && (
                              <div className="text-center py-10 text-gray-400 bg-gray-50/50 rounded-xl border-dashed border-2 border-gray-200">
                                  <History size={32} className="mx-auto mb-2 opacity-50"/>
                                  <p className="text-sm font-medium">No transactions yet.</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'trades' && (
              <div className="animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><HandCoins size={20} className="text-teal-600"/> Trade Requests</h3>
                      <div className="flex items-center gap-2"><ArrowUpDown size={14} className="text-gray-400"/><select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)} className="text-xs font-bold text-gray-500 bg-transparent outline-none"><option value="price">Highest Price</option><option value="date">Newest</option></select></div>
                  </div>
                  {sortedOffers.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100"><HandCoins size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">No pending offers.</p><p className="text-sm text-gray-400">Wait for enterprises to bid on your credits.</p></div>
                  ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                          {sortedOffers.map(offer => (
                              <div key={offer.id} className="bg-white p-5 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition flex flex-col justify-between group relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
                                  <div>
                                      <div className="flex justify-between items-start mb-2">
                                          <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1"><Building2 size={10}/> {offer.enterpriseName}</span>
                                          <span className="text-xs text-gray-400">wants to buy</span>
                                      </div>
                                      <div className="flex items-baseline gap-2 mb-4">
                                          <span className="text-3xl font-black text-gray-800">{offer.amount}</span>
                                          <span className="text-sm font-bold text-gray-400">CC</span>
                                          <span className="text-sm text-emerald-600 font-bold ml-auto">@ ${offer.pricePerCredit}/credit</span>
                                      </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 gap-2">
                                      <div className="text-xs font-bold text-gray-500">Payout: <span className="text-emerald-600 text-sm">${(offer.amount * offer.pricePerCredit).toFixed(2)}</span></div>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleRejectOffer(offer.id)} className="px-3 py-2 rounded-lg font-bold text-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition">Reject</button>
                                          <button onClick={() => handleAcceptOffer(offer.id)} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-teal-700 transition">Accept</button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-gray-800 text-lg mb-6">Personal Details</h3><div className="space-y-4"><div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Display Name</label><input type="text" value={localProfile.name} onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"/></div></div></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-gray-800 text-lg mb-6">Health Goals</h3><div className="grid md:grid-cols-2 gap-3">{Object.values(HealthGoal).map((goal) => (<button key={goal} onClick={() => handleToggleGoal(goal)} className={`p-3 rounded-xl text-sm font-bold border-2 transition-all text-left flex items-center justify-between ${localProfile.healthGoals.includes(goal) ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{goal}{localProfile.healthGoals.includes(goal) && <div className="w-2 h-2 rounded-full bg-emerald-500"/>}</button>))}</div></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-gray-800 text-lg mb-6">Dietary Restrictions</h3><div className="flex gap-2 mb-4"><input type="text" value={newRestriction} onChange={(e) => setNewRestriction(e.target.value)} placeholder="e.g. Gluten Free" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" onKeyDown={(e) => e.key === 'Enter' && addRestriction()}/><button onClick={addRestriction} className="bg-emerald-900 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-emerald-800 transition">Add</button></div>{localProfile.restrictions.length === 0 ? (<p className="text-sm text-gray-400 italic">No restrictions added yet.</p>) : (<div className="flex flex-wrap gap-2">{localProfile.restrictions.map((res, i) => (<span key={i} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 group hover:bg-red-50 hover:text-red-600 transition cursor-pointer" onClick={() => removeRestriction(i)}>{res}<X size={14} className="opacity-50 group-hover:opacity-100"/></span>))}</div>)}</div>
              <button onClick={() => onSave(localProfile)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 hover:shadow-xl transition flex items-center justify-center gap-2"><Save size={20} /> Save Changes</button>
            </div>
          )}

          {activeTab === 'history' && (
              <div className="animate-fade-in">
                  <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2"><History size={20} className="text-emerald-600"/> Generated Recipes</h3>
                  <div className="space-y-4">{history.length === 0 ? (<div className="text-center py-20 bg-white rounded-2xl border border-gray-100"><ChefHat size={48} className="mx-auto text-gray-300 mb-4"/><p className="text-gray-500 font-medium">No recipes generated yet.</p><p className="text-sm text-gray-400">Go to your kitchen to start cooking!</p></div>) : (history.map((recipe, i) => (<div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer group" onClick={() => onSelectHistory(recipe)}><div className="flex justify-between items-start"><div><h4 className="font-bold text-gray-800 text-lg group-hover:text-emerald-700 transition">{recipe.recipeName}</h4><p className="text-xs text-gray-400 mt-1">{new Date(recipe.createdAt || "").toLocaleDateString()}</p></div><div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">{recipe.nutrition.standard.calories} kcal</div></div><p className="text-sm text-gray-500 mt-3 line-clamp-2">{recipe.description}</p></div>)))}</div>
              </div>
          )}
        </div>
      </div>

      {redeemModal && (
          <div className="fixed inset-0 bg-emerald-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setRedeemModal(null)}>
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  {successMessage ? (<div className="p-8 text-center animate-fade-in"><div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pop-in"><CheckCircle size={40} /></div><h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3><div className="text-gray-600 mb-6 text-sm">{successMessage}</div>{generatedCode && (<button onClick={() => copyToClipboard(generatedCode)} className="mb-6 text-xs text-emerald-600 font-bold hover:underline">Click to Copy Code</button>)}<button onClick={() => setRedeemModal(null)} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition">Done</button></div>) : (<><div className={`p-6 text-center ${redeemModal.color.split(' ')[0]} bg-opacity-20`}><div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white shadow-sm ${redeemModal.color.replace('bg-', 'text-').split(' ')[0]}`}>{redeemModal.icon}</div><h3 className="text-xl font-bold text-gray-800">{redeemModal.title}</h3></div><div className="p-6 space-y-4"><div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Available Balance</label><div className="text-2xl font-black text-gray-800">{user?.walletBalance} <span className="text-sm font-bold text-gray-400">CC</span></div></div><div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Amount to Redeem</label><div className="flex items-center relative"><input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"/><span className="absolute right-4 font-bold text-gray-400 text-sm">CC</span></div></div>{redeemModal.title === 'Sell Credits to Corp' && (<div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Your Payment Address</label><input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. UPI ID, Crypto Address" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"/><div className="mt-2 text-[10px] text-gray-400 bg-gray-50 p-2 rounded border border-gray-100">Selling to Organization ID: <strong>CORP-BUYBACK-001</strong></div></div>)}{redeemModal.title === 'Donate to Charity' && (<div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Charity Name / ID</label><input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Red Cross" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"/></div>)}<div className="flex gap-3 mt-4"><button onClick={() => setRedeemModal(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button><button onClick={handleConfirmRedeem} disabled={isRedeeming} className="flex-1 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">{isRedeeming ? <Loader2 className="animate-spin" size={20}/> : 'Confirm'}</button></div></div></>)}
              </div>
          </div>
      )}
    </div>
  );
};

export default ProfileSettings;

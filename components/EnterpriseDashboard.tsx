
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, BarChart3, Globe, ShoppingBag, ArrowUpRight, TrendingUp, Trees, Leaf, Building2, Briefcase, FileCheck, ShieldCheck, Filter, Search, Award, CheckCircle2, Factory, Wallet, X, Loader2, PieChart, HandCoins, Map as MapIcon, Layers, Megaphone, Pencil, Save } from 'lucide-react';
import { B2BListing, CarbonProject, CarbonStandard, ProjectCategory, TradeOffer } from '../types';

interface MarketItem {
    id: string;
    state: string;
    country: string;
    regionLabel: string; // "State, Country"
    totalCredits: number;
    userCount: number;
}

// --- WORLD HEAT MAP COMPONENT ---
const WorldHeatMap: React.FC<{ data: MarketItem[] }> = ({ data }) => {
    // Helper to map regions to approximate % coordinates on a standard Miller projection map
    const getCoordinates = (state: string, country: string) => {
        let x = 50; 
        let y = 50;
        const c = country.toUpperCase().trim();
        const s = state.toUpperCase().trim();

        if (c === 'USA' || c === 'US' || c === 'UNITED STATES') {
            x = 25; y = 35;
            if (s.includes('NY')) { x = 28; y = 32; }
            if (s.includes('CA')) { x = 18; y = 35; }
            if (s.includes('TX')) { x = 22; y = 40; }
            if (s.includes('VA')) { x = 27; y = 36; }
        } else if (c === 'INDIA' || c === 'IN') {
            x = 72; y = 45;
        } else if (c === 'UK') { x = 48; y = 25; }
        return { x, y };
    };

    return (
        <div className="relative w-full aspect-[2/1] bg-[#0f172a] rounded-3xl overflow-hidden shadow-inner border border-emerald-900/30 group">
            <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
                <path fill="#334155" d="M22,35 C15,35 15,20 25,20 C30,20 35,30 25,45 Z" />
                <path fill="#334155" d="M30,55 C25,50 35,50 40,65 C35,70 30,65 30,55 Z" /> 
                <path fill="#334155" d="M45,25 C45,15 60,15 60,25 C60,30 55,40 45,35 Z" />
                <path fill="#334155" d="M65,20 C65,10 95,10 95,35 C95,45 80,50 65,35 Z" />
            </svg>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            {data.map((item) => {
                const { x, y } = getCoordinates(item.state, item.country);
                const size = Math.log(item.totalCredits + 100) * 1.5; 
                return (
                    <div key={item.id} className="absolute flex items-center justify-center group/marker cursor-pointer transition-all duration-500 hover:z-50" style={{ left: `${x}%`, top: `${y}%` }}>
                        <div className="rounded-full bg-emerald-500/40 animate-ping absolute" style={{ width: `${size * 2}px`, height: `${size * 2}px` }}></div>
                        <div className="rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] relative border-2 border-white/20 transition-transform group-hover/marker:scale-125" style={{ width: `${size}px`, height: `${size}px` }}></div>
                        <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-50 font-bold border border-emerald-500/30 shadow-xl">
                            {item.regionLabel}
                            <div className="text-emerald-400 font-mono">{item.totalCredits} CC</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const EnterpriseDashboard: React.FC = () => {
  const { user, logout, broadcastOffer, activeBids, updateOfferPrice, communityUsers, b2bListings, createB2BListing, buyB2BListing } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'community_market' | 'b2b_market' | 'portfolio' | 'ledger'>('overview');
  
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [countries, setCountries] = useState<string[]>([]);

  const [buyModal, setBuyModal] = useState<MarketItem | null>(null);
  const [bidPrice, setBidPrice] = useState<string>("0.12"); 
  const [isProcessing, setIsProcessing] = useState(false);

  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [editBidPrice, setEditBidPrice] = useState<string>("");

  const [b2bBuyModal, setB2bBuyModal] = useState<B2BListing | null>(null);
  const [b2bBuyAmount, setB2bBuyAmount] = useState("");
  const [buyAction, setBuyAction] = useState<'trade' | 'retire'>('retire');

  const [showSellModal, setShowSellModal] = useState(false);
  const [sellAmount, setSellAmount] = useState("");
  const [sellPrice, setSellPrice] = useState("10.50");
  const [sellVintage, setSellVintage] = useState<number>(new Date().getFullYear());
  const [sellStandard, setSellStandard] = useState<string>("ReplateIQ Verified");
  const [filterStandard, setFilterStandard] = useState("All");

  useEffect(() => {
      const grouped: Record<string, { credits: number; count: number, state: string, country: string }> = {};
      const countrySet = new Set<string>();
      
      communityUsers.forEach(u => {
          if (u.walletBalance > 0) {
              let country = "Unknown";
              let state = "Unknown";
              if (u.location) {
                  const parts = u.location.split(',');
                  if (parts.length > 0) { country = parts[parts.length - 1].trim(); countrySet.add(country); }
                  if (parts.length >= 2) { const statePart = parts[parts.length - 2].trim(); state = statePart.replace(/[0-9]/g, '').trim() || statePart.split(' ')[0]; }
              }
              const key = `${state}, ${country}`;
              if (!grouped[key]) grouped[key] = { credits: 0, count: 0, state, country };
              grouped[key].credits += u.walletBalance;
              grouped[key].count += 1;
          }
      });

      const marketList = Object.keys(grouped).map((key, idx) => ({ id: `mkt-${idx}`, regionLabel: key, state: grouped[key].state, country: grouped[key].country, totalCredits: grouped[key].credits, userCount: grouped[key].count }));
      setMarketData(marketList);
      setCountries(["All", ...Array.from(countrySet)]);
  }, [communityUsers]); 

  const filteredMarketData = useMemo(() => {
      if (selectedCountry === "All") return marketData;
      return marketData.filter(item => item.country === selectedCountry);
  }, [marketData, selectedCountry]);

  const handleMakeBid = async () => {
      if (!buyModal) return;
      const price = parseFloat(bidPrice);
      if (isNaN(price) || price <= 0) { alert("Invalid bid price"); return; }
      setIsProcessing(true);
      try {
          await broadcastOffer(buyModal.state, price); 
          alert(`Offers broadcasted to users in ${buyModal.regionLabel} @ $${price}/credit.`);
          setBuyModal(null);
      } catch (e) { alert("Failed to send offers"); } finally { setIsProcessing(false); }
  };

  const handleUpdateBid = async (offerId: string) => {
      const price = parseFloat(editBidPrice);
      if (isNaN(price) || price <= 0) return;
      try { await updateOfferPrice(offerId, price); setEditingBidId(null); } catch (e) { alert("Failed to update price"); }
  };

  const handleCreateB2BListing = async () => {
      const amt = parseInt(sellAmount);
      const price = parseFloat(sellPrice);
      if (isNaN(amt) || amt <= 0 || isNaN(price) || price <= 0) { alert("Invalid fields"); return; }
      if (amt > (user?.walletBalance || 0)) { alert("Insufficient inventory."); return; }
      setIsProcessing(true);
      try { await createB2BListing(amt, price, sellVintage); setShowSellModal(false); setSellAmount(""); alert("Listing created."); } catch (e) { alert("Failed."); } finally { setIsProcessing(false); }
  };

  const handleBuyB2B = async () => {
      if (!b2bBuyModal) return;
      const amt = parseInt(b2bBuyAmount);
      if (isNaN(amt) || amt <= 0 || amt > b2bBuyModal.amount) return;
      setIsProcessing(true);
      try { await buyB2BListing(b2bBuyModal.id, amt, buyAction === 'retire'); alert("Success!"); setB2bBuyModal(null); } catch (e) { alert("Failed."); } finally { setIsProcessing(false); }
  };

  const totalRetired = user?.retiredBalance || 0; 
  const totalInventory = user?.walletBalance || 0;
  const treesPlanted = Math.floor(totalRetired / 1000);
  const getStandardBadge = (std: string) => {
      if (std.includes('ReplateIQ')) return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Community Verified</span>;
      if (std === 'Gold Standard') return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Gold Standard</span>;
      return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{std}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <aside className="w-72 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen z-30">
        <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
                <div className="bg-emerald-800 text-white p-2 rounded-lg shadow-md"><Building2 size={24} /></div>
                <span className="text-xl font-black text-emerald-950 tracking-tight">ReplateIQ.ai</span>
            </div>
            <div className="flex items-center gap-2 pl-1 mt-2"><ShieldCheck size={12} className="text-emerald-600"/><p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Enterprise &bull; KYC Verified</p></div>
        </div>
        <nav className="flex-1 px-4 space-y-2 py-4">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-100' : 'text-gray-500 hover:bg-gray-50'}`}><BarChart3 size={18} /> Dashboard</button>
            <button onClick={() => setActiveTab('portfolio')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'portfolio' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-100' : 'text-gray-500 hover:bg-gray-100'}`}><PieChart size={18} /> Asset Portfolio</button>
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trading</div>
            <button onClick={() => setActiveTab('community_market')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'community_market' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-100' : 'text-gray-500 hover:bg-gray-100'}`}><ShoppingBag size={18} /> Buy from Community</button>
            <button onClick={() => setActiveTab('b2b_market')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'b2b_market' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-100' : 'text-gray-500 hover:bg-gray-100'}`}><Globe size={18} /> Secondary Market</button>
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Audit</div>
            <button onClick={() => setActiveTab('ledger')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ledger' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-100' : 'text-gray-500 hover:bg-gray-100'}`}><FileCheck size={18} /> Ledger & Certificates</button>
        </nav>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 mb-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-bold">{user?.name.charAt(0)}</div>
                <div><p className="text-sm font-bold text-gray-900 truncate w-32">{user?.name}</p><p className="text-[10px] text-gray-500 truncate opacity-70 font-mono">ID: {user?.walletId}</p></div>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-emerald-900/60 bg-emerald-50/50 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 border border-emerald-100/50 transition"><LogOut size={16} /> Secure Logout</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50/50 p-8 lg:p-12">
          {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in">
                  <h1 className="text-3xl font-black text-gray-900 mb-8">Sustainability Dashboard</h1>
                  <div className="grid lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-emerald-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-between group">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                            <div className="relative z-10"><p className="text-emerald-300 text-sm font-bold uppercase tracking-widest mb-2">Total Retired Offsets</p><h2 className="text-6xl font-black tracking-tighter text-white">{totalRetired.toLocaleString()} <span className="text-2xl text-emerald-400">tCO2e</span></h2></div>
                            <div className="relative z-10 grid grid-cols-2 gap-8 border-t border-emerald-800 pt-8 mt-8">
                                <div><p className="text-xs text-emerald-400 uppercase font-bold mb-1">Active Inventory</p><div className="flex items-center gap-2 text-2xl font-bold"><Wallet size={24} className="text-emerald-300"/> {totalInventory.toLocaleString()} CC</div></div>
                                <div><p className="text-xs text-emerald-400 uppercase font-bold mb-1">Impact Equivalent</p><div className="flex items-center gap-2 text-2xl font-bold"><Trees size={24} className="text-emerald-300"/> ~{treesPlanted} Trees</div></div>
                            </div>
                      </div>
                      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
                          <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><ShieldCheck size={20} className="text-emerald-600"/> Compliance</h4>
                          <div className="space-y-6">
                              <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">KYC Status</p><div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-3 py-2 rounded-lg w-fit border border-emerald-100"><CheckCircle2 size={16}/> Verified Entity</div></div>
                              <div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Last Audit</p><p className="font-bold text-gray-900">24 Hours Ago</p></div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'community_market' && (
              <div className="animate-fade-in space-y-8">
                  <div className="flex justify-between items-center">
                      <div><h1 className="text-3xl font-black text-gray-900">Community Aggregation</h1><p className="text-gray-500 mt-1">Bid on credits directly from ReplateIQ users in specific regions.</p></div>
                      <div className="flex items-center gap-2"><Filter size={16} className="text-gray-400"/><select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="bg-white border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">{countries.map(c => <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>)}</select></div>
                  </div>

                  {/* ACTIVE BIDS SECTION (NEW) */}
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm mb-8">
                      <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2"><Megaphone size={20} className="text-purple-600"/> Your Active Bids</h3>
                      {activeBids.length === 0 ? <p className="text-sm text-gray-500 italic">No active bids. Broadcast an offer below.</p> : (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {activeBids.map(bid => (
                                  <div key={bid.id} className="border border-purple-100 bg-purple-50 p-4 rounded-2xl flex flex-col">
                                      <div className="flex justify-between items-start mb-2"><div><p className="text-xs font-bold text-purple-400 uppercase">Target Region</p><p className="font-bold text-purple-900">{bid.region}</p></div><div className="bg-white px-2 py-1 rounded-lg shadow-sm"><span className="text-xs font-bold text-gray-500">Qty: {bid.amount}</span></div></div>
                                      <div className="mt-auto pt-2 flex items-end justify-between"><div><p className="text-xs font-bold text-purple-400 uppercase">Bid Price</p>{editingBidId === bid.id ? (<div className="flex items-center gap-1"><span className="text-lg font-bold text-purple-700">$</span><input type="number" value={editBidPrice} onChange={e => setEditBidPrice(e.target.value)} className="w-16 p-1 rounded border border-purple-200 text-sm font-bold" autoFocus/><button onClick={() => handleUpdateBid(bid.id)} className="bg-purple-600 text-white p-1 rounded hover:bg-purple-700"><Save size={14}/></button></div>) : (<div className="flex items-center gap-2"><p className="text-2xl font-black text-purple-700">${bid.pricePerCredit}</p><button onClick={() => { setEditingBidId(bid.id); setEditBidPrice(bid.pricePerCredit.toString()); }} className="text-purple-400 hover:text-purple-600"><Pencil size={14}/></button></div>)}</div></div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <WorldHeatMap data={filteredMarketData} />
                  
                  {filteredMarketData.length === 0 ? (
                      <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-3xl border-2 border-dashed border-gray-200"><div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><Globe size={32} className="text-gray-300" /></div><h3 className="text-lg font-bold text-gray-800 mb-1">No Active Pools Found</h3><p className="text-sm text-gray-500 max-w-md mx-auto">No users with credits in this region.</p></div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {filteredMarketData.map(item => (
                            <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4"><div><h3 className="font-bold text-lg text-gray-900">{item.regionLabel}</h3><div className="flex items-center gap-1.5 mt-1"><span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{item.country}</span><span className="text-xs text-gray-500">&bull; {item.userCount} Users</span></div></div><div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><MapIcon size={24}/></div></div>
                                <div className="mb-6"><p className="text-xs text-gray-400 font-bold uppercase">Available Pool</p><p className="text-2xl font-black text-gray-900">{item.totalCredits.toLocaleString()} <span className="text-sm font-medium text-gray-400">CC</span></p></div>
                                <button onClick={() => setBuyModal(item)} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2"><HandCoins size={18}/> Make Offer</button>
                            </div>
                        ))}
                    </div>
                  )}
              </div>
          )}

          {activeTab === 'b2b_market' && (
              <div className="animate-fade-in space-y-6">
                  <h1 className="text-3xl font-black text-gray-900">Secondary Market</h1>
                  <div className="flex gap-4 overflow-x-auto pb-2">{['All', 'ReplateIQ Verified', 'Gold Standard', 'VCS'].map(std => (<button key={std} onClick={() => setFilterStandard(std)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${filterStandard === std ? 'bg-emerald-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{std}</button>))}</div>
                  <div className="grid lg:grid-cols-2 gap-6">
                      {b2bListings.filter(l => filterStandard === 'All' || l.project.standard.includes(filterStandard)).map(listing => (
                          <div key={listing.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition overflow-hidden flex flex-col">
                              <div className="h-40 relative"><img src={listing.project.image} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div><div className="absolute bottom-4 left-4 text-white"><div className="flex gap-2 mb-1">{getStandardBadge(listing.project.standard)}</div><h3 className="font-bold text-lg leading-tight">{listing.project.name}</h3></div></div>
                              <div className="p-6 flex-1 flex flex-col">
                                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm"><div><p className="text-gray-400 text-xs font-bold uppercase">Seller</p><p className="font-bold text-gray-900 truncate">{listing.sellerName}</p></div><div><p className="text-gray-400 text-xs font-bold uppercase">Vintage</p><p className="font-bold text-gray-900">{listing.vintage}</p></div><div><p className="text-gray-400 text-xs font-bold uppercase">Price</p><p className="font-bold text-emerald-600">${listing.pricePerCredit}</p></div></div>
                                  <div className="bg-gray-50 p-3 rounded-xl mb-4 flex justify-between items-center"><span className="text-sm font-medium text-gray-600">Available Quantity</span><span className="font-black text-gray-900 text-lg">{listing.amount.toLocaleString()} CC</span></div>
                                  {listing.sellerId !== user?.id && (<button onClick={() => { setB2bBuyModal(listing); setB2bBuyAmount(listing.amount.toString()); }} className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition">Trade / Buy</button>)}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'portfolio' && (<div className="animate-fade-in space-y-6"><div className="flex justify-between items-center"><h1 className="text-3xl font-black text-gray-900">Asset Portfolio</h1><button onClick={() => setShowSellModal(true)} className="bg-emerald-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-800 transition flex items-center gap-2"><TrendingUp size={20}/> Sell Assets</button></div><div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50 border-b border-gray-100"><tr><th className="p-6 text-xs font-bold text-gray-400 uppercase">Acquired Date</th><th className="p-6 text-xs font-bold text-gray-400 uppercase">Source / Project</th><th className="p-6 text-xs font-bold text-gray-400 uppercase">Standard</th><th className="p-6 text-xs font-bold text-gray-400 uppercase">Vintage</th><th className="p-6 text-xs font-bold text-gray-400 uppercase text-right">Amount (CC)</th></tr></thead><tbody className="divide-y divide-gray-50">{user?.pointsHistory.filter(tx => tx.type === 'earned' || tx.type === 'bought').map(tx => (<tr key={tx.id} className="hover:bg-gray-50 transition"><td className="p-6 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td><td className="p-6 font-bold text-gray-900">{tx.description}</td><td className="p-6">{getStandardBadge(tx.standard || 'Unknown')}</td><td className="p-6 text-sm font-mono text-gray-600">{tx.vintage || '-'}</td><td className="p-6 text-right font-bold text-emerald-600">+{tx.amount}</td></tr>))}</tbody></table></div></div>)}
          
          {activeTab === 'ledger' && (<div className="animate-fade-in bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"><div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center"><h3 className="font-bold text-gray-800">Compliance Ledger</h3><button className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline"><FileCheck size={14}/> Export CSV</button></div><div className="divide-y divide-gray-100">{user?.pointsHistory.map((tx) => (<div key={tx.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition"><div className="flex items-center gap-4"><div className={`p-2.5 rounded-xl ${tx.type === 'retired' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>{tx.type === 'retired' ? <Factory size={20}/> : <Briefcase size={20}/>}</div><div><p className="font-bold text-gray-900 text-sm">{tx.description}</p><div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1 font-mono"><span>{new Date(tx.date).toLocaleDateString()}</span><span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Hash: {tx.verificationHash?.substring(0,8)}...</span>{tx.serialNumber && <span className="bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100">SN: {tx.serialNumber.substring(0,18)}...</span>}{tx.vintage && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">Vin: {tx.vintage}</span>}{tx.standard && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">{tx.standard}</span>}</div></div></div><div className="text-right"><p className={`font-bold font-mono ${tx.type === 'retired' ? 'line-through text-gray-400' : 'text-emerald-600'}`}>{tx.type==='retired' ? '-' : '+'}{tx.amount}</p><p className="text-[10px] text-gray-400 uppercase font-bold">{tx.type}</p></div></div>))}</div></div>)}
      </main>

      {buyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setBuyModal(null)}>
              <div className="bg-white rounded-3xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4">Bid for Credits in {buyModal.regionLabel}</h3>
                  <p className="text-sm text-gray-500 mb-6">Send an offer to {buyModal.userCount} users.</p>
                  <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Bid Price per Credit ($)</label><input type="number" value={bidPrice} onChange={e => setBidPrice(e.target.value)} step="0.01" className="w-full p-4 bg-gray-50 border rounded-xl mb-6 font-bold text-xl text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.12" /></div>
                  <div className="flex gap-2"><button onClick={() => setBuyModal(null)} className="flex-1 py-3 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition">Cancel</button><button onClick={handleMakeBid} disabled={isProcessing} className="flex-1 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition">{isProcessing ? <Loader2 className="animate-spin mx-auto"/> : 'Broadcast Bid'}</button></div>
              </div>
          </div>
      )}

      {showSellModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowSellModal(false)}>
              <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="bg-emerald-900 p-6 flex justify-between items-center text-white"><h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp size={20}/> Sell Inventory</h3><button onClick={() => setShowSellModal(false)}><X size={20}/></button></div>
                  <div className="p-8 space-y-5"><div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-sm text-emerald-800 font-medium">You are listing credits sourced from the <strong>ReplateIQ Community Pool</strong>.</div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-bold text-gray-700 mb-1 block">Amount</label><input type="number" value={sellAmount} onChange={e => setSellAmount(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl font-bold"/></div><div><label className="text-sm font-bold text-gray-700 mb-1 block">Vintage</label><input type="number" value={sellVintage} onChange={e => setSellVintage(parseInt(e.target.value))} className="w-full p-3 bg-gray-50 border rounded-xl font-bold"/></div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-bold text-gray-700 mb-1 block">Standard</label><select value={sellStandard} onChange={e => setSellStandard(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl font-bold"><option>ReplateIQ Verified</option><option>Gold Standard</option><option>VCS</option></select></div><div><label className="text-sm font-bold text-gray-700 mb-1 block">Price ($)</label><input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl font-bold"/></div></div><button onClick={handleCreateB2BListing} disabled={isProcessing} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition">{isProcessing ? <Loader2 className="animate-spin mx-auto"/> : 'Create Sell Order'}</button></div>
              </div>
          </div>
      )}

      {b2bBuyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setB2bBuyModal(null)}>
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-1">{b2bBuyModal.project.name}</h3>
                  <p className="text-xs text-gray-500 mb-6">Seller: {b2bBuyModal.sellerName} • Vintage {b2bBuyModal.vintage}</p>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-6"><button onClick={() => setBuyAction('trade')} className={`flex-1 py-2 text-xs font-bold rounded transition ${buyAction === 'trade' ? 'bg-white shadow text-emerald-800' : 'text-gray-500'}`}>Trade (Hold)</button><button onClick={() => setBuyAction('retire')} className={`flex-1 py-2 text-xs font-bold rounded transition ${buyAction === 'retire' ? 'bg-white shadow text-emerald-800' : 'text-gray-500'}`}>Retire (Offset)</button></div>
                  <input type="number" value={b2bBuyAmount} onChange={e => setB2bBuyAmount(e.target.value)} max={b2bBuyModal.amount} className="w-full p-4 bg-gray-50 border rounded-xl text-lg font-bold mb-2" placeholder="Qty" />
                  <div className="flex justify-between text-sm font-bold text-gray-600 mb-6"><span>Total Cost:</span><span className="text-emerald-600">${(parseFloat(b2bBuyAmount||'0') * b2bBuyModal.pricePerCredit).toFixed(2)}</span></div>
                  <button onClick={handleBuyB2B} disabled={isProcessing} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition">{isProcessing ? <Loader2 className="animate-spin mx-auto"/> : (buyAction === 'retire' ? 'Purchase & Retire' : 'Purchase & Hold')}</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default EnterpriseDashboard;

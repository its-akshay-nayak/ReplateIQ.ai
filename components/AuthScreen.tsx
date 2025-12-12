
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChefHat, ArrowRight, Mail, Lock, User as UserIcon, Loader2, CheckCircle, MapPin, Navigation, AlertCircle, Building2 } from 'lucide-react';
import { searchAddress, lookupZip } from '../services/mockLocationService';

interface AuthScreenProps {
    onBackToLanding: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onBackToLanding }) => {
  const { login, signup, resetPassword } = useAuth();
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [role, setRole] = useState<'user' | 'enterprise'>('user'); // New Role State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [name, setName] = useState('');
  
  // Detailed Location State
  const [streetAddress, setStreetAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Address Autocomplete Logic
  useEffect(() => {
      if (view === 'signup' && streetAddress.length > 1) {
          const timeoutId = setTimeout(async () => {
              const results = await searchAddress(streetAddress);
              setAddressSuggestions(results);
              setShowSuggestions(true);
          }, 300);
          return () => clearTimeout(timeoutId);
      } else {
          setAddressSuggestions([]);
          setShowSuggestions(false);
      }
  }, [streetAddress, view]);

  // Zip Code Lookup Logic
  useEffect(() => {
      if (view === 'signup' && zipCode.length === 5) {
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
  }, [zipCode, view]);

  const handleSelectAddress = (addr: string) => {
      setStreetAddress(addr);
      setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (view === 'login') {
        await login(email, password);
      } else if (view === 'signup') {
        // Construct full location string
        const fullLocation = `${streetAddress}, ${city}, ${state} ${zipCode}, ${country}`;
        if (!streetAddress || !zipCode || !city) {
            throw new Error("Please complete your address details.");
        }
        // Pass role to signup (AuthContext needs to handle this update in User object)
        const userWithRole = { role }; 
        await signup(email, name, fullLocation, password, role); // Updated signup signature usage
      } else if (view === 'forgot') {
        await resetPassword(email);
        setSuccessMsg(`Reset link sent to ${email}`);
        setTimeout(() => setView('login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-gray-900">
      
      {/* LEFT PANEL - BRANDING (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900 overflow-hidden items-center justify-center">
         <img 
            src="https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=2070&auto=format&fit=crop" 
            alt="Food Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
         />
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 to-teal-900/80" />
         
         <div className="relative z-10 px-16 max-w-2xl animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8 cursor-pointer group" onClick={onBackToLanding}>
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-900/50 transform -rotate-3 group-hover:rotate-0 transition duration-500">
                    <ChefHat className="text-white" size={32} />
                </div>
                <span className="text-3xl font-extrabold text-white tracking-tight group-hover:text-emerald-100 transition">ReplateIQ.ai</span>
            </div>
            
            <h1 className="text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Kitchen</span>.
            </h1>
            <p className="text-xl text-emerald-100 leading-relaxed font-medium">
              Join the community reducing food waste, tracking calories, and eating smarter with AI-powered nutrition.
            </p>
            
            <div className="mt-12 flex items-center gap-4">
                <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-2 border-emerald-900 overflow-hidden">
                             <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <div className="text-sm">
                    <p className="text-white font-bold">10,000+ ReplateIQ.ai Users</p>
                    <p className="text-emerald-400">Cooking smarter today</p>
                </div>
            </div>
         </div>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto bg-gray-50/50 relative">
         {/* Mobile Background (Absolute) */}
         <div className="lg:hidden absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070" className="w-full h-full object-cover" alt="bg" />
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm" />
         </div>

         <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl lg:shadow-xl border border-gray-100 p-8 lg:p-12 relative z-10 animate-slide-down">
            {/* Header for Mobile/Form */}
            <div className="text-center mb-10">
                <div className="lg:hidden flex flex-col items-center justify-center mb-6 cursor-pointer" onClick={onBackToLanding}>
                     <div className="bg-emerald-600 p-3.5 rounded-xl shadow-lg shadow-emerald-900/20 mb-3">
                        <ChefHat className="text-white" size={32} />
                     </div>
                     <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">ReplateIQ.ai</h1>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {view === 'login' && 'Welcome Back'}
                    {view === 'signup' && 'Create Account'}
                    {view === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-gray-500 mt-2 font-medium">
                    {view === 'login' && 'Enter your details to access your dashboard.'}
                    {view === 'signup' && 'Start your sustainable journey today.'}
                    {view === 'forgot' && 'We’ll email you a link to reset it.'}
                </p>
            </div>

            <div className="flex justify-center mb-8 bg-gray-100 p-1 rounded-xl">
                <button 
                    onClick={() => { setView('login'); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${view === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Sign In
                </button>
                <button 
                    onClick={() => { setView('signup'); setError(null); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${view === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Create Account
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 animate-shake flex items-start gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
            
            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-green-100">
                    <CheckCircle size={18} /> {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {view === 'signup' && (
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                        <button
                            type="button"
                            onClick={() => setRole('user')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'user' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <UserIcon size={16} /> Individual
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('enterprise')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'enterprise' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Building2 size={16} /> Enterprise
                        </button>
                    </div>
                )}

                {view === 'signup' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="relative group">
                        {role === 'enterprise' ? (
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        ) : (
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        )}
                        <input
                            type="text"
                            placeholder={role === 'enterprise' ? "Company Name" : "Full Name"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition font-medium text-gray-700"
                            required
                        />
                    </div>
                    
                    {/* SMART ADDRESS INPUTS */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">{role === 'enterprise' ? "Headquarters Location" : "Address Details"}</label>
                        
                        <div className="relative group z-20">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Street Address"
                                value={streetAddress}
                                onChange={(e) => setStreetAddress(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition font-medium text-gray-700"
                                required
                                autoComplete="off"
                            />
                            {showSuggestions && addressSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                                    {addressSuggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSelectAddress(suggestion)}
                                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm text-gray-700 font-medium flex items-center gap-2 border-b border-gray-50 last:border-0"
                                        >
                                            <Navigation size={14} className="text-emerald-500" /> {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                            <div className="col-span-2 relative group">
                                <input
                                    type="text"
                                    placeholder="Zip Code"
                                    maxLength={5}
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition font-medium text-gray-700 text-center"
                                    required
                                />
                                {isZipLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-600"/>}
                            </div>
                            <div className="col-span-3 relative group">
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={city}
                                    readOnly
                                    className="w-full px-4 py-4 bg-gray-100 border border-gray-100 rounded-xl text-gray-500 font-medium cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                )}

                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                        type="email"
                        placeholder={role === 'enterprise' ? "Company Email" : "Email Address"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition font-medium text-gray-700"
                        required
                    />
                </div>

                {view !== 'forgot' && (
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition font-medium text-gray-700"
                        required
                        minLength={6}
                    />
                </div>
                )}

                {view === 'login' && (
                    <div className="flex justify-end">
                        <button type="button" onClick={() => { setView('forgot'); setError(null); }} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition">
                            Forgot Password?
                        </button>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
                >
                {isLoading ? (
                    <Loader2 size={24} className="animate-spin" />
                ) : (
                    <>
                    {view === 'login' && 'Sign In'}
                    {view === 'signup' && 'Create Account'}
                    {view === 'forgot' && 'Send Reset Link'}
                    {view !== 'forgot' && <ArrowRight size={20} />}
                    </>
                )}
                </button>
            </form>

            {view === 'forgot' && (
                <button onClick={() => { setView('login'); setError(null); }} className="w-full mt-4 text-gray-500 text-sm hover:text-emerald-600 font-bold py-3 transition">
                    ← Back to Login
                </button>
            )}
         </div>
      </div>
      
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-slide-down {
            animation: slide-down 0.4s ease-out;
        }
        .animate-shake {
            animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;

import React, { useState } from 'react';
import { ChefHat, ArrowRight, Leaf, ShieldCheck, Globe, HeartPulse, Sparkles, Building2, BarChart3, ChevronRight, X, FileText, Linkedin, Twitter } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const [activeLegal, setActiveLegal] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
             <div className="bg-emerald-600 text-white p-2 rounded-xl">
                <ChefHat size={24} />
             </div>
             <span className="text-xl font-extrabold text-emerald-950 tracking-tight">ReplateIQ.ai</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
            <button onClick={() => scrollToSection('mission')} className="hover:text-emerald-600 transition">Our Mission</button>
            <button onClick={() => scrollToSection('solutions')} className="hover:text-emerald-600 transition">Solutions</button>
            <button onClick={() => scrollToSection('enterprise')} className="hover:text-emerald-600 transition">Enterprise</button>
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={onLogin}
                className="text-sm font-bold text-gray-600 hover:text-emerald-600 transition"
             >
                Log In
             </button>
             <button 
                onClick={onGetStarted}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
             >
                Get Started <ArrowRight size={16} />
             </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
         {/* Background Elements */}
         <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 opacity-50 -z-10"></div>
         <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-teal-50 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4 opacity-50 -z-10"></div>

         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={14} /> The Future of Nutrition Tech
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">
                    Eat Smarter.<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Live Better.</span><br/>
                    Save the Planet.
                </h1>
                <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
                    An enterprise-grade platform combining AI-powered dietary planning, caloric analysis, and community-driven food rescue.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={onGetStarted}
                        className="bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                    >
                        Join the Movement
                    </button>
                    <button 
                        onClick={() => scrollToSection('enterprise')}
                        className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                        <Building2 size={20} /> Enterprise Solutions
                    </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400 font-medium pt-4">
                    <span className="flex items-center gap-1"><ShieldCheck size={16} className="text-emerald-500"/> SOC2 Compliant</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1"><Globe size={16} className="text-emerald-500"/> Available Globally</span>
                </div>
            </div>

            <div className="relative">
                 <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 transform rotate-2 hover:rotate-0 transition duration-500">
                    <img 
                        src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop" 
                        alt="Healthy Food" 
                        className="rounded-2xl w-full h-auto object-cover"
                    />
                    
                    {/* Floating Cards (Mockup Only - No fake stats) */}
                    <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce-slow">
                        <div className="bg-green-100 p-2 rounded-full text-green-600"><Leaf size={24}/></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Impact</p>
                            <p className="text-lg font-black text-gray-800">Carbon Reduced</p>
                        </div>
                    </div>

                    <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce-delayed">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600"><HeartPulse size={24}/></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Health</p>
                            <p className="text-lg font-black text-gray-800">Optimized</p>
                        </div>
                    </div>
                 </div>
                 
                 <div className="absolute inset-0 bg-emerald-600 rounded-3xl transform -rotate-2 scale-105 opacity-10 -z-10"></div>
            </div>
         </div>
      </section>

      {/* --- MISSION --- */}
      <section id="mission" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Our Mission & Impact</h2>
            <h3 className="text-4xl font-extrabold text-gray-900 mb-6">Democratizing Nutrition, <br/>Saving the Planet.</h3>
            <p className="text-xl text-gray-500 leading-relaxed">
                We believe that personal health and planetary health are interconnected. ReplateIQ.ai is built on the philosophy that technology should empower individuals to make smarter food choices while eliminating waste.
            </p>
        </div>
      </section>

      {/* --- SOLUTIONS GRID --- */}
      <section id="solutions" className="py-24 px-6 bg-gray-900 text-white relative overflow-hidden scroll-mt-20">
        {/* Abstract BG */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute right-0 top-0 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-16">
                 <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3">The ReplateIQ Ecosystem</h2>
                 <h3 className="text-4xl font-extrabold text-white">Enterprise-Grade Solutions</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        icon: <Sparkles size={32}/>,
                        title: "AI Nutrition Engine",
                        desc: "Advanced algorithms analyze ingredients to generate personalized, nutritionally balanced recipes in seconds."
                    },
                    {
                        icon: <Globe size={32}/>,
                        title: "Eco-Share Hub",
                        desc: "A hyperlocal marketplace for sharing surplus food, reducing landfill waste and building community resilience."
                    },
                    {
                        icon: <BarChart3 size={32}/>,
                        title: "Carbon Analytics",
                        desc: "Real-time tracking of personal and corporate carbon footprints with verifiable credit generation."
                    }
                ].map((card, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition duration-300 group">
                        <div className="bg-emerald-500/20 text-emerald-400 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                            {card.icon}
                        </div>
                        <h4 className="text-2xl font-bold mb-3">{card.title}</h4>
                        <p className="text-gray-400 leading-relaxed">{card.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- CTA SECTION (ENTERPRISE) --- */}
      <section id="enterprise" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto bg-emerald-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black mb-6">Be a part of ReplateIQ.ai</h2>
                <p className="text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
                    Whether you're an individual looking to eat better or an organization aiming for net-zero, we have the tools you need.
                </p>
                <button 
                    onClick={onGetStarted}
                    className="bg-white text-emerald-900 px-10 py-5 rounded-full font-bold text-lg shadow-xl hover:bg-emerald-50 transition transform hover:-translate-y-1 inline-flex items-center gap-2"
                >
                    Get Started Now <ChevronRight size={20}/>
                </button>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-100 pt-20 pb-10 px-6">
         <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                        <ChefHat size={20} />
                    </div>
                    <span className="text-xl font-extrabold text-gray-900 tracking-tight">ReplateIQ.ai</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Empowering the world to eat smarter and waste less through artificial intelligence.
                </p>
            </div>
            
            <div>
                <h4 className="font-bold text-gray-900 mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                    <li><button onClick={() => scrollToSection('solutions')} className="hover:text-emerald-600 text-left">AI Kitchen</button></li>
                    <li><button onClick={() => scrollToSection('solutions')} className="hover:text-emerald-600 text-left">Eco-Share</button></li>
                    <li><button onClick={() => scrollToSection('solutions')} className="hover:text-emerald-600 text-left">Carbon Wallet</button></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-gray-900 mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                    <li><button onClick={() => scrollToSection('mission')} className="hover:text-emerald-600 text-left">About Us</button></li>
                    <li><button onClick={() => scrollToSection('mission')} className="hover:text-emerald-600 text-left">Sustainability</button></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-500">
                    <li><button onClick={() => setActiveLegal('privacy')} className="hover:text-emerald-600 text-left">Privacy Policy</button></li>
                    <li><button onClick={() => setActiveLegal('terms')} className="hover:text-emerald-600 text-left">Terms of Service</button></li>
                </ul>
            </div>
         </div>
         
         <div className="max-w-7xl mx-auto pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-gray-400 text-sm">© 2024 ReplateIQ.ai Inc. All rights reserved.</p>
             <div className="flex gap-4">
                 <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition cursor-pointer" onClick={() => window.open('https://replateiq.ai', '_blank')}>
                     <Globe size={16}/>
                 </div>
             </div>
         </div>
      </footer>

      {/* LEGAL MODAL */}
      {activeLegal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveLegal(null)}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button onClick={() => setActiveLegal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
                <div className="flex items-center gap-3 mb-6 text-emerald-600">
                    <FileText size={28} />
                    <h3 className="text-2xl font-bold">{activeLegal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h3>
                </div>
                <div className="prose text-gray-500 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                    <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
                    <p>Welcome to ReplateIQ.ai. This is a sample legal document for demonstration purposes.</p>
                    <p>At ReplateIQ.ai, we take your privacy seriously. We collect data to provide personalized recipe generation and carbon tracking services. Your data is stored securely and never sold to third parties.</p>
                    <p>By using our service, you agree to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Use the platform for lawful purposes only.</li>
                        <li>Respect the community guidelines in the Eco-Share Hub.</li>
                        <li>Provide accurate information for carbon credit calculations.</li>
                    </ul>
                    <p className="mt-4">For full legal details, please contact legal@replateiq.ai</p>
                </div>
                <button onClick={() => setActiveLegal(null)} className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition">
                    Close
                </button>
            </div>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
        }
        .animate-bounce-slow {
            animation: bounce-slow 3s infinite ease-in-out;
        }
        .animate-bounce-delayed {
            animation: bounce-slow 3s infinite ease-in-out 1.5s;
        }
        html {
            scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
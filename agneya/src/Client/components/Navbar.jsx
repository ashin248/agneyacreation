import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import { 
  ShoppingBag, 
  Palette, 
  Truck, 
  ClipboardList, 
  Heart,
  User, 
  Menu, 
  X,
  ChevronRight,
  LogIn,
  Package,
  Cpu
} from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { cartCount } = useCart();
  const { currentUser, userData } = useAuth();
  const logoImg = '/logo.png';

  return (
    <div className="flex flex-col w-full sticky top-0 z-[100]">
      <nav className="bg-white/80 backdrop-blur-3xl border-b border-slate-100 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
            
            {/* 2. VECTOR BRANDING */}
            <div className="flex items-center">
              <Link to="/" className="group flex items-center gap-4">
                <div className="relative">
                    <img src={logoImg} alt="Agneya" className="h-10 w-auto object-contain transition-all duration-700 group-hover:scale-105" />
                    <div className="absolute -inset-4 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-all"></div>
                </div>
                <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2"></div>
                <div className="hidden sm:flex flex-col space-y-0">
                    <span className="text-[12px] font-black text-slate-950 uppercase tracking-tighter italic leading-none">Agneya HQ</span>
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-0.5">Live Collections</span>
                </div>
              </Link>
            </div>

            {/* 3. CORE NAVIGATION (TACTICAL) */}
            <div className="hidden md:flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              {[
                { name: 'Shop All', path: '/', icon: ShoppingBag },
                { name: 'Wishlist', path: '/wishlist', icon: Heart },
                { name: 'My Cart', path: '/cart', icon: ClipboardList },
                { name: 'Orders', path: '/track-order', icon: Package },
              ].map((item) => (
                <NavLink 
                  key={item.name}
                  to={item.path} 
                  className={({ isActive }) => `flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-500 ${
                    isActive 
                      ? 'bg-slate-950 text-white shadow-2xl scale-105' 
                      : 'text-slate-400 hover:text-slate-950 hover:bg-white'
                  }`}
                >
                  <item.icon size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                </NavLink>
              ))}
            </div>

            {/* 4. SECTOR ACTIONS */}
            <div className="flex items-center gap-4">
              {currentUser || userData ? (
                <Link to="/dashboard" className="hidden lg:flex items-center gap-3 pl-2 pr-6 py-2 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-slate-950 transition-all duration-500 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-950 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white/40">Hello,</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter group-hover:text-white truncate max-w-[80px]">
                        {userData?.name?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                </Link>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hidden md:flex items-center gap-3 px-8 py-3.5 bg-slate-950 text-[10px] font-black uppercase tracking-widest rounded-2xl text-white hover:bg-indigo-600 transition-all shadow-xl active:scale-95"
                  aria-label="Login to your account"
                >
                  <LogIn size={14} /> Login
                </button>
              )}

              {/* Mobile Hub Trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg active:scale-90 transition-all"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
        </div>

        {/* 5. MOBILE OVERLAY HUBS */}
        <div className={`md:hidden absolute top-20 left-0 w-full bg-white/95 backdrop-blur-3xl border-b border-slate-100 shadow-2xl transition-all duration-500 ${
            isMobileMenuOpen ? 'max-h-screen opacity-100 visible' : 'max-h-0 opacity-0 invisible'
        }`}>
            <div className="p-8 space-y-6">
              {[
                { name: 'All Products', path: '/', icon: ShoppingBag, desc: 'Browse catalog' },
                { name: 'My Wishlist', path: '/wishlist', icon: Heart, desc: 'View your library' },
                { name: 'Shopping Cart', path: '/cart', icon: ClipboardList, desc: 'Review & Buy Now' },
                { name: 'Track Orders', path: '/track-order', icon: Package, desc: 'View order history' },
              ].map((item) => (
                <Link 
                    key={item.name}
                    to={item.path} 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center gap-5 p-5 bg-slate-50 rounded-[32px] border border-slate-100 group active:bg-slate-950 active:text-white transition-all"
                >
                    <div className="w-14 h-14 rounded-[20px] bg-white flex items-center justify-center text-slate-400 group-active:bg-white/10 group-active:text-white transition-all shadow-sm">
                        <item.icon size={24} />
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 group-active:text-white">{item.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-active:text-white/40">{item.desc}</p>
                    </div>
                </Link>
              ))}
              
              {!currentUser && !userData && (
                <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}
                    className="w-full py-6 bg-indigo-600 text-white rounded-[32px] font-black text-[12px] uppercase tracking-widest shadow-2xl"
                >
                    Login Now
                </button>
              )}
            </div>
        </div>
      </nav>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export default Navbar;



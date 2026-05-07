import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import {
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Package,
  LogIn,
  ChevronDown,
  Sparkles,
  ShoppingCart,
  MapPin
} from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { currentUser, userData, logout } = useAuth();
  const location = useLocation();
  const userMenuRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Scroll detection for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'Shop', path: '/shop', icon: ShoppingBag },
    { name: 'Wishlist', path: '/wishlist', icon: Heart },
    { name: 'Orders', path: '/track-order', icon: Package },
  ];

  const displayName = userData?.name?.split(' ')[0] || 'Account';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b'
            : 'bg-white/80 backdrop-blur-md'
        }`}
        style={isScrolled ? { borderBottomColor: 'rgba(247,148,29,0.18)', boxShadow: '0 1px 16px rgba(247,148,29,0.08)' } : {}}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[70px]">

            {/* ── LOGO ── */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-orange-200 group-hover:ring-orange-400 transition-all duration-300">
                <img loading="lazy" src="/logo.png"
                  alt="Agneya"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-black text-slate-900 tracking-tight block leading-none">
                  Agneya
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.18em] leading-none mt-0.5 block"
                  style={{ background: 'linear-gradient(90deg,#F7941D,#7B1760)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  Live Collections
                </span>
              </div>
            </Link>

            {/* ── DESKTOP NAV LINKS ── */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ name, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                    }`
                  }
                  style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg,#F7941D,#7B1760)' } : {}}
                >
                  <Icon size={15} />
                  {name}
                </NavLink>
              ))}
            </nav>

            {/* ── RIGHT ACTIONS ── */}
            <div className="flex items-center gap-2">

              {/* Custom CTA — Desktop only */}
              <Link
                to="/custom-mobile-cases"
                className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 text-white shadow-sm hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#F7941D 0%,#F4A41B 50%,#7B1760 100%)' }}
              >
                <Sparkles size={14} />
                Design Your Case
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200"
                aria-label={`Shopping cart, ${cartCount} items`}
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm" style={{ background: '#F7941D' }}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User — Logged In */}
              {currentUser || userData ? (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-orange-50 transition-all duration-200"
                    aria-expanded={isUserMenuOpen}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#F7941D,#7B1760)' }}>
                      <User size={14} />
                    </div>
                    <span className="text-[12px] font-semibold max-w-[80px] truncate">{displayName}</span>
                    <ChevronDown
                      size={13}
                      className={`text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-[10px] text-slate-400 font-medium">Signed in as</p>
                        <p className="text-[12px] font-bold text-slate-900 truncate mt-0.5">{userData?.name || 'User'}</p>
                      </div>
                      {[
                        { label: 'My Dashboard', path: '/dashboard', icon: User },
                        { label: 'My Orders', path: '/track-order', icon: Package },
                        { label: 'Wishlist', path: '/wishlist', icon: Heart },
                        { label: 'Saved Addresses', path: '/dashboard', icon: MapPin },
                      ].map(({ label, path, icon: Icon }) => (
                        <Link
                          key={label}
                          to={path}
                          className="flex items-center gap-3 px-4 py-2.5 text-[12px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Icon size={14} className="text-slate-400" />
                          {label}
                        </Link>
                      ))}
                      <div className="border-t border-slate-50 mt-1 pt-1">
                        <button
                          onClick={() => { logout(); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <LogIn size={14} className="rotate-180" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-[12px] font-semibold transition-all duration-200 shadow-sm hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#F7941D 0%,#7B1760 100%)' }}
                  aria-label="Login to your account"
                >
                  <LogIn size={14} />
                  Login
                </button>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-slate-700 hover:bg-slate-100 transition-all"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU OVERLAY ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[300px] z-[95] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setIsMobileMenuOpen(false)}>
            <img loading="lazy" src="/logo.png" alt="Agneya" className="w-8 h-8 object-contain rounded-lg" />
            <span className="text-sm font-black text-slate-900">Agneya</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {[
            { name: 'Shop Products', path: '/shop', icon: ShoppingBag, desc: 'Browse the full catalog' },
            { name: 'My Cart', path: '/cart', icon: ShoppingCart, desc: `${cartCount} item${cartCount !== 1 ? 's' : ''} waiting`, badge: cartCount },
            { name: 'Wishlist', path: '/wishlist', icon: Heart, desc: 'Your saved items' },
            { name: 'Track Orders', path: '/track-order', icon: Package, desc: 'View order status' },
            { name: 'Design Your Case', path: '/custom-mobile-cases', icon: Sparkles, desc: 'Custom mobile cases' },
          ].map(({ name, path, icon: Icon, desc, badge }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-orange-50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center text-orange-400 group-hover:text-orange-600 transition-colors flex-shrink-0 relative">
                <Icon size={18} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center" style={{ background: '#F7941D' }}>
                    {badge}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 leading-tight">{name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="px-4 pb-6 pt-4 border-t border-slate-100">
          {currentUser || userData ? (
            <div className="space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 transition-all"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#F7941D,#7B1760)' }}>
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Signed in as</p>
                  <p className="text-[13px] font-bold text-slate-900">{displayName}</p>
                </div>
              </Link>
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="w-full py-3 rounded-2xl text-[12px] font-semibold text-rose-500 hover:bg-rose-50 transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}
              className="w-full py-4 text-white rounded-2xl font-semibold text-[13px] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
              style={{ background: 'linear-gradient(135deg,#F7941D 0%,#F4A41B 45%,#7B1760 100%)' }}
            >
              <LogIn size={16} />
              Login / Sign Up
            </button>
          )}
        </div>
      </div>

      {/* Spacer so page content doesn't hide behind fixed nav */}
      <div className="h-16 md:h-[70px]" aria-hidden="true" />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};

export default Navbar;

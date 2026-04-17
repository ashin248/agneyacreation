import React, { useState, useEffect } from 'react';
import './userLayout.css';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

function UserLayout({ children, userName = "User" }) {
  const [branding, setBranding] = useState({
    storeName: 'Agneya',
    logoUrl: '/logo.png'
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await axios.get('/api/public/settings');
        if (res.data.success && res.data.data) {
          setBranding(res.data.data);
        }
      } catch (err) {
        console.error("Failed to sync branding assets:", err);
      }
    };
    fetchBranding();
  }, []);

  return (
    <div className="layoutWrapper">
      {/* Premium Shipping Banner as seen in screenshot */}
      <div className="shippingBanner">
        <span className="shippingIcon">🚚</span>
        <span className="freeShippingText">
          Add <span>₹1,500</span> more for <span>FREE shipping!</span>
        </span>
        <div className="shippingProgressBar">
          <div className="shippingProgressFill"></div>
        </div>
      </div>

      <nav className="userNavBar">
        <div className="logoSection">
          <NavLink to="/" className="flex items-center gap-3">
            <img src={branding.logoUrl || '/logo.png'} alt={branding.storeName} className='AgneyaLogo' />
            <span className="hidden md:block text-xl font-black tracking-tighter uppercase text-slate-900">{branding.storeName}</span>
          </NavLink>
        </div>

        {/* Desktop Links */}
        <div className="navLinks hidden md:flex">
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/track-order">Track Order</NavLink>
        </div>

        <div className="navActions">
          <div className="cartIcon">
            <i className="bi bi-cart3"></i>
            <span className="cartBadge">0</span>
          </div>
          <NavLink to="/admin/login" className="hidden sm:block">
            <button className="adminLoginBtn">Admin Login</button>
          </NavLink>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'} text-2xl`}></i>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="mobileMenuOverlay animate-in fade-in slide-in-from-top duration-300">
            <div className="mobileLinks">
              <NavLink to="/" onClick={() => setIsMenuOpen(false)}>Shop</NavLink>
              <NavLink to="/track-order" onClick={() => setIsMenuOpen(false)}>Track Order</NavLink>
              <NavLink to="/admin/login" onClick={() => setIsMenuOpen(false)}>Admin Access</NavLink>
            </div>
          </div>
        )}
      </nav>

      <main className="mainContent">
        {children}
      </main>
    </div>
  );
}

export default UserLayout;


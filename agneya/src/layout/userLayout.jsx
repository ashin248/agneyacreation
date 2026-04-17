import React, { useState, useEffect } from 'react';
import './userLayout.css';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

function UserLayout({ children, userName = "User" }) {
  const [branding, setBranding] = useState({
    storeName: 'Agneya',
    logoUrl: '/logo.png'
  });

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

        <div className="navLinks">
          <NavLink to="/">Shop</NavLink>
          {/* <NavLink to="/custom-design">Custom Studio</NavLink> */}
          <NavLink to="/track-order">Track Order</NavLink>
        </div>

        <div className="navActions">
          <div className="cartIcon">
            <i className="bi bi-cart3"></i>
            <span className="cartBadge">0</span>
          </div>
          <NavLink to="/admin/login">
            <button className="adminLoginBtn">Admin Login</button>
          </NavLink>
        </div>
      </nav>

      <main className="mainContent">
        {children}
      </main>
    </div>
  );
}

export default UserLayout;


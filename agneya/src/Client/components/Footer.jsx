import React from 'react';
import { 
  MapPin, 
  Phone
} from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="border-t py-4 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A0B12 0%, #2D1020 60%, #4A0E3C 100%)', borderTopColor: 'rgba(247,148,29,0.18)' }}>
      {/* Subtle brand glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px" style={{ background: 'linear-gradient(90deg, transparent, #F7941D, #7B1760, transparent)' }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* 1. BRAND SECTOR */}
          <div className="flex items-center gap-4">
            <img loading="lazy" src="/logo.png" alt="Agneya" className="w-10 h-10 object-contain bg-white rounded-xl p-1.5 shadow-md" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight uppercase leading-none">
                Agneya{' '}
                <span style={{ background: 'linear-gradient(90deg,#F7941D,#F4A41B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Creations</span>
              </span>
              <span className="text-[7px] font-black uppercase tracking-[0.4em]" style={{ color: '#7B1760' }}>Artistry &amp; Precision</span>
            </div>
          </div>

          {/* 2. CONTACT & SOCIALS */}
          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/agneya.creations?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group">
              <FaInstagram size={14} style={{ color: '#F7941D' }} />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Instagram</span>
            </a>

            <a href="https://maps.app.goo.gl/bLKwJ7uYyCR6T7XEA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group">
              <MapPin size={14} style={{ color: '#F4A41B' }} />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Location</span>
            </a>

            <a href="tel:9656353903" className="flex items-center gap-3 pl-4 border-l text-slate-400 hover:text-white transition-all group" style={{ borderLeftColor: 'rgba(247,148,29,0.2)' }}>
              <Phone size={14} style={{ color: '#F7941D' }} />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">9656353903</span>
              </div>
            </a>
          </div>

          {/* 3. COPYRIGHT */}
          <div className="flex items-center gap-4" style={{ color: 'rgba(247,148,29,0.4)' }}>
            <p className="text-[8px] font-black uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} AGNEYA_V3</p>
            <div className="w-1 h-1 rounded-full" style={{ background: '#F7941D' }}></div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Operational</span>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;

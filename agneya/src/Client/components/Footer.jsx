import React from 'react';
import { 
  MapPin, 
  Phone
} from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#0c0c2a] border-t border-white/5 py-4 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* 1. BRAND SECTOR (COMPACT) */}
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Agneya" className="w-10 h-10 object-contain bg-white rounded-xl p-1.5" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight uppercase leading-none">Agneya <span className="text-indigo-400">Creations</span></span>
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">Artistry & Precision</span>
            </div>
          </div>
          
          {/* 2. CONTACT & SOCIALS (INLINE) */}
          <div className="flex items-center gap-6">
            <a href="https://www.instagram.com/agneya.creations?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group">
              <FaInstagram size={14} className="text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Instagram</span>
            </a>
            
            <a href="https://maps.app.goo.gl/bLKwJ7uYyCR6T7XEA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-all group">
              <MapPin size={14} className="text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Location</span>
            </a>

            <a href="tel:9656353903" className="flex items-center gap-3 pl-4 border-l border-white/10 text-slate-400 hover:text-white transition-all group">
              <Phone size={14} className="text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">9656353903</span>
              </div>
            </a>
          </div>

          {/* 3. TERMINUS BAR (REDUCED) */}
          <div className="flex items-center gap-4 text-slate-600">
            <p className="text-[8px] font-black uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} AGNEYA_V3</p>
            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Operational</span>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;

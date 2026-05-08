import React from 'react';
import { 
  MapPin, 
  Phone
} from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="py-8 relative overflow-hidden" style={{ backgroundColor: 'var(--color-neu-bg)', borderTop: '1px solid var(--color-neu-dark)' }}>
      {/* Subtle brand glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px opacity-20" style={{ background: 'linear-gradient(90deg, transparent, var(--color-neu-accent), var(--color-neu-text), transparent)' }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">

          {/* 1. BRAND SECTOR */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 neu-pressed flex items-center justify-center">
              <img loading="lazy" src="/logo.png" alt="Agneya" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter uppercase leading-none" style={{ color: 'var(--color-neu-text)' }}>
                Agneya{' '}
                <span style={{ color: 'var(--color-neu-accent)' }}>Creations</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] mt-1 opacity-50" style={{ color: 'var(--color-neu-text)' }}>Artistry &amp; Precision</span>
            </div>
          </div>

          {/* 2. CONTACT & SOCIALS */}
          <div className="flex items-center gap-8">
            <a href="https://www.instagram.com/agneya.creations?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all group" style={{ color: 'var(--color-neu-text)' }}>
              <FaInstagram size={16} style={{ color: 'var(--color-neu-accent)' }} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Instagram</span>
            </a>

            <a href="https://maps.app.goo.gl/bLKwJ7uYyCR6T7XEA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all group" style={{ color: 'var(--color-neu-text)' }}>
              <MapPin size={16} style={{ color: 'var(--color-neu-accent)' }} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Location</span>
            </a>

            <a href="tel:9656353903" className="flex items-center gap-3 pl-6 border-l transition-all group" style={{ borderLeftColor: 'var(--color-neu-dark)' }}>
              <Phone size={16} style={{ color: 'var(--color-neu-accent)' }} />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest leading-none" style={{ color: 'var(--color-neu-text)' }}>9656353903</span>
              </div>
            </a>
          </div>

          {/* 3. COPYRIGHT */}
          <div className="flex items-center gap-4 opacity-40">
            <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--color-neu-text)' }}>&copy; {new Date().getFullYear()} AGNEYA_V3</p>
            <div className="w-1 h-1 rounded-full bg-[var(--color-neu-accent)]"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--color-neu-text)' }}>Operational</span>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;

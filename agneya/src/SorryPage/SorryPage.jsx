import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './SorryPage.css';

const SorryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: 'var(--color-neu-bg)' }}>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]" style={{ background: 'var(--color-neu-accent)' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]" style={{ background: 'var(--color-neu-text)' }}></div>
      
      <div className="relative z-10 text-center px-6">
        <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter opacity-10" style={{ color: 'var(--color-neu-text)' }}>404</h1>
        
        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-4" style={{ color: 'var(--color-neu-text)' }}>Lost in the Cosmos?</h2>
        
        <p className="max-w-md mx-auto text-sm md:text-base font-medium opacity-60 mb-10 leading-relaxed" style={{ color: 'var(--color-neu-text)' }}>
          The page you're searching for has either migrated to a new galaxy 
          or never existed in our universe. Let's get you back on track.
        </p>

        <button 
          className="neu-button-accent px-10 py-4 flex items-center gap-3 mx-auto font-black uppercase text-xs tracking-[0.2em] transition-all hover:scale-105" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} strokeWidth={3} />
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default SorryPage;


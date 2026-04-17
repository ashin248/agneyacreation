import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './SorryPage.css';

const SorryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="sorry-container">
      <div className="sorry-bg-blob one"></div>
      <div className="sorry-bg-blob two"></div>
      
      <div className="sorry-content">
        <h1 className="sorry-404">404</h1>
        
        <h2 className="sorry-title">Lost in the Cosmos?</h2>
        
        <p className="sorry-text">
          The page you're searching for has either migrated to a new galaxy 
          or never existed in our universe. Let's get you back on track.
        </p>

        <button 
          className="sorry-home-btn" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} strokeWidth={3} />
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default SorryPage;


import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, MessageCircle } from 'lucide-react';
import { DOLPHIN_TIPS } from '../../constants/ocean';

const DolphinMascot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tipIndex, setTipIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [wiggle, setWiggle] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DOLPHIN_TIPS.length);
      setWiggle(true);
      setTimeout(() => setWiggle(false), 600);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-sky-500/20 border border-sky-400/30 backdrop-blur-md text-sky-400 hover:bg-sky-500/30 transition-all cursor-pointer shadow-lg shadow-sky-500/10"
        title="Show Nautix Dolphin Guide"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );
  }

  const handleClick = () => {
    if (location.pathname !== '/chat') {
      navigate('/chat');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Speech bubble */}
      <div className="relative max-w-[220px] animate-fade-in">
        <div className="glass-card px-4 py-3 rounded-2xl rounded-br-sm text-xs text-slate-200 leading-relaxed shadow-xl">
          <button
            onClick={() => setVisible(false)}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="pr-2">{DOLPHIN_TIPS[tipIndex]}</p>
        </div>
      </div>

      {/* Dolphin character */}
      <button
        onClick={handleClick}
        className={`group relative cursor-pointer transition-transform duration-300 hover:scale-110 ${wiggle ? 'animate-dolphin-wiggle' : ''}`}
        title="Chat with Nautix Assistant"
      >
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl scale-150 group-hover:bg-cyan-400/30 transition-all" />
        <svg
          width="72"
          height="72"
          viewBox="0 0 100 100"
          className="drop-shadow-lg dolphin-look-at-user"
        >
          <ellipse cx="50" cy="55" rx="35" ry="22" fill="#4cc9f0" />
          <ellipse cx="50" cy="58" rx="28" ry="14" fill="#90e0ef" opacity="0.6" />
          <path d="M15 50 Q5 45 8 35 Q12 48 15 50" fill="#4cc9f0" />
          <path d="M85 45 Q95 40 92 30 Q88 43 85 45" fill="#4cc9f0" />
          <circle cx="38" cy="48" r="5" fill="#1a1a2e" />
          <circle cx="40" cy="46" r="2" fill="white" />
          <circle cx="62" cy="48" r="5" fill="#1a1a2e" />
          <circle cx="64" cy="46" r="2" fill="white" />
          <path d="M42 62 Q50 68 58 62" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="30" cy="58" rx="4" ry="2.5" fill="#ffb4b4" opacity="0.5" />
          <ellipse cx="70" cy="58" rx="4" ry="2.5" fill="#ffb4b4" opacity="0.5" />
          <path d="M50 30 Q55 15 65 20 Q55 22 50 30" fill="#4cc9f0" />
        </svg>
      </button>
    </div>
  );
};

export default DolphinMascot;

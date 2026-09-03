import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerGlobalRefresh } from '../../hooks/useAutoRefresh';

const navItems = [
  { path: '/app/terminal', label: 'Фарм', icon: <img src="/icon_farm.png" alt="Фарм" className="w-6 h-6 object-contain" />, className: 'nav-terminal' },
  { path: '/app/bets', label: 'Ставки', icon: <img src="/icon_bets.png" alt="Ставки" className="w-6 h-6 object-contain" />, className: 'nav-bets' },
  { path: '/app/leaderboard', label: 'Топ', icon: <img src="/icon_leaderboard.png" alt="Топ" className="w-6 h-6 object-contain" />, className: 'nav-leaderboard' },
  { path: '/app/feedback', label: 'Идеи', icon: <img src="/icon_feedback.png" alt="Идеи" className="w-6 h-6 object-contain" />, className: 'nav-feedback' },
];

const TmaBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[64px] bg-white/85 dark:bg-slate-900/85 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800/80 flex justify-around items-center z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.25)]">
      {navItems?.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <button 
            key={item.path}
            onClick={() => {
              navigate(item.path);
              triggerGlobalRefresh();
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-2xl cursor-pointer transition-all duration-150 border-none bg-transparent ${
              isActive 
                ? 'text-orange-500 scale-105' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center drop-shadow-xs">
              {item.icon}
            </span>
            <span className={`text-[10px] tracking-tight ${isActive ? 'font-black text-orange-500' : 'font-semibold text-slate-500 dark:text-slate-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TmaBottomNav;

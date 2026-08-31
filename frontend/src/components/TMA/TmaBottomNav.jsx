import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/app/terminal', label: 'Терминал', icon: '🚀', className: 'nav-terminal' }
];

const TmaBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[70px] bg-[var(--card-bg)] backdrop-blur-md border-t border-[var(--glass-border)] flex justify-around items-center z-50 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <div 
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 p-2 cursor-pointer transition-all duration-200 ${item.className} ${isActive ? 'text-orange-500 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="text-2xl drop-shadow-sm">{item.icon}</span>
            <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default TmaBottomNav;

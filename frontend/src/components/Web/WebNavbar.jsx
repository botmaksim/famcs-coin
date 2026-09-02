import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TelegramLoginWidget from '../TelegramLoginWidget';
import { useUser } from '../../context/UserContext';
import { Moon, Sun } from 'lucide-react';

const WebNavbar = () => {
  const { user } = useUser();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <nav className="flex justify-between items-center px-10 py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[1000] shadow-sm transition-colors">
      <div className="flex items-center gap-5">
        <img 
          src="/famcscoin.png" 
          alt="" 
          className="w-8 h-8 rounded-full object-contain" 
          onError={(e) => { e.target.src = '/famcscoin.jpg'; }}
        />
        <Link to="/" className="text-xl font-black text-slate-800 dark:text-white no-underline tracking-wide hover:opacity-80 transition-opacity">FAMCS</Link>
      </div>
      <div className="flex gap-7">
        <Link to="/info" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium transition-colors">Информация</Link>
        <Link to="/leaderboard" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium transition-colors">Рейтинг</Link>
        <Link to="/feedback" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium transition-colors">Отзывы</Link>
      </div>
      <div className="flex items-center gap-6">
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {user?.tg_id ? (
          <div className="flex items-center gap-5">
            <span className="text-slate-800 dark:text-white font-medium">@{user.username || 'Пользователь'}</span>
            {(user.role === 'admin' || user.role === 'superadmin') && (
              <Link to="/admin-panel" className="px-5 py-2 bg-orange-500 text-white rounded font-bold hover:bg-orange-600 transition-colors">АДМИНКА</Link>
            )}
          </div>
        ) : (
          <div className="scale-90 origin-right">
            <TelegramLoginWidget />
          </div>
        )}
      </div>
    </nav>
  );
};

export default WebNavbar;

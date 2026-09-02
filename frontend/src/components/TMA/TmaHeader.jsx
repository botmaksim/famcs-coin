import React from 'react';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

const TmaHeader = () => {
  const { user, soundEnabled, toggleSound } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center px-5 py-4 bg-[var(--card-bg)] border-b border-[var(--glass-border)] backdrop-blur-md sticky top-0 z-50">
      <div 
        className="tma-header-profile flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
        onClick={() => navigate('/app/profile')}
      >
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white shadow-md overflow-hidden">
          {user?.avatar_url ? (
             <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
             user?.username?.charAt(0)?.toUpperCase() || 'U'
          )}
        </div>
        <div>
          <div className="font-bold text-sm text-[var(--text-color)]">{user?.custom_name || user?.username || 'Студент'}</div>
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/app/admin');
              }}
              className="text-[11px] text-orange-500 dark:text-orange-400 font-bold bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition mt-0.5"
              title="Открыть панель управления"
            >
              Администратор
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full bg-orange-50 dark:bg-slate-800 text-orange-500 hover:opacity-80 transition cursor-pointer"
          title={isDark ? "Светлая тема" : "Тёмная тема"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button 
          onClick={toggleSound} 
          className="p-2 rounded-full bg-orange-50 dark:bg-slate-800 text-orange-500 hover:opacity-80 transition cursor-pointer"
          title={soundEnabled ? "Выключить звук" : "Включить звук"}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <div className="flex items-center gap-1.5 font-bold text-orange-500 text-lg bg-orange-50 dark:bg-slate-800/50 px-3 py-1 rounded-full shadow-sm ml-1">
          <img src="/famcscoin.png" alt="coin" className="w-5 h-5 object-contain" /> 
          {user?.balance ? Math.floor(user.balance).toLocaleString('ru-RU') : 0}
        </div>
      </div>
    </div>
  );
};

export default TmaHeader;

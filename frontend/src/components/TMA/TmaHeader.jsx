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
    <div className="flex justify-between items-center px-4 py-3 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-800/80 backdrop-blur-md sticky top-0 z-50">
      <div 
        className="tma-header-profile flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition min-w-0"
        onClick={() => navigate('/app/profile')}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-white shadow-sm shrink-0 overflow-hidden text-sm">
          {user?.avatar_url ? (
             <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
             (user?.custom_name || user?.first_name || user?.username || 'U').charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-slate-800 dark:text-white truncate max-w-[130px] sm:max-w-[180px]">
            {user?.custom_name || user?.first_name || (user?.username ? `@${user.username}` : 'Студент')}
          </div>
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/app/admin');
              }}
              className="text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-500/10 px-2 py-0.2 rounded-full inline-flex items-center gap-1 cursor-pointer hover:bg-orange-500/20 transition"
              title="Панель управления"
            >
              {user?.role === 'superadmin' ? 'Суперадмин' : 'Админ'}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button 
          onClick={toggleSound} 
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={soundEnabled ? "Выключить звук" : "Включить звук"}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <button 
          onClick={toggleTheme} 
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={isDark ? "Светлая тема" : "Тёмная тема"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="flex items-center gap-1.5 font-bold text-orange-500 text-sm bg-orange-50 dark:bg-orange-950/40 border border-orange-200/50 dark:border-orange-900/40 px-2.5 py-1 rounded-full shadow-xs ml-1">
          <img src="/famcscoin.png" alt="coin" className="w-4 h-4 object-contain" /> 
          <span>{user?.balance ? Math.floor(user.balance).toLocaleString('ru-RU') : 0}</span>
        </div>
      </div>
    </div>
  );
};

export default TmaHeader;

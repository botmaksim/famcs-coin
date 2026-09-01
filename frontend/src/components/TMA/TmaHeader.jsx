import React from 'react';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Volume2, VolumeX } from 'lucide-react';

const TmaHeader = () => {
  const { user, soundEnabled, toggleSound } = useUser();
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center px-5 py-4 bg-[var(--card-bg)] border-b border-[var(--glass-border)] backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white shadow-md">
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <div className="font-bold text-sm text-[var(--text-color)]">{user?.username || 'Студент'}</div>
          <div className="text-xs text-orange-400 font-medium">{user?.role === 'admin' || user?.role === 'superadmin' ? 'Администратор' : 'Студент ФКНС'}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={toggleSound} className="p-2 rounded-full bg-orange-50 dark:bg-slate-800 text-orange-500 hover:opacity-80 transition cursor-pointer">
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button onClick={() => navigate('/app/profile')} className="p-2 rounded-full bg-orange-50 dark:bg-slate-800 text-orange-500 hover:opacity-80 transition cursor-pointer">
          <Trophy size={18} />
        </button>
        <div className="flex items-center gap-1.5 font-bold text-orange-500 text-lg bg-orange-50 dark:bg-slate-800/50 px-3 py-1 rounded-full shadow-sm ml-2">
          <img src="/famcscoin.png" alt="coin" className="w-5 h-5 object-contain" /> 
          {user?.balance ? Math.floor(user.balance) : 0}
        </div>
      </div>
    </div>
  );
};

export default TmaHeader;

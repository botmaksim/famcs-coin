import React from 'react';
import { Link } from 'react-router-dom';
import TelegramLoginWidget from '../TelegramLoginWidget';
import { useUser } from '../../context/UserContext';

const WebNavbar = () => {
  const { user } = useUser();

  return (
    <nav className="flex justify-between items-center px-10 py-5 bg-white border-b border-slate-200 sticky top-0 z-[1000] shadow-sm">
      <div className="flex items-center gap-5">
        <div className="w-1 h-6 bg-blue-600"></div>
        <Link to="/" className="text-xl font-bold text-slate-800 no-underline tracking-wide hover:opacity-80 transition-opacity">FAMCS</Link>
      </div>
      <div className="flex gap-7">
        <Link to="/info" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Info</Link>
        <Link to="/leaderboard" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Leaderboard</Link>
        <Link to="/hall-of-fame" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Hall of Fame</Link>
        <Link to="/dao" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">DAO</Link>
      </div>
      <div>
        {user?.tg_id ? (
          <div className="flex items-center gap-5">
            <span className="text-slate-800 font-medium">{user.username || 'User'}</span>
            {(user.role === 'admin' || user.role === 'superadmin') && (
              <Link to="/admin-panel" className="px-5 py-2 bg-slate-800 text-white rounded font-bold hover:bg-slate-700 transition-colors">PANEL</Link>
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

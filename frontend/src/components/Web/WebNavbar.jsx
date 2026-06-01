import React from 'react';
import { Link } from 'react-router-dom';
import TelegramLoginWidget from '../TelegramLoginWidget';
import { useUser } from '../../context/UserContext';

const WebNavbar = () => {
  const { user } = useUser();

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--glass-border)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-color)', textDecoration: 'none' }}>FAMCS Coin</Link>
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link to="/info" style={{ color: 'white', textDecoration: 'none' }}>Info</Link>
        <Link to="/leaderboard" style={{ color: 'white', textDecoration: 'none' }}>Leaderboard</Link>
        <Link to="/hall-of-fame" style={{ color: 'white', textDecoration: 'none' }}>Hall of Fame</Link>
        <Link to="/dao" style={{ color: 'white', textDecoration: 'none' }}>DAO</Link>
      </div>
      <div>
        {user?.tg_id ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: 'white' }}>{user.username || 'User'}</span>
            <Link to="/admin-panel" style={{ padding: '8px 16px', backgroundColor: 'var(--accent-color)', color: 'black', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Панель</Link>
          </div>
        ) : (
          <div style={{ transform: 'scale(0.8)', transformOrigin: 'right center' }}>
            <TelegramLoginWidget />
          </div>
        )}
      </div>
    </nav>
  );
};

export default WebNavbar;

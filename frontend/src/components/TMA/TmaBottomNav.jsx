import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/app/terminal', label: 'Тап', icon: '🚀' },
  { path: '/app/tasks', label: 'Earn', icon: '📝' },
  { path: '/app/events', label: 'Ивенты', icon: '🎉' },
  { path: '/app/college', label: 'Универ', icon: '🎓' },
  { path: '/app/dao', label: 'DAO', icon: '🏛️' }
];

const TmaBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      height: '65px',
      backgroundColor: 'var(--card-bg)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid var(--glass-border)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000
    }}>
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <div 
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '4px',
              padding: '8px', 
              cursor: 'pointer', 
              fontSize: '12px', 
              transition: '0.2s', 
              fontWeight: isActive ? 'bold' : 'normal', 
              color: isActive ? 'var(--accent-color)' : '#94a3b8' 
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default TmaBottomNav;

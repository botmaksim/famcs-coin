import React from 'react';
import { useUser } from '../../context/UserContext';

const TmaHeader = () => {
  const { user } = useUser();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--glass-border)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'black' }}>
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'white' }}>{user?.username || 'Студент'}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{user?.squad_id ? `Сквад #${user.squad_id}` : 'Без сквада'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: 'var(--accent-color)', fontSize: '16px' }}>
        <img src="/icons/coin.png" alt="coin" style={{ width: '20px', height: '20px' }} /> {user?.balance ? user.balance.toFixed(0) : 0}
      </div>
    </div>
  );
};

export default TmaHeader;

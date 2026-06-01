import { useState, useRef, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import apiClient from '../../api/client';

const Terminal = () => {
  const { user, updateLocalUser, loading, error, fetchProfile } = useUser();
  
  const [isSleeping, setIsSleeping] = useState(false);
  const [canSleep, setCanSleep] = useState(false);

  useEffect(() => {
    if (user && user.sleep_until) {
      const sleepUntil = new Date(user.sleep_until);
      if (sleepUntil > new Date()) {
        setIsSleeping(true);
      } else {
        setIsSleeping(false);
      }
    } else {
      setIsSleeping(false);
    }
  }, [user]);

  useEffect(() => {
    // Check if it's currently between 21:45 and 22:00
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      if ((hour === 21 && minute >= 45) || (hour === 22 && minute === 0)) {
        setCanSleep(true);
      } else {
        setCanSleep(false);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSleep = async () => {
    try {
      await apiClient.post('/user/sleep');
      await fetchProfile();
    } catch (err) {
      alert('Не удалось уложить коины: ' + (err.response?.data || err.message));
    }
  };
  
  // Keep track of unsynced clicks
  const pendingClicksRef = useRef(0);
  const syncTimeoutRef = useRef(null);

  const handleClick = (e) => {
    // Optional: Extract x,y for floating +1 animations later
    
    if (user.energy < 1) return;

    updateLocalUser({
      balance: user.balance + 1,
      energy: user.energy - 1,
    });
    
    pendingClicksRef.current += 1;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncClicks();
    }, 1000);
  };

  const syncClicks = async () => {
    const clicksToSync = pendingClicksRef.current;
    if (clicksToSync === 0) return;

    pendingClicksRef.current = 0;

    try {
      await apiClient.post('/user/click', { count: clicksToSync });
    } catch (err) {
      console.error('Failed to sync clicks', err);
    }
  };

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        if (pendingClicksRef.current > 0) {
           apiClient.post('/user/click', { count: pendingClicksRef.current }).catch(() => {});
        }
      }
    };
  }, []);

  if (loading) return <div style={{ textAlign: 'center', paddingTop: '50px' }}>Загрузка профиля...</div>;
  if (error) return <div style={{ textAlign: 'center', paddingTop: '50px', color: 'red' }}>Ошибка: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
      
      {/* Header Profile Area */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--card-bg)',
        padding: '15px 20px',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(10px)',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: 'var(--secondary-bg)',
            border: '2px solid var(--accent-color)'
          }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🧑‍🎓</div>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{user.custom_name || user.username || 'Студент'}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{user.role === 'admin' ? 'Админ' : 'ФПМИ'}</div>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Баланс</div>
          <div style={{ fontWeight: 'bold', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>{user.balance.toLocaleString()}</span>
            <span style={{ color: '#fbbf24' }}>🪙</span>
          </div>
        </div>
      </div>

      {/* Energy Bar area */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          ⚡ {user.energy} <span style={{ color: '#94a3b8', fontSize: '14px' }}>/ {user.maxEnergy}</span>
        </div>
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: 'var(--secondary-bg)',
          borderRadius: '5px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: 'var(--accent-color)',
            width: `${Math.min(100, (user.energy / user.maxEnergy) * 100)}%`,
            transition: 'width 0.1s ease-out'
          }}></div>
        </div>
      </div>

      {/* Main Clicker Area */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '20px' }}>
        
        {!isSleeping && canSleep && (
          <button 
            onClick={handleSleep}
            style={{
              padding: '15px 30px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: '#8b5cf6',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.6)',
              animation: 'pulse 2s infinite'
            }}>
            Уложить коины спать (Буст х1.5 на 8 часов)
          </button>
        )}

        {isSleeping ? (
          <div style={{
            fontSize: '50px',
            fontWeight: 'bold',
            color: '#94a3b8',
            animation: 'pulse 3s infinite',
            textShadow: '0 0 20px rgba(148, 163, 184, 0.5)'
          }}>
            Zzz...
          </div>
        ) : (
          <div className="tap-button" onClick={handleClick}>
             {/* Fallback text if user doesn't have logo.png in public yet */}
             <img 
              src={user.active_skin_url || "/logo.png"} 
              alt="TAP" 
              style={{ width: '100%', height: '100%', maxWidth: '200px', objectFit: 'cover', borderRadius: '50%', overflow: 'hidden' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span style="font-size: 40px; font-weight: bold; pointer-events: none; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5))">TAP!</span>';
              }} 
            />
          </div>
        )}
      </div>
      
    </div>
  );
};

export default Terminal;

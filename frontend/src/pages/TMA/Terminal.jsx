import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import apiClient from '../../api/client';
import { Skeleton } from '../../components/Skeleton';

const Terminal = () => {
  const { user, updateLocalUser, loading, error, fetchProfile } = useUser();
  
  const [isSleeping, setIsSleeping] = useState(false);
  const [canSleep, setCanSleep] = useState(false);
  const [clicks, setClicks] = useState([]);

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
    if (user.energy < 1) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newClick = { id: Date.now(), x, y };
    setClicks(prev => [...prev, newClick]);

    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== newClick.id));
    }, 1000);

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

  if (loading) return (
    <div className="flex flex-col h-full p-5">
      <Skeleton className="w-1/2 h-6 mx-auto mb-2" />
      <Skeleton className="w-full h-2.5 rounded-full mb-10" />
      <div className="flex-1 flex justify-center items-center">
        <Skeleton className="w-48 h-48 rounded-full" />
      </div>
    </div>
  );
  if (error) return <div className="text-center pt-12 text-red-500">Ошибка: {error}</div>;

  return (
    <div className="flex flex-col h-full p-5">

      {/* Energy Bar area */}
      <div className="text-center mb-5">
        <div className="text-lg font-bold mb-2 flex justify-center items-center">
          <img src="/icons/energy.png" alt="energy" className="w-5 h-5 mr-1" /> {user.energy} <span className="text-slate-600 text-sm ml-1">/ {user.maxEnergy}</span>
        </div>
        <div className="w-full h-2.5 bg-white rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 text-white transition-all duration-100 ease-out"
            style={{ width: `${Math.min(100, (user.energy / user.maxEnergy) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Main Clicker Area */}
      <div className="flex-1 flex justify-center items-center flex-col gap-5">
        
        {!isSleeping && canSleep && (
          <button 
            onClick={handleSleep}
            className="px-8 py-4 rounded-2xl border-none bg-blue-600 text-white font-bold text-base cursor-pointer shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] animate-pulse"
          >
            Уложить коины спать (Буст х1.5 на 8 часов)
          </button>
        )}

        {isSleeping ? (
          <div className="text-5xl font-bold text-slate-600 animate-pulse drop-shadow-[0_0_20px_rgba(148,163,184,0.5)]">
            Zzz...
          </div>
        ) : (
          <div className="tap-button relative" onClick={handleClick}>
             <AnimatePresence>
                {clicks.map((click) => (
                  <motion.div
                    key={click.id}
                    initial={{ opacity: 1, y: click.y - 10, x: click.x - 20 }}
                    animate={{ opacity: 0, y: click.y - 100 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute text-2xl font-bold text-black pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10"
                  >
                    +1
                  </motion.div>
                ))}
             </AnimatePresence>
             {/* Fallback text if user doesn't have logo.png in public yet */}
             <img 
              src={user.active_skin_url || "/logo.png"} 
              alt="TAP" 
              className="w-full h-full max-w-[200px] object-cover rounded-full overflow-hidden relative z-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span class="text-[40px] font-bold pointer-events-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] relative z-0">TAP!</span>';
              }} 
            />
          </div>
        )}
      </div>
      
    </div>
  );
};

export default Terminal;

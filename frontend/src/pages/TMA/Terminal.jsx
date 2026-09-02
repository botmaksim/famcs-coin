import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { UserService } from '../../api/services/UserService';
import { ShopService } from '../../api/services/ShopService';
import { Skeleton } from '../../components/Skeleton';
import { playTapSound } from '../../utils/audio';
import { Zap, Clock, CheckCircle2 } from 'lucide-react';

const Terminal = () => {
  const { user, updateLocalUser, loading, error, fetchProfile, soundEnabled } = useUser();
  
  const [clicks, setClicks] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [loadingShop, setLoadingShop] = useState(true);

  const fetchShop = async () => {
    try {
      const res = await ShopService.getItems();
      setShopItems(res.data);
    } catch (e) {
      console.error("Failed to load shop", e);
    } finally {
      setLoadingShop(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  // Keep track of unsynced clicks with localStorage fallback
  const pendingClicksRef = useRef(0);
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  const syncClicks = async () => {
    if (isSyncingRef.current || pendingClicksRef.current <= 0) return;

    const count = pendingClicksRef.current;
    pendingClicksRef.current = 0;
    localStorage.removeItem('pending_clicks');

    isSyncingRef.current = true;
    try {
      const res = await UserService.click(count);
      if (res.data && res.data.balance !== undefined) {
        // Reconcile: server balance + any in-flight clicks made while request was in-flight
        const inFlight = pendingClicksRef.current;
        updateLocalUser({
          balance: res.data.balance + inFlight,
          energy: Math.max(0, res.data.energy - inFlight),
        });
      }
    } catch (err) {
      console.error('Failed to sync clicks', err);
      // Only restore clicks on server/network errors
      if (!err.response || err.response.status >= 500) {
        pendingClicksRef.current += count;
        localStorage.setItem('pending_clicks', pendingClicksRef.current.toString());
      }
    } finally {
      isSyncingRef.current = false;
      if (pendingClicksRef.current > 0) {
        setTimeout(syncClicks, 300);
      }
    }
  };

  useEffect(() => {
    // Recover unsynced clicks from previous session if any
    const savedClicks = parseInt(localStorage.getItem('pending_clicks') || '0', 10);
    if (savedClicks > 0) {
      pendingClicksRef.current = savedClicks;
      syncClicks();
    }

    // Periodic flush every 1.5s during active clicking
    const interval = setInterval(() => {
      if (pendingClicksRef.current > 0) {
        syncClicks();
      }
    }, 1500);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && pendingClicksRef.current > 0) {
        syncClicks();
      }
    };

    const handleUnload = () => {
      if (pendingClicksRef.current > 0) {
        syncClicks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      if (pendingClicksRef.current > 0) {
        syncClicks();
      }
    };
  }, []);

  const handlePointerDown = (e) => {
    if (user.energy < 1) return;

    playTapSound(soundEnabled);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newClick = { id: Date.now() + Math.random(), x, y };
    setClicks(prev => [...prev, newClick]);

    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== newClick.id));
    }, 1000);

    updateLocalUser({
      balance: user.balance + 1,
      energy: user.energy - 1,
    });
    
    pendingClicksRef.current += 1;
    localStorage.setItem('pending_clicks', pendingClicksRef.current.toString());

    // Debounce sync when user stops tapping
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncClicks();
    }, 600);
  };

  const handleBuy = async (id) => {
    // Flush pending clicks so server has up-to-date balance
    if (pendingClicksRef.current > 0) {
      await syncClicks();
    }
    try {
      await ShopService.buyItem(id);
      await fetchProfile();
      await fetchShop();
    } catch (e) {
      alert("Не удалось купить улучшение!");
    }
  };

  const handleSell = async (id) => {
    if (pendingClicksRef.current > 0) {
      await syncClicks();
    }
    try {
      await ShopService.sellItem(id);
      await fetchProfile();
      await fetchShop();
    } catch (e) {
      alert("Не удалось продать улучшение!");
    }
  };

  if (loading) return null;
  
  if (error) return <div className="text-center pt-12 text-red-500 font-medium">{error}</div>;

  return (
    <div className="flex flex-col h-full p-5 pb-24 overflow-y-auto overflow-x-hidden">

      {/* Balance Area */}
      <div className="text-center mb-4">
        <div className="text-4xl font-black text-slate-800 dark:text-white drop-shadow-sm flex items-center justify-center gap-2">
          <img src="/famcscoin.png" alt="coin" className="w-8 h-8 rounded-full" />
          {Math.floor(user.balance).toLocaleString('ru-RU')}
        </div>
        <div className="text-sm text-slate-500 font-medium mt-1">
          +{user.passive_income}/час
        </div>
      </div>

      {/* Energy Bar area */}
      {(() => {
        const maxEnergy = user.max_energy || user.maxEnergy || 1000;
        const currentEnergy = Math.min(maxEnergy, Math.max(0, user.energy || 0));
        const isFull = currentEnergy >= maxEnergy;
        const remainingEnergy = Math.max(0, maxEnergy - currentEnergy);
        const secondsLeft = Math.ceil(remainingEnergy / 3);

        const formatTimeLeft = (sec) => {
          if (sec <= 0) return '';
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          if (m > 0) {
            return `${m} мин ${s} сек`;
          }
          return `${s} сек`;
        };

        return (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-100 dark:border-slate-700/60 rounded-2xl p-3.5 mb-8 shadow-sm tour-energy">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-800 dark:text-white">
                <Zap size={16} className={isFull ? "text-slate-400" : "text-amber-500 fill-amber-500 animate-pulse"} />
                <span>{currentEnergy}</span>
                <span className="text-slate-400 text-xs font-semibold">/ {maxEnergy}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
                {!isFull && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>}
                +3 / сек
              </div>
            </div>

            {/* Progress Bar with animated energy glow */}
            <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner relative border border-slate-200/60 dark:border-slate-700/60">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-300 ease-out relative"
                style={{ width: `${Math.min(100, (currentEnergy / maxEnergy) * 100)}%` }}
              >
                {!isFull && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite] -skew-x-12"></div>
                )}
              </div>
            </div>

            {/* Recovery time countdown */}
            <div className="flex justify-between items-center mt-2.5 text-xs font-semibold">
              {isFull ? (
                <div className="flex items-center gap-1 text-emerald-500 font-bold w-full justify-center">
                  <CheckCircle2 size={13} />
                  <span>Шкала энергии полностью заполнена</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 w-full justify-between">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-orange-500" />
                    Полное восстановление:
                  </span>
                  <span className="font-bold text-orange-500 dark:text-orange-400">
                    через {formatTimeLeft(secondsLeft)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Main Clicker Area */}
      <div className="flex justify-center items-center flex-col mb-12">
        <div 
          className="tap-button relative cursor-pointer select-none touch-none" 
          onPointerDown={handlePointerDown}
        >
            <AnimatePresence>
              {clicks?.map((click) => (
                <motion.div
                  key={click.id}
                  style={{ left: click.x, top: click.y }}
                  initial={{ opacity: 1, y: 0, x: "-50%", scale: 0.8 }}
                  animate={{ opacity: 0, y: -100, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute text-4xl font-black text-orange-500 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)] dark:text-orange-400 pointer-events-none select-none z-10"
                >
                  +1
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.div
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <img 
                src="/famcscoin.png" 
                alt="TAP" 
                draggable={false}
                className="w-64 h-64 object-cover rounded-full shadow-[0_0_40px_rgba(249,115,22,0.3)] border-4 border-orange-500/20 select-none pointer-events-none"
              />
            </motion.div>
        </div>
      </div>

      {/* Shop Area */}
      <div className="mt-4 tour-shop">
        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Магазин улучшений</h3>
        {loadingShop ? (
           <Skeleton className="w-full h-24 rounded-2xl mb-3" />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {shopItems?.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-700/50">
                <img src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`} alt={item.title} className="w-16 h-16 rounded-xl object-cover" onError={(e) => { e.target.src = '/famcscoin.png'; }} />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.title}</h4>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-3">{item.description}</p>
                  <div className="flex gap-3 text-xs font-medium">
                    <span className="text-orange-500 flex items-center gap-1">
                      <img src="/famcscoin.png" className="w-3 h-3 rounded-full" /> {Math.floor(item.price).toLocaleString()}
                    </span>
                    <span className="text-green-500">+{item.profit_increase}/ч</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-slate-400 font-medium">Ур. {item.quantity}</span>
                  <div className="flex gap-1 mt-1">
                    {item.quantity > 0 && (
                      <button 
                        onClick={() => handleSell(item.id)}
                        className="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-transform"
                      >
                        -1
                      </button>
                    )}
                    <button 
                      onClick={() => handleBuy(item.id)}
                      disabled={user.balance < item.price}
                      className="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                    >
                      Купить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {shopItems.length === 0 && (
              <div className="text-center text-slate-500 py-4 text-sm">В магазине пока пусто</div>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default Terminal;

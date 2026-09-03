import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { UserService } from '../../api/services/UserService';
import { ShopService } from '../../api/services/ShopService';
import { Skeleton } from '../../components/Skeleton';
import { playTapSound } from '../../utils/audio';
import { Zap, Clock, CheckCircle2, Store } from 'lucide-react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

const Terminal = () => {
  const { user, updateLocalUser, loading, error, fetchProfile, soundEnabled } = useUser();
  const { showSuccess, showError } = useToast();
  
  const [activeTab, setActiveTab] = useState('tap'); // 'tap' | 'shop'
  const [clicks, setClicks] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [loadingShop, setLoadingShop] = useState(true);

  const fetchShop = useCallback(async () => {
    try {
      const res = await ShopService.getItems();
      setShopItems(res.data);
    } catch (e) {
      console.error("Failed to load shop", e);
    } finally {
      setLoadingShop(false);
    }
  }, []);

  const refreshTerminal = useCallback(() => {
    fetchShop();
    fetchProfile?.();
  }, [fetchShop, fetchProfile]);

  useAutoRefresh(refreshTerminal);

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
      showSuccess("Улучшение успешно куплено!");
    } catch (e) {
      showError(e.response?.data || "Не удалось купить улучшение!");
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
      showSuccess("Улучшение успешно продано!");
    } catch (e) {
      showError(e.response?.data || "Не удалось продать улучшение!");
    }
  };

  if (loading) return null;
  
  if (error) return <div className="text-center pt-12 text-red-500 font-medium">{error}</div>;

  return (
    <div className="flex flex-col h-full p-4 pb-24 overflow-y-auto overflow-x-hidden">
      {/* Top Segmented Switcher */}
      <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-2xl mb-4 max-w-[360px] mx-auto w-full backdrop-blur-xs border border-slate-200/40 dark:border-slate-700/40">
        <button
          onClick={() => setActiveTab('tap')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'tap'
              ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Zap size={14} />
          <span>Кликер</span>
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'shop'
              ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Store size={14} />
          <span>Магазин улучшений</span>
        </button>
      </div>

      {activeTab === 'tap' ? (
        <div className="flex flex-col flex-1 justify-between items-center max-w-[420px] mx-auto w-full py-2">
          {/* Balance Hero */}
          <div className="text-center mb-3">
            <div className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight flex items-center justify-center gap-2.5">
              <img 
                src="/famcscoin.png" 
                alt="coin" 
                className="w-9 h-9 object-contain drop-shadow-sm" 
                onError={(e) => { e.target.src = '/famcscoin.jpg'; }}
              />
              <span>{Math.floor(user.balance).toLocaleString('ru-RU')}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              <Clock size={12} className="text-orange-500" />
              <span>+{user.passive_income}/час</span>
            </div>
          </div>

          {/* Main Clicker Coin */}
          <div className="relative my-auto flex justify-center items-center py-4">
            {/* Soft ambient background glow */}
            <div className="absolute w-60 h-60 rounded-full bg-orange-500/15 dark:bg-orange-500/20 blur-3xl -z-10 pointer-events-none transform scale-90" />
            
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
                  className="w-56 h-56 sm:w-64 sm:h-64 object-cover rounded-full shadow-[0_12px_40px_rgba(249,115,22,0.25)] border-4 border-orange-500/20 select-none pointer-events-none transition-transform"
                />
              </motion.div>
            </div>
          </div>

          {/* Energy Bar Card */}
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
                return `${m} мин ${s} с`;
              }
              return `${s} с`;
            };

            return (
              <div className="w-full max-w-[360px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-3.5 shadow-xs tour-energy mt-2">
                <div className="flex justify-between items-center text-xs mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                    <Zap size={14} className={isFull ? "text-slate-400" : "text-amber-500 fill-amber-500"} />
                    <span>{currentEnergy}</span>
                    <span className="text-slate-400 text-[11px] font-normal">/ {maxEnergy}</span>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isFull ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Заполнено
                      </span>
                    ) : (
                      <span>+3/с · ~{formatTimeLeft(secondsLeft)}</span>
                    )}
                  </div>
                </div>

                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, (currentEnergy / maxEnergy) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Quick link to Shop */}
          <button
            onClick={() => setActiveTab('shop')}
            className="mt-3.5 w-full max-w-[360px] py-2.5 px-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-between text-xs font-bold transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Store size={15} />
              <span>Прокачать пассивный доход</span>
            </div>
            <span className="text-[11px] text-orange-500 font-black">
              В магазин →
            </span>
          </button>
        </div>
      ) : (
        /* Shop Tab */
        <div className="max-w-[480px] mx-auto w-full tour-shop">
          {/* Shop Header Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-4 mb-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-bold opacity-90">Текущий доход</div>
              <div className="text-2xl font-black mt-0.5">+{user.passive_income} FC/час</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium opacity-80">Доступно улучшений</div>
              <div className="text-sm font-black">{shopItems.length} шт.</div>
            </div>
          </div>

          <h3 className="text-base font-bold mb-3 text-slate-800 dark:text-white px-1">
            Магазин улучшений
          </h3>

          {loadingShop ? (
             <Skeleton className="w-full h-24 rounded-2xl mb-3" />
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {shopItems?.map(item => {
                const canAfford = user.balance >= item.price;

                return (
                  <div 
                    key={item.id} 
                    className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xs border border-slate-100 dark:border-slate-700/60"
                  >
                    <img 
                      src={item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`} 
                      alt={item.title} 
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-700" 
                      onError={(e) => { e.target.src = '/famcscoin.png'; }} 
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{item.title}</h4>
                        <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
                          Ур. {item.quantity}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400 line-clamp-1 mb-1.5">{item.description}</p>
                      
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-orange-500 font-bold flex items-center gap-1">
                          <img src="/famcscoin.png" className="w-3 h-3 rounded-full" alt="" />
                          {Math.floor(item.price).toLocaleString('ru-RU')}
                        </span>
                        <span className="text-emerald-500 font-bold">
                          +{item.profit_increase}/ч
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex gap-1">
                        {item.quantity > 0 && (
                          <button 
                            onClick={() => handleSell(item.id)}
                            className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 px-2.5 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition cursor-pointer"
                            title="Продать 1 шт."
                          >
                            -1
                          </button>
                        )}
                        <button 
                          onClick={() => handleBuy(item.id)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                            canAfford 
                              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs' 
                              : 'bg-slate-100 dark:bg-slate-700/60 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Купить
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {shopItems.length === 0 && (
                <div className="text-center text-slate-400 py-8 text-xs">
                  В магазине пока пусто
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Terminal;

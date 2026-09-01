import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { UserService } from '../../api/services/UserService';
import { ShopService } from '../../api/services/ShopService';
import { Skeleton } from '../../components/Skeleton';
import { playTapSound } from '../../utils/audio';

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

  // Keep track of unsynced clicks
  const pendingClicksRef = useRef(0);
  const syncTimeoutRef = useRef(null);

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
      await UserService.click(clicksToSync);
    } catch (err) {
      console.error('Failed to sync clicks', err);
    }
  };

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        if (pendingClicksRef.current > 0) {
           UserService.click(pendingClicksRef.current).catch(() => {});
        }
      }
    };
  }, []);

  const handleBuy = async (id) => {
    try {
      await ShopService.buyItem(id);
      await fetchProfile();
      await fetchShop();
    } catch (e) {
      alert("Не удалось купить улучшение!");
    }
  };

  const handleSell = async (id) => {
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
      <div className="text-center mb-8">
        <div className="text-sm font-bold mb-1 flex justify-center items-center text-orange-500">
          {user.energy} / {user.maxEnergy || 1000}
        </div>
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner border border-white/20 dark:border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-100 ease-out"
            style={{ width: `${Math.min(100, (user.energy / (user.maxEnergy || 1000)) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Main Clicker Area */}
      <div className="flex justify-center items-center flex-col mb-12">
        <div 
          className="tap-button relative cursor-pointer active:scale-95 transition-transform select-none touch-none" 
          onPointerDown={handlePointerDown}
        >
            <AnimatePresence>
              {clicks?.map((click) => (
                <motion.div
                  key={click.id}
                  initial={{ opacity: 1, y: click.y - 10, x: click.x - 20, scale: 0.8 }}
                  animate={{ opacity: 0, y: click.y - 120, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute text-4xl font-black text-orange-500 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)] dark:text-orange-400 pointer-events-none select-none z-10"
                >
                  +1
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.div
              whileTap={{ scale: 0.94, rotate: (Math.random() - 0.5) * 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <img 
                src="/famcscoin.png" 
                alt="TAP" 
                className="w-64 h-64 object-cover rounded-full shadow-[0_0_40px_rgba(249,115,22,0.3)] border-4 border-orange-500/20 select-none"
              />
            </motion.div>
        </div>
      </div>

      {/* Shop Area */}
      <div className="mt-4">
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
                  <p className="text-xs text-slate-500 mb-2 line-clamp-1">{item.description}</p>
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

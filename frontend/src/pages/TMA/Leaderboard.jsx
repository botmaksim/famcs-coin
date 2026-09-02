import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LeaderboardService } from '../../api/services/LeaderboardService';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('balance');
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await LeaderboardService.getLeaderboard(sortBy, period);
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [sortBy, period]);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  const getMedal = (index) => {
    if (index === 0) return '/medal_gold.png';
    if (index === 1) return '/medal_silver.png';
    if (index === 2) return '/medal_bronze.png';
    return null;
  };

  const getPodiumOrder = (top3Array) => {
    if (top3Array.length === 0) return [];
    if (top3Array.length === 1) return [null, top3Array[0], null];
    if (top3Array.length === 2) return [top3Array[1], top3Array[0], null];
    return [top3Array[1], top3Array[0], top3Array[2]];
  };

  const podiumUsers = getPodiumOrder(top3);

  const renderValue = (u) => {
    if (sortBy === 'income') return `+${Math.floor(u.passive_income)}/ч`;
    if (sortBy === 'bets_won') return `${u.bets_won || 0} шт.`;
    if (sortBy === 'bets_profit') return `+${Math.floor(u.bets_profit || 0).toLocaleString()}`;
    return Math.floor(u.balance).toLocaleString();
  };
  
  const renderPodiumItem = (user, rank) => {
    if (!user) return <div key={rank} className="w-1/3" />;
    
    const heightPixelMap = { 1: 130, 2: 95, 3: 70 };
    const medalSize = { 1: 'w-16 h-16 -top-8', 2: 'w-12 h-12 -top-6', 3: 'w-10 h-10 -top-5' };
    const borderGlow = {
      1: 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]',
      2: 'ring-4 ring-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.3)]',
      3: 'ring-4 ring-amber-700 shadow-[0_0_12px_rgba(180,83,9,0.3)]'
    };

    return (
      <div key={rank} className="w-1/3 flex flex-col items-center justify-end relative">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 + (rank * 0.1) }}
          className="flex flex-col items-center z-10 mb-2"
        >
          <div className="relative">
            <div className={`rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center font-bold text-orange-500 overflow-hidden ${borderGlow[rank]} ${rank === 1 ? 'w-20 h-20 text-2xl' : rank === 2 ? 'w-16 h-16 text-xl' : 'w-14 h-14 text-lg'}`}>
              {user.avatar_url ? (
                 <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                 (user.custom_name || user.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <img 
              src={getMedal(rank-1)} 
              className={`absolute ${medalSize[rank]} left-1/2 -translate-x-1/2 z-20 object-contain pointer-events-none`} 
              alt=""
              onError={(e) => {
                const fallback = `/medal_${rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'}.jpg`;
                if (e.target.src !== fallback) {
                  e.target.src = fallback;
                } else {
                  e.target.style.display = 'none';
                }
              }}
            />
          </div>
          <div className="font-bold text-xs mt-2 text-slate-800 dark:text-white text-center w-full truncate px-1">
            {user.custom_name || user.username}
          </div>
          <div className="text-[10px] font-bold text-orange-500 flex items-center justify-center gap-0.5 mt-0.5">
            {sortBy !== 'bets_won' && (
              <img 
                src="/famcscoin.png" 
                alt=""
                className="w-3 h-3 object-contain" 
                onError={(e) => { e.target.src = '/famcscoin.jpg'; }}
              />
            )}
            {renderValue(user)}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: heightPixelMap[rank] }}
          transition={{ duration: 0.5, delay: rank * 0.15, type: "spring" }}
          className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-2xl shadow-[inset_0_4px_10px_rgba(255,255,255,0.3)] flex justify-center pt-2.5 overflow-hidden"
        >
           <span className="text-white/90 font-black text-2xl drop-shadow-sm">#{rank}</span>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="flex flex-col pb-28">
      <div className="p-5 pb-0 sticky top-0 z-40 bg-[var(--card-bg)]/90 backdrop-blur-md border-b border-[var(--glass-border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <img src="/icon_leaderboard.png" alt="" className="w-7 h-7 object-contain drop-shadow-sm" />
            <h2 className="text-2xl font-black text-slate-800 dark:text-white m-0">Топ</h2>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
            <button 
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'all' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'}`}
            >
              За всё время
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${period === 'month' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'}`}
            >
              Месяц
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 pb-3">
          {[
            { id: 'balance', label: 'По балансу' },
            { id: 'income', label: 'По доходу' },
            { id: 'bets_won', label: 'Угаданные ставки' },
            { id: 'bets_profit', label: 'Профит со ставок' }
          ].map(opt => (
            <button 
              key={opt.id}
              onClick={() => setSortBy(opt.id)}
              className={`py-2 px-2.5 text-xs font-bold rounded-xl transition-all text-center ${sortBy === opt.id ? 'bg-orange-500 text-white shadow-[0_4px_14px_0_rgba(249,115,22,0.39)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
         <div className="text-center py-20 font-medium text-slate-500">Загрузка...</div>
      ) : (
        <div className="px-5 mt-3">
          {top3.length > 0 && (
            <div className="flex items-end justify-center min-h-[240px] mb-8 mt-1 px-1">
              {renderPodiumItem(podiumUsers[0], 2)}
              {renderPodiumItem(podiumUsers[1], 1)}
              {renderPodiumItem(podiumUsers[2], 3)}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {rest?.map((u, i) => (
                <motion.div 
                  key={u.tg_id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                  <div className="font-bold text-slate-400 w-8 text-center text-sm">#{i + 4}</div>
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold overflow-hidden">
                    {u.avatar_url ? (
                       <img src={u.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                       (u.custom_name || u.username || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 font-bold dark:text-white truncate text-sm">{u.custom_name || u.username}</div>
                  <div className="flex items-center gap-1.5 text-orange-500 font-bold text-sm bg-orange-50 dark:bg-slate-900/50 px-2 py-1 rounded-lg">
                    {sortBy !== 'bets_won' && <img src="/famcscoin.png" className="w-4 h-4" />}
                    {renderValue(u)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {users.length === 0 && (
              <div className="text-center text-slate-500 py-10">Тут пока пусто</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

import React, { useState, useEffect } from 'react';
import { LeaderboardService } from '../../api/services/LeaderboardService';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('balance');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await LeaderboardService.getLeaderboard(sortBy);
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [sortBy]);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  const getMedal = (index) => {
    if (index === 0) return '/medal_gold.jpg';
    if (index === 1) return '/medal_silver.jpg';
    if (index === 2) return '/medal_bronze.jpg';
    return null;
  };

  const getPodiumOrder = (top3Array) => {
    // We want visually [2nd, 1st, 3rd] on the podium
    if (top3Array.length === 0) return [];
    if (top3Array.length === 1) return [null, top3Array[0], null];
    if (top3Array.length === 2) return [top3Array[1], top3Array[0], null];
    return [top3Array[1], top3Array[0], top3Array[2]];
  };

  const podiumUsers = getPodiumOrder(top3);
  
  const renderPodiumItem = (user, rank) => {
    if (!user) return <div className="w-1/3" />;
    
    const heightMap = {
      1: 'h-40',
      2: 'h-32',
      3: 'h-28'
    };
    
    const medalSize = {
      1: 'w-16 h-16 -top-8',
      2: 'w-12 h-12 -top-6',
      3: 'w-10 h-10 -top-5'
    };

    return (
      <div className="w-1/3 flex flex-col items-center justify-end relative">
        <div className="flex flex-col items-center z-10 mb-2">
          <div className="relative">
            <div className={`rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-500 overflow-hidden border-4 border-[var(--card-bg)] shadow-md ${rank === 1 ? 'w-20 h-20 text-2xl' : rank === 2 ? 'w-16 h-16 text-xl' : 'w-14 h-14 text-lg'}`}>
              {user.avatar_url ? (
                 <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                 (user.custom_name || user.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <img src={getMedal(rank-1)} className={`absolute ${medalSize[rank]} left-1/2 -translate-x-1/2 rounded-full shadow-lg drop-shadow-md z-20 object-cover`} alt={`Rank ${rank}`} />
          </div>
          <div className="font-bold text-xs mt-2 text-slate-800 dark:text-white text-center w-full truncate px-1">
            {user.custom_name || user.username}
          </div>
          <div className="text-[10px] font-bold text-orange-500 flex items-center justify-center gap-0.5 mt-0.5">
            <img src="/famcscoin.png" className="w-3 h-3" />
            {sortBy === 'balance' ? Math.floor(user.balance).toLocaleString() : `+${Math.floor(user.passive_income)}/ч`}
          </div>
        </div>
        
        {/* The Pedestal Block */}
        <div className={`w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-xl ${heightMap[rank]} shadow-[inset_0_4px_10px_rgba(255,255,255,0.3)] flex justify-center pt-2`}>
           <span className="text-white/80 font-black text-2xl drop-shadow-sm">{rank}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden pb-24">
      <div className="p-5 pb-0 sticky top-0 z-40 bg-[var(--card-bg)]/90 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <img src="/icon_leaderboard.png" alt="Топ" className="w-8 h-8 object-contain drop-shadow-sm" />
          <h2 className="text-2xl font-black text-slate-800 dark:text-white m-0">Топ игроков</h2>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-4">
          <button 
            onClick={() => setSortBy('balance')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${sortBy === 'balance' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'}`}
          >
            По балансу
          </button>
          <button 
            onClick={() => setSortBy('income')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${sortBy === 'income' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'}`}
          >
            По доходу
          </button>
        </div>
      </div>

      {loading ? (
         <div className="text-center py-20 font-medium text-slate-500">Загрузка...</div>
      ) : (
        <div className="px-5">
          {/* Podium for Top 3 */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center h-56 mb-8 mt-6">
              {renderPodiumItem(podiumUsers[0], 2)}
              {renderPodiumItem(podiumUsers[1], 1)}
              {renderPodiumItem(podiumUsers[2], 3)}
            </div>
          )}

          {/* List for Rest */}
          <div className="flex flex-col gap-3">
            {rest?.map((u, i) => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
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
                  <img src="/famcscoin.png" className="w-4 h-4" />
                  {sortBy === 'balance' ? Math.floor(u.balance).toLocaleString() : `+${Math.floor(u.passive_income)}/ч`}
                </div>
              </div>
            ))}
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

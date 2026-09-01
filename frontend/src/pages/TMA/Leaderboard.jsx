import React, { useState, useEffect } from 'react';
import { LeaderboardService } from '../../api/services/LeaderboardService';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await LeaderboardService.getLeaderboard();
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="text-center py-10">Загрузка...</div>;

  return (
    <div className="p-5">
      <div className="flex items-center gap-3 mb-5">
        <img src="/icon_leaderboard.png" alt="Топ" className="w-8 h-8 object-contain drop-shadow-sm" />
        <h2 className="text-2xl font-black text-slate-800 dark:text-white m-0">Топ игроков</h2>
      </div>
      <div className="flex flex-col gap-3">
        {users.map((u, i) => (
          <div key={i} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="font-bold text-slate-400 w-6 text-center">#{i + 1}</div>
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">
              {u.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 font-bold dark:text-white">@{u.username}</div>
            <div className="flex items-center gap-1 text-orange-500 font-bold">
              <img src="/famcscoin.png" className="w-4 h-4" />
              {Math.floor(u.balance)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;

import React, { useState, useEffect } from 'react';
import { LeaderboardService } from '../../api/services/LeaderboardService';
import { Trophy } from 'lucide-react';

const WebLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await LeaderboardService.getWebLeaderboard();
        setPlayers(res.data || []);
      } catch (error) {
        console.error('Failed to fetch leaderboards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="font-sans">
      <div className="py-12 px-5 max-w-[1000px] mx-auto">
        <h1 className="text-5xl tracking-tight text-center mb-12 font-black text-slate-800 dark:text-white">
          Глобальный <span className="text-orange-500">Рейтинг</span>
        </h1>

        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2 px-8 py-3 rounded-full text-lg font-bold bg-orange-500 text-white shadow-[0_4px_14px_0_rgba(249,115,22,0.39)]">
            <Trophy size={20} /> Топ Студентов
          </div>
        </div>

        {loading ? (
          <div className="text-center text-xl text-slate-400 py-20 animate-pulse">Загрузка данных...</div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                  <th className="p-5 w-24 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Ранг</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Студент</th>
                  <th className="p-5 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Баланс</th>
                </tr>
              </thead>
              <tbody>
                {players?.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80">
                    <td className={`p-5 text-center text-xl font-bold ${
                      index === 0 ? 'text-amber-500 text-2xl' : 
                      index === 1 ? 'text-slate-400 text-xl' : 
                      index === 2 ? 'text-amber-700 text-xl' : 'text-slate-500 text-lg'
                    }`}>
                      #{index + 1}
                    </td>
                    <td className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex justify-center items-center overflow-hidden font-bold text-xl">
                        {item.avatar_url ? (
                           <img src={item.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                           (item.custom_name || item.username || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-800 dark:text-white">
                          {item.custom_name || `@${item.username}`}
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-right text-lg font-bold text-orange-500">
                      {Math.floor(item.balance).toLocaleString('ru-RU')} <img src="/famcscoin.jpg" className="inline w-4 h-4 rounded-full -mt-1" />
                    </td>
                  </tr>
                ))}
                {players.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-16 text-center text-slate-400 text-lg">Нет данных</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebLeaderboard;

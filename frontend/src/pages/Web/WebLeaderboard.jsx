import React, { useState, useEffect } from 'react';
import { LeaderboardService } from '../../api/services/LeaderboardService';
import { Link } from 'react-router-dom';
import { Trophy, Users, Heart } from 'lucide-react';

const WebLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [tippers, setTippers] = useState([]);
  const [activeTab, setActiveTab] = useState('players');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [playersRes, squadsRes, tippersRes] = await Promise.all([
          LeaderboardService.getWebPlayers(),
          LeaderboardService.getWebSquads(),
          LeaderboardService.getWebTippers()
        ]);
        setPlayers(playersRes.data || []);
        setSquads(squadsRes.data || []);
        setTippers(tippersRes.data || []);
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
      <div className="py-12 px-5 max-w-[1200px] mx-auto">
        <h1 className="text-5xl tracking-tight text-center mb-12 font-extrabold text-[var(--text-color)]">
          Глобальные <span className="text-blue-600">Рейтинги</span>
        </h1>

        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-8 py-3 rounded-full text-lg font-bold transition-all duration-200 ${
              activeTab === 'players' 
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Trophy size={20} /> Игроки
          </button>
          <button
            onClick={() => setActiveTab('squads')}
            className={`flex items-center gap-2 px-8 py-3 rounded-full text-lg font-bold transition-all duration-200 ${
              activeTab === 'squads' 
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users size={20} /> Сквады
          </button>
          <button
            onClick={() => setActiveTab('tippers')}
            className={`flex items-center gap-2 px-8 py-3 rounded-full text-lg font-bold transition-all duration-200 ${
              activeTab === 'tippers' 
                ? 'bg-pink-500 text-white shadow-md hover:bg-pink-600' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Heart size={20} /> Меценаты
          </button>
        </div>

        {loading ? (
          <div className="text-center text-xl text-slate-400 py-20 animate-pulse">Загрузка данных...</div>
        ) : (
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--glass-border)] overflow-hidden shadow-lg backdrop-blur-md">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-[var(--glass-border)]">
                  <th className="p-5 w-24 text-center font-bold text-slate-500 uppercase tracking-wider text-sm">Ранг</th>
                  <th className="p-5 font-bold text-slate-500 uppercase tracking-wider text-sm">
                    {activeTab === 'players' ? 'Студент' : activeTab === 'tippers' ? 'Меценат' : 'Название сквада'}
                  </th>
                  <th className="p-5 text-right font-bold text-slate-500 uppercase tracking-wider text-sm">
                    {activeTab === 'players' ? 'Баланс' : activeTab === 'tippers' ? 'Сумма чаевых' : 'Общие очки'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'players' ? players : activeTab === 'tippers' ? tippers : squads).map((item, index) => (
                  <tr key={index} className="border-b border-[var(--glass-border)] transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className={`p-5 text-center text-xl font-bold ${
                      index === 0 ? 'text-amber-500 text-2xl' : 
                      index === 1 ? 'text-slate-400 text-xl' : 
                      index === 2 ? 'text-amber-700 text-xl' : 'text-slate-500 text-lg'
                    }`}>
                      #{index + 1}
                    </td>
                    <td className="p-5 flex items-center gap-4">
                      {activeTab !== 'squads' && (
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex justify-center items-center overflow-hidden border-2 border-slate-200 dark:border-slate-600 shadow-sm">
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🕵️</span>
                          )}
                        </div>
                      )}
                      <div>
                        <div className="text-lg font-bold text-[var(--text-color)]">
                          {activeTab !== 'squads' ? (item.custom_name || item.username) : item.name}
                        </div>
                        {activeTab !== 'squads' && item.is_hidden && (
                          <div className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block mt-1">Скрытый профиль</div>
                        )}
                      </div>
                    </td>
                    <td className={`p-5 text-right text-lg font-bold ${activeTab === 'tippers' ? 'text-pink-500' : 'text-blue-600'}`}>
                      {Math.floor(activeTab === 'players' ? item.balance : activeTab === 'tippers' ? item.total_tips : item.total_points).toLocaleString()} FAMCS
                    </td>
                  </tr>
                ))}
                {(activeTab === 'players' ? players : activeTab === 'tippers' ? tippers : squads).length === 0 && (
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

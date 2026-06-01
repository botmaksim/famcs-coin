import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Link } from 'react-router-dom';

const WebLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [activeTab, setActiveTab] = useState('players');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [playersRes, squadsRes] = await Promise.all([
          apiClient.get('/web/leaderboard/players'),
          apiClient.get('/web/leaderboard/squads')
        ]);
        setPlayers(playersRes.data || []);
        setSquads(squadsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch leaderboards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="font-sans text-slate-800">
      <div className="py-10 px-5 max-w-[1200px] mx-auto">
        <h1 className="text-5xl uppercase tracking-[2px] text-center mb-10 text-slate-900 font-bold">
          Глобальные <span className="text-blue-600">Рейтинги</span>
        </h1>

        <div className="flex justify-center gap-5 mb-10">
          <button
            onClick={() => setActiveTab('players')}
            className={`px-8 py-3 rounded-full border border-solid text-lg font-bold cursor-pointer transition-all duration-200 ${
              activeTab === 'players' 
                ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' 
                : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Игроки
          </button>
          <button
            onClick={() => setActiveTab('squads')}
            className={`px-8 py-3 rounded-full border border-solid text-lg font-bold cursor-pointer transition-all duration-200 ${
              activeTab === 'squads' 
                ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' 
                : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Сквады
          </button>
        </div>

        {loading ? (
          <div className="text-center text-xl text-slate-400">Загрузка данных...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-5 w-20 text-center font-bold text-slate-600">Ранг</th>
                  <th className="p-5 font-bold text-slate-600">{activeTab === 'players' ? 'Студент' : 'Название сквада'}</th>
                  <th className="p-5 text-right font-bold text-slate-600">{activeTab === 'players' ? 'Баланс' : 'Общие очки'}</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'players' ? players : squads).map((item, index) => (
                  <tr key={index} className="border-b border-slate-200 transition-colors hover:bg-slate-50">
                    <td className={`p-5 text-center text-xl font-bold ${index < 3 ? 'text-blue-600' : 'text-slate-400'}`}>
                      #{index + 1}
                    </td>
                    <td className="p-5 flex items-center gap-4">
                      {activeTab === 'players' && (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex justify-center items-center overflow-hidden border border-slate-200">
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🕵️</span>
                          )}
                        </div>
                      )}
                      <div>
                        <div className="text-lg font-bold text-slate-800">
                          {activeTab === 'players' ? (item.custom_name || item.username) : item.name}
                        </div>
                        {activeTab === 'players' && item.is_hidden && (
                          <div className="text-xs text-slate-400">Скрытый профиль</div>
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-right text-lg font-bold text-blue-600">
                      {Math.floor(activeTab === 'players' ? item.balance : item.total_points).toLocaleString()} FAMCS
                    </td>
                  </tr>
                ))}
                {(activeTab === 'players' ? players : squads).length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-10 text-center text-slate-400">Нет данных</td>
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

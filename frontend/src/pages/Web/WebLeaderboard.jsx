import React, { useState, useEffect } from 'react';
import { LeaderboardService } from '../../api/services/LeaderboardService';
import { Trophy, TrendingUp, Award, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const WebLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('balance'); // 'balance' | 'income' | 'bets_won' | 'bets_profit'
  const [period, setPeriod] = useState('all'); // 'all' | 'month'

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await LeaderboardService.getWebLeaderboard(sortBy, period);
      setPlayers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy, period]);

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

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

  const podiumPlayers = getPodiumOrder(top3);

  const renderValue = (u) => {
    if (!u) return '';
    if (sortBy === 'income') return `+${Math.floor(u.passive_income).toLocaleString('ru-RU')}/ч`;
    if (sortBy === 'bets_won') return `${u.bets_won || 0} шт.`;
    if (sortBy === 'bets_profit') return `+${Math.floor(u.bets_profit || 0).toLocaleString('ru-RU')}`;
    return Math.floor(u.balance).toLocaleString('ru-RU');
  };

  const renderPodiumItem = (player, rank) => {
    if (!player) return <div key={rank} className="w-1/3" />;

    const heightMap = { 1: 'h-48', 2: 'h-36', 3: 'h-28' };
    const medalSize = { 1: 'w-16 h-16 -top-8', 2: 'w-12 h-12 -top-6', 3: 'w-11 h-11 -top-5' };
    const borderGlow = {
      1: 'ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.3)]',
      2: 'ring-4 ring-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.3)]',
      3: 'ring-4 ring-amber-700 shadow-[0_0_15px_rgba(180,83,9,0.3)]'
    };

    return (
      <div key={rank} className="w-1/3 flex flex-col items-center justify-end relative">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 + (rank * 0.1) }}
          className="flex flex-col items-center z-10 mb-3"
        >
          <div className="relative">
            <div className={`rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center font-bold text-orange-500 overflow-hidden shadow-lg ${borderGlow[rank]} ${rank === 1 ? 'w-24 h-24 text-3xl' : rank === 2 ? 'w-20 h-20 text-2xl' : 'w-16 h-16 text-xl'}`}>
              {player.avatar_url ? (
                <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (player.custom_name || player.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <img
              src={getMedal(rank - 1)}
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

          <div className="font-bold text-sm mt-3 text-slate-800 dark:text-white text-center w-full truncate px-2">
            {player.custom_name || `@${player.username}`}
          </div>

          <div className="text-xs font-bold text-orange-500 flex items-center justify-center gap-1 mt-1 bg-orange-50 dark:bg-slate-800/80 px-3 py-0.5 rounded-full">
            {sortBy !== 'bets_won' && (
              <img
                src="/famcscoin.png"
                alt=""
                className="w-3.5 h-3.5 object-contain"
                onError={(e) => { e.target.src = '/famcscoin.jpg'; }}
              />
            )}
            <span>{renderValue(player)}</span>
          </div>
        </motion.div>

        {/* Podium Step */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          transition={{ duration: 0.5, delay: rank * 0.15, type: 'spring' }}
          className={`w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-2xl ${heightMap[rank]} shadow-[inset_0_4px_12px_rgba(255,255,255,0.3)] flex justify-center pt-3`}
        >
          <span className="text-white/90 font-black text-3xl drop-shadow-md">#{rank}</span>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="font-sans py-12 px-5 max-w-[1000px] mx-auto w-full">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-5xl tracking-tight font-black text-slate-800 dark:text-white mb-3">
          Глобальный <span className="text-orange-500">Рейтинг</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-[600px] mx-auto">
          Список лидеров факультета по балансу коинов, пассивному доходу и успешности в тотализаторе.
        </p>
      </div>

      {/* Filter and Period Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10 bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        {/* Sort categories */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'balance', label: 'По балансу', icon: DollarSign },
            { id: 'income', label: 'По доходу', icon: TrendingUp },
            { id: 'bets_won', label: 'Угаданные ставки', icon: Trophy },
            { id: 'bets_profit', label: 'Профит со ставок', icon: Award }
          ].map(opt => {
            const Icon = opt.icon;
            const active = sortBy === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                  active
                    ? 'bg-orange-500 text-white shadow-[0_4px_14px_0_rgba(249,115,22,0.39)]'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon size={16} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Period toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              period === 'all'
                ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            За всё время
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              period === 'month'
                ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            За месяц
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-xl text-slate-400 py-24 animate-pulse font-medium">
          Загрузка рейтинга...
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="flex justify-center items-end max-w-[650px] mx-auto mb-12 px-4">
              {podiumPlayers[0] && renderPodiumItem(podiumPlayers[0], 2)}
              {podiumPlayers[1] && renderPodiumItem(podiumPlayers[1], 1)}
              {podiumPlayers[2] && renderPodiumItem(podiumPlayers[2], 3)}
            </div>
          )}

          {/* Table for remaining players */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                  <th className="p-4 w-20 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">Ранг</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Студент</th>
                  <th className="p-4 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">
                    {sortBy === 'income' ? 'Доход в час' : sortBy === 'bets_won' ? 'Угадано ставок' : sortBy === 'bets_profit' ? 'Профит со ставок' : 'Баланс'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rest?.map((item, index) => {
                  const actualRank = index + 4;
                  return (
                    <tr
                      key={item.tg_id || index}
                      className="border-b border-slate-100 dark:border-slate-700/60 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    >
                      <td className="p-4 text-center font-bold text-slate-400 text-base">
                        #{actualRank}
                      </td>
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex justify-center items-center overflow-hidden font-bold text-sm">
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (item.custom_name || item.username || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white text-sm">
                            {item.custom_name || `@${item.username}`}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-bold text-orange-500 text-sm">
                        {renderValue(item)}
                        {sortBy !== 'bets_won' && (
                          <img
                            src="/famcscoin.png"
                            alt=""
                            className="inline w-3.5 h-3.5 rounded-full -mt-1 ml-1.5 object-contain"
                            onError={(e) => { e.target.src = '/famcscoin.jpg'; }}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}

                {players.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-16 text-center text-slate-400 text-base font-medium">
                      Нет данных для отображения за выбранный период
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default WebLeaderboard;

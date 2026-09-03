import React, { useState, useEffect, useCallback } from 'react';
import { LeaderboardService } from '../../api/services/LeaderboardService';
import { Trophy, TrendingUp, Award, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '../../context/UserContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

const WebLeaderboard = () => {
  const { fetchProfile } = useUser();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('balance'); // 'balance' | 'income' | 'bets_won' | 'bets_profit'
  const [period, setPeriod] = useState('all'); // 'all' | 'month'

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await LeaderboardService.getWebLeaderboard(sortBy, period);
      setPlayers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, period]);

  const refreshLeaderboard = useCallback(() => {
    fetchLeaderboard();
    fetchProfile?.();
  }, [fetchLeaderboard, fetchProfile]);

  useAutoRefresh(refreshLeaderboard);

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
    if (sortBy === 'bets_profit') {
      const p = Math.floor(u.bets_profit || 0);
      if (p > 0) return `+${p.toLocaleString('ru-RU')}`;
      if (p < 0) return `-${Math.abs(p).toLocaleString('ru-RU')}`;
      return '0';
    }
    return Math.floor(u.balance).toLocaleString('ru-RU');
  };

  const renderPodiumItem = (player, rank) => {
    if (!player) return <div key={rank} className="w-1/3" />;
    
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
              {player.avatar_url ? (
                 <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                 (player.custom_name || player.first_name || player.username || 'U').charAt(0).toUpperCase()
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
            {player.custom_name || player.first_name || player.username || 'Студент'}
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
            {renderValue(player)}
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[720px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-xs uppercase tracking-wider">
                    <th className="p-4 w-16 text-center font-bold text-slate-500">Ранг</th>
                    <th className="p-4 font-bold text-slate-500">Студент</th>
                    {[
                      { id: 'balance', label: 'Баланс', hasCoin: true },
                      { id: 'income', label: 'Доход в час', hasCoin: true },
                      { id: 'bets_won', label: 'Угадано ставок', hasCoin: false },
                      { id: 'bets_profit', label: 'Профит со ставок', hasCoin: true },
                    ].map((m) => {
                      const isActive = sortBy === m.id;
                      return (
                        <th
                          key={m.id}
                          onClick={() => setSortBy(m.id)}
                          className={`p-4 text-right cursor-pointer select-none transition-all ${
                            isActive
                              ? 'text-orange-500 font-black bg-orange-500/10 dark:bg-orange-500/15 border-b-2 border-orange-500'
                              : 'font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                          title={`Сортировка: ${m.label}`}
                        >
                          <div className="inline-flex items-center gap-1">
                            <span>{m.label}</span>
                            {isActive && <span className="text-orange-500 text-[10px]">▼</span>}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rest?.map((item, index) => {
                    const actualRank = index + 4;

                    const formatMetric = (metricId) => {
                      switch (metricId) {
                        case 'balance':
                          return Math.floor(item.balance || 0).toLocaleString('ru-RU');
                        case 'income':
                          return `+${Math.floor(item.passive_income || 0).toLocaleString('ru-RU')}/ч`;
                        case 'bets_won':
                          return `${item.bets_won || 0} шт.`;
                        case 'bets_profit': {
                          const profit = Math.floor(item.bets_profit || 0);
                          if (profit > 0) return `+${profit.toLocaleString('ru-RU')}`;
                          if (profit < 0) return `-${Math.abs(profit).toLocaleString('ru-RU')}`;
                          return '0';
                        }
                        default:
                          return '—';
                      }
                    };

                    return (
                      <tr
                        key={item.tg_id || index}
                        className="border-b border-slate-100 dark:border-slate-700/60 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      >
                        <td className="p-4 text-center font-bold text-slate-400 text-sm">
                          #{actualRank}
                        </td>
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-500 flex justify-center items-center overflow-hidden font-bold text-xs flex-shrink-0">
                            {item.avatar_url ? (
                              <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (item.custom_name || item.first_name || item.username || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="font-bold text-slate-800 dark:text-white text-sm truncate max-w-[150px]">
                            {item.custom_name || item.first_name || item.username || 'Студент'}
                          </div>
                        </td>

                        {[
                          { id: 'balance', hasCoin: true },
                          { id: 'income', hasCoin: true },
                          { id: 'bets_won', hasCoin: false },
                          { id: 'bets_profit', hasCoin: true },
                        ].map((m) => {
                          const isActive = sortBy === m.id;
                          return (
                            <td
                              key={m.id}
                              className={`p-4 text-right text-sm whitespace-nowrap transition-all ${
                                isActive
                                  ? 'font-black text-orange-500 bg-orange-500/5 dark:bg-orange-500/10'
                                  : 'font-semibold text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <div className="inline-flex items-center justify-end gap-1">
                                <span>{formatMetric(m.id)}</span>
                                {m.hasCoin && (
                                  <img
                                    src="/famcscoin.png"
                                    alt=""
                                    className="w-3.5 h-3.5 object-contain"
                                    onError={(e) => { e.target.src = '/famcscoin.jpg'; }}
                                  />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {players.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-16 text-center text-slate-400 text-base font-medium">
                        Нет данных для отображения за выбранный период
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WebLeaderboard;

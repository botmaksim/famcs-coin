import { useState, useEffect } from 'react';
import { BetsService } from '../../api/services/BetsService';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/Skeleton';
import { TrendingUp, Clock, CheckCircle2, Trophy } from 'lucide-react';

const OPTION_COLORS = [
  {
    name: 'emerald',
    text: 'text-emerald-500 dark:text-emerald-400',
    barBg: '#10b981',
    softBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    ring: 'ring-2 ring-emerald-500 shadow-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  {
    name: 'orange',
    text: 'text-orange-500 dark:text-orange-400',
    barBg: '#f97316',
    softBg: 'bg-orange-500/10 dark:bg-orange-500/15',
    border: 'border-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    ring: 'ring-2 ring-orange-500 shadow-orange-500/10',
    dot: 'bg-orange-500',
  },
  {
    name: 'cyan',
    text: 'text-cyan-500 dark:text-cyan-400',
    barBg: '#06b6d4',
    softBg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    border: 'border-cyan-500',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300',
    ring: 'ring-2 ring-cyan-500 shadow-cyan-500/10',
    dot: 'bg-cyan-500',
  },
  {
    name: 'purple',
    text: 'text-purple-500 dark:text-purple-400',
    barBg: '#a855f7',
    softBg: 'bg-purple-500/10 dark:bg-purple-500/15',
    border: 'border-purple-500',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    ring: 'ring-2 ring-purple-500 shadow-purple-500/10',
    dot: 'bg-purple-500',
  },
  {
    name: 'amber',
    text: 'text-amber-500 dark:text-amber-400',
    barBg: '#f59e0b',
    softBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    ring: 'ring-2 ring-amber-500 shadow-amber-500/10',
    dot: 'bg-amber-500',
  },
];

const getOptionColor = (index) => {
  return OPTION_COLORS[index % OPTION_COLORS.length];
};

const formatClosesAt = (closesAtStr, status) => {
  if (!closesAtStr) return null;
  const date = new Date(closesAtStr);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const isPast = diffMs <= 0;

  const dateFormatted = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (status === 'resolved') {
    return {
      text: `Завершено (${dateFormatted})`,
      timeLeft: null,
      badge: 'Завершено',
      type: 'resolved',
      isPast: true,
    };
  }

  if (isPast || status === 'closed') {
    return {
      text: `Приём ставок закрыт (${dateFormatted})`,
      timeLeft: null,
      badge: 'Приём закрыт',
      type: 'closed',
      isPast: true,
    };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let timeLeftStr = '';
  if (diffDays > 0) {
    timeLeftStr = `${diffDays} дн. ${diffHours % 24} ч.`;
  } else if (diffHours > 0) {
    timeLeftStr = `${diffHours} ч. ${diffMins} мин.`;
  } else {
    timeLeftStr = `${Math.max(1, diffMins)} мин.`;
  }

  return {
    text: `Закрытие: ${dateFormatted}`,
    timeLeft: `Осталось: ${timeLeftStr}`,
    badge: 'Открыто',
    type: 'open',
    isPast: false,
  };
};

const Bets = () => {
  const { user, fetchProfile } = useUser();
  const { showSuccess, showError } = useToast();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected option per bet event: { [eventId]: optionIndex }
  const [selectedOptions, setSelectedOptions] = useState({});
  // Amount per bet event: { [eventId]: string }
  const [betAmounts, setBetAmounts] = useState({});

  const fetchBets = async () => {
    try {
      const res = await BetsService.getActiveBets();
      // Ensure strict deduplication by ID
      const raw = res.data || [];
      const unique = Array.from(new Map(raw.map(b => [b.id, b])).values());
      setBets(unique);

      // Pre-select already chosen option if user placed a bet
      setSelectedOptions(prev => {
        const next = { ...prev };
        unique.forEach(b => {
          const userOpt = b.user_bet_option_index ?? b.user_bet_option;
          if (userOpt !== undefined && userOpt !== null && next[b.id] === undefined) {
            next[b.id] = userOpt;
          }
        });
        return next;
      });
    } catch (e) {
      console.error("Failed to fetch bets", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, []);

  const handleSelectOption = (eventId, optionIndex) => {
    setSelectedOptions(prev => ({
      ...prev,
      [eventId]: optionIndex
    }));
  };

  const handlePlaceBet = async (eventId) => {
    const optionIndex = selectedOptions[eventId];
    if (optionIndex === undefined || optionIndex === null) {
      showError("Сначала нажмите на вариант, на который хотите поставить");
      return;
    }

    const amount = parseInt(betAmounts[eventId], 10);
    if (!amount || amount <= 0) {
      showError("Укажите корректную сумму ставки");
      return;
    }
    if (amount > (user?.balance || 0)) {
      showError("Недостаточно коинов на балансе");
      return;
    }
    
    try {
      await BetsService.placeBet(eventId, optionIndex, amount);
      showSuccess("Ставка успешно принята!");
      setBetAmounts(prev => ({ ...prev, [eventId]: "" }));
      await fetchProfile();
      await fetchBets();
    } catch (err) {
      showError(err.response?.data || "Ошибка при ставке");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full p-5 gap-4">
        <Skeleton className="w-48 h-8 mb-2" />
        <Skeleton className="w-full h-40 rounded-2xl" />
        <Skeleton className="w-full h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-5 pb-28 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white drop-shadow-sm flex items-center gap-2">
          <img src="/icon_bets.png" alt="Тотализатор" className="w-7 h-7" /> Тотализатор
        </h2>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 text-xs font-bold text-orange-500">
          <span>{Math.floor(user?.balance || 0).toLocaleString()}</span>
          <img src="/famcscoin.png" alt="coin" className="w-3.5 h-3.5 object-contain" />
        </div>
      </div>
      <p className="text-slate-500 dark:text-slate-400 mb-5 text-xs font-medium">
        Выбирай исход, ставь коины на факультетские события и забирай банк!
      </p>

      {bets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white/50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/60">
          <TrendingUp size={36} className="text-slate-300 dark:text-slate-600 mb-2" />
          <p className="font-bold text-sm text-slate-600 dark:text-slate-300">Сейчас нет активных событий</p>
          <p className="text-xs text-slate-400 mt-0.5">Скоро появятся новые события для ставок</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {bets.map(bet => {
            const totalPool = (bet.pools || []).reduce((sum, p) => sum + (Number(p) || 0), 0);
            const selectedOptIdx = selectedOptions[bet.id];
            const currentAmount = betAmounts[bet.id] || "";
            const userBetOptIdx = bet.user_bet_option_index ?? bet.user_bet_option;
            const hasUserBet = bet.user_bet_amount > 0 && userBetOptIdx !== undefined && userBetOptIdx !== null;
            
            const timeInfo = formatClosesAt(bet.closes_at, bet.status);
            const isPast = timeInfo?.isPast ?? false;
            const isOpen = bet.status === 'open' && !isPast;
            const winningOptionIdx = bet.winning_option_index ?? bet.winning_option;

            return (
              <div 
                key={bet.id} 
                className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/80 flex flex-col"
              >
                {/* Event Title & Details */}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-base text-slate-800 dark:text-white leading-snug">
                    {bet.title}
                  </h3>
                  {isOpen ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Открыто
                    </span>
                  ) : bet.status === 'resolved' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 shrink-0">
                      <CheckCircle2 size={12} />
                      Итоги подведены
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 shrink-0">
                      <Clock size={12} />
                      Приём закрыт
                    </span>
                  )}
                </div>

                {bet.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5 leading-relaxed">
                    {bet.description}
                  </p>
                )}

                {/* Prominent Closing Time & Countdown Bar */}
                {timeInfo && (
                  <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl mb-3 border ${
                    isOpen 
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                      : bet.status === 'resolved'
                      ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-900/40 text-purple-800 dark:text-purple-300'
                      : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                  }`}>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock size={13} className="shrink-0" />
                      <span>{timeInfo.text}</span>
                    </div>
                    {timeInfo.timeLeft && (
                      <span className="font-extrabold text-[11px] bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md shadow-xs">
                        {timeInfo.timeLeft}
                      </span>
                    )}
                  </div>
                )}

                {/* If resolved, show winner announcement badge */}
                {bet.status === 'resolved' && winningOptionIdx !== null && winningOptionIdx !== undefined && (
                  <div className="mb-3.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                    <Trophy size={16} className="text-amber-500 shrink-0" />
                    <span>Победивший вариант: «{bet.options?.[winningOptionIdx] || `Вариант ${winningOptionIdx + 1}`}»</span>
                  </div>
                )}

                {/* Existing User Bet Banner */}
                {hasUserBet && (
                  <div className="mb-3.5 p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getOptionColor(userBetOptIdx).dot}`} />
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        Ваша ставка: {Math.floor(bet.user_bet_amount).toLocaleString()} FC на «{bet.options?.[userBetOptIdx] || 'Выбранный вариант'}»
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-orange-200/70 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300">
                      Активна
                    </span>
                  </div>
                )}

                {/* Total Bank & Progress Bar */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Общий банк</span>
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    {Math.floor(totalPool).toLocaleString()}
                    <img src="/famcscoin.png" alt="coin" className="w-3.5 h-3.5 object-contain inline" />
                  </span>
                </div>

                {/* Multi-Segmented Full-Width Distribution Bar */}
                <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-900/80 p-0.5 gap-0.5 mb-4 shadow-inner">
                  {bet.options?.map((opt, optIdx) => {
                    const color = getOptionColor(optIdx);
                    const pool = bet.pools?.[optIdx] || 0;
                    const pct = totalPool > 0 
                      ? Math.max(4, (pool / totalPool) * 100) 
                      : (100 / (bet.options?.length || 1));

                    return (
                      <div
                        key={optIdx}
                        style={{ width: `${pct}%`, backgroundColor: color.barBg }}
                        className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 cursor-pointer hover:opacity-90"
                        onClick={() => isOpen && handleSelectOption(bet.id, optIdx)}
                        title={`${opt}: ${totalPool > 0 ? Math.round((pool / totalPool) * 100) : 0}%`}
                      />
                    );
                  })}
                </div>

                {/* Clickable Option Tiles */}
                <div className="flex flex-col gap-2.5 mb-4">
                  {bet.options?.map((opt, optIdx) => {
                    const color = getOptionColor(optIdx);
                    const pool = bet.pools?.[optIdx] || 0;
                    const pct = totalPool > 0 
                      ? Math.round((pool / totalPool) * 100) 
                      : Math.round(100 / (bet.options?.length || 1));
                    const isSelected = selectedOptIdx === optIdx;
                    const isUserChoice = hasUserBet && userBetOptIdx === optIdx;

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => isOpen && handleSelectOption(bet.id, optIdx)}
                        className={`w-full p-3 rounded-2xl border transition flex items-center justify-between text-left ${
                          isOpen ? 'cursor-pointer' : 'cursor-default'
                        } ${
                          isSelected
                            ? `${color.border} ${color.softBg} ${color.ring}`
                            : 'border-slate-200 dark:border-slate-700/70 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`w-3.5 h-3.5 rounded-full ${color.dot} shrink-0 flex items-center justify-center text-white`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className={`font-bold text-sm truncate ${
                            isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'
                          }`}>
                            {opt}
                          </span>
                          {isUserChoice && (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-orange-500 text-white shrink-0">
                              Ваш выбор
                            </span>
                          )}
                        </div>

                        {/* Pool and Percentage Badge with Option Color */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold flex items-center gap-1">
                            {Math.floor(pool).toLocaleString()}
                            <img src="/famcscoin.png" alt="coin" className="w-3 h-3 object-contain inline" />
                          </span>
                          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${color.badge}`}>
                            {pct}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Unified Betting Row (Below Options) */}
                {isOpen ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-2">
                    {/* Quick Amount Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                      <span className="text-[11px] font-semibold text-slate-400 mr-0.5 shrink-0">Ставка:</span>
                      {[100, 500, 1000, 2500].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBetAmounts(prev => ({ ...prev, [bet.id]: String(val) }))}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shrink-0 cursor-pointer"
                        >
                          {val.toLocaleString()}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setBetAmounts(prev => ({ ...prev, [bet.id]: String(Math.floor(user?.balance || 0)) }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 dark:bg-orange-950/50 hover:bg-orange-200 text-orange-600 dark:text-orange-400 transition shrink-0 cursor-pointer"
                      >
                        Все ({Math.floor(user?.balance || 0).toLocaleString()})
                      </button>
                    </div>

                    {/* Amount Input & Place Bet Button */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder={selectedOptIdx !== undefined ? "Сумма коинов" : "Сначала выберите вариант"}
                          min="1"
                          max={user?.balance || 0}
                          value={currentAmount}
                          onChange={(e) => setBetAmounts(prev => ({ ...prev, [bet.id]: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs outline-none focus:ring-2 focus:ring-orange-500 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold placeholder:font-normal placeholder:text-slate-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          FC
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlaceBet(bet.id)}
                        disabled={selectedOptIdx === undefined || !currentAmount || Number(currentAmount) <= 0 || Number(currentAmount) > (user?.balance || 0)}
                        className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                      >
                        {selectedOptIdx !== undefined
                          ? `Поставить на «${bet.options?.[selectedOptIdx]}»`
                          : "Выберите вариант"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-center text-slate-400 font-medium">
                    Приём ставок завершён
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bets;

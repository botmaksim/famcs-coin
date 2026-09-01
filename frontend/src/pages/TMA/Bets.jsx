import { useState, useEffect } from 'react';
import { BetsService } from '../../api/services/BetsService';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/Skeleton';

const Bets = () => {
  const { user, fetchProfile } = useUser();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [betAmounts, setBetAmounts] = useState({});

  const fetchBets = async () => {
    try {
      const res = await BetsService.getActiveBets();
      setBets(res.data || []);
    } catch (e) {
      console.error("Failed to fetch bets", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, []);

  const handlePlaceBet = async (eventId, option) => {
    const amount = parseInt(betAmounts[`${eventId}_${option}`]);
    if (!amount || amount <= 0 || amount > user.balance) {
      alert("Некорректная сумма ставки");
      return;
    }
    
    try {
      await BetsService.placeBet(eventId, option, amount);
      alert("Ставка принята!");
      setBetAmounts(prev => ({ ...prev, [`${eventId}_${option}`]: "" }));
      fetchProfile();
      fetchBets();
    } catch (err) {
      alert(err.response?.data || "Ошибка при ставке");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full p-5 gap-4">
        <Skeleton className="w-48 h-8 mb-2" />
        <Skeleton className="w-full h-32 rounded-2xl" />
        <Skeleton className="w-full h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-5 pb-24 overflow-y-auto">
      <h2 className="text-3xl font-black mb-1 text-slate-800 dark:text-white drop-shadow-sm flex items-center gap-2">
        <img src="/icon_bets.png" alt="Тотализатор" className="w-8 h-8" /> Тотализатор
      </h2>
      <p className="text-slate-500 mb-6 text-sm font-medium">Ставь коины на факультетские события и забирай банк!</p>

      {bets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          
          <p className="font-medium">Сейчас нет активных событий</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {bets.map(bet => (
            <div key={bet.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100 leading-tight">{bet.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{bet.description}</p>
              
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-3 px-1 uppercase tracking-wider">
                <span>Пул А: {Math.floor(bet.pool_a).toLocaleString()} <img src="/famcscoin.jpg" className="inline w-3 h-3 rounded-full" /></span>
                <span>Пул B: {Math.floor(bet.pool_b).toLocaleString()} <img src="/famcscoin.jpg" className="inline w-3 h-3 rounded-full" /></span>
              </div>

              <div className="flex flex-col gap-3">
                {/* Option A */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col gap-2">
                  <div className="font-semibold text-sm text-orange-600 dark:text-orange-400">{bet.option_a}</div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Сумма" 
                      value={betAmounts[`${bet.id}_A`] || ""}
                      onChange={(e) => setBetAmounts(prev => ({...prev, [`${bet.id}_A`]: e.target.value}))}
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <button 
                      onClick={() => handlePlaceBet(bet.id, "A")}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-4 rounded-lg text-sm shadow-md transition-colors"
                    >
                      Поставить
                    </button>
                  </div>
                </div>

                {/* Option B */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col gap-2">
                  <div className="font-semibold text-sm text-blue-600 dark:text-blue-400">{bet.option_b}</div>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Сумма" 
                      value={betAmounts[`${bet.id}_B`] || ""}
                      onChange={(e) => setBetAmounts(prev => ({...prev, [`${bet.id}_B`]: e.target.value}))}
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                      onClick={() => handlePlaceBet(bet.id, "B")}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 px-4 rounded-lg text-sm shadow-md transition-colors"
                    >
                      Поставить
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bets;

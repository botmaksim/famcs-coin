import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { toast } from 'react-hot-toast';
import { playFanfareSound } from '../../utils/audio';

export const DailyRewardModal = () => {
  const { user, updateLocalUser, soundEnabled } = useUser();
  const [show, setShow] = useState(false);
  const [day, setDay] = useState(1);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    // Check if the user has claimed today
    const lastClaim = localStorage.getItem('lastDailyClaim');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastClaim !== today) {
      // Calculate streak
      const lastClaimDate = new Date(lastClaim);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let currentDay = parseInt(localStorage.getItem('dailyStreak') || '1', 10);
      
      if (lastClaim === yesterdayStr) {
        currentDay += 1;
        if (currentDay > 7) currentDay = 1; // Reset after 7 days
      } else if (lastClaim) {
        currentDay = 1; // Broke the streak
      }
      
      setDay(currentDay);
      // Wait a bit to not conflict with the tour
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClaim = () => {
    setClaiming(true);
    setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('lastDailyClaim', today);
      localStorage.setItem('dailyStreak', day.toString());
      
      const reward = day === 7 ? 10000 : day * 100;
      updateLocalUser({ balance: user.balance + reward });
      
      playFanfareSound(soundEnabled);
      toast.success(`Ежедневный бонус получен: +${reward} коинов!`);
      setShow(false);
      setClaiming(false);
    }, 800);
  };

  if (!show) return null;

  const rewards = [
    { d: 1, val: 100 },
    { d: 2, val: 200 },
    { d: 3, val: 300 },
    { d: 4, val: 400 },
    { d: 5, val: 500 },
    { d: 6, val: 600 },
    { d: 7, val: 10000, spec: '🎁' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-5 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[var(--glass-border)] flex flex-col items-center">
        <div className="text-4xl mb-4">📅</div>
        <h2 className="text-2xl font-bold text-[var(--text-color)] text-center mb-2">Ежедневный бонус</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
          Заходи каждый день, чтобы увеличивать свою награду.
        </p>
        
        <div className="grid grid-cols-4 gap-2 mb-6 w-full">
          {rewards.slice(0, 4).map(r => (
            <div key={r.d} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${day >= r.d ? 'bg-blue-600/10 border-blue-600/30 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
              <span className="text-[10px] mb-1">День {r.d}</span>
              <span className="font-bold text-xs">{r.val}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-8 w-full">
          {rewards.slice(4, 7).map(r => (
            <div key={r.d} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${day >= r.d ? 'bg-blue-600/10 border-blue-600/30 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
              <span className="text-[10px] mb-1">День {r.d}</span>
              <span className="font-bold text-xs">{r.spec || r.val}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={handleClaim}
          disabled={claiming}
          className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-transform ${claiming ? 'bg-blue-400 scale-95' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
        >
          {claiming ? 'Получение...' : 'Забрать награду'}
        </button>
      </div>
    </div>
  );
};

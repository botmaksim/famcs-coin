import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/Skeleton';
import { Trophy, Users, Heart } from 'lucide-react';
import { LeaderboardService } from '../../api/services/LeaderboardService';
import { SquadService } from '../../api/services/SquadService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Leaderboard = () => {
  const { user, fetchProfile } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'squads' | 'tippers'
  
  const { data: usersData, isLoading: loadingUsers, error: usersError } = useQuery({
    queryKey: ['leaderboard', 'users'],
    queryFn: async () => {
      const res = await LeaderboardService.getUsers();
      return res.data.users || [];
    },
    enabled: activeTab === 'users'
  });

  const { data: squadsData, isLoading: loadingSquads, error: squadsError } = useQuery({
    queryKey: ['leaderboard', 'squads'],
    queryFn: async () => {
      const res = await SquadService.getSquads();
      return res.data.squads || [];
    },
    enabled: activeTab === 'squads'
  });

  const { data: tippersData, isLoading: loadingTippers, error: tippersError } = useQuery({
    queryKey: ['leaderboard', 'tippers'],
    queryFn: async () => {
      const res = await LeaderboardService.getTippers();
      return res.data.tippers || [];
    },
    enabled: activeTab === 'tippers'
  });

  const users = usersData || [];
  const squads = squadsData || [];
  const tippers = tippersData || [];
  
  const loading = (activeTab === 'users' && loadingUsers) || 
                  (activeTab === 'squads' && loadingSquads) || 
                  (activeTab === 'tippers' && loadingTippers);
                  
  const error = (activeTab === 'users' && usersError) || 
                (activeTab === 'squads' && squadsError) || 
                (activeTab === 'tippers' && tippersError) ? 'Не удалось загрузить рейтинг' : null;

  const joinSquadMutation = useMutation({
    mutationFn: (squadId) => SquadService.joinSquad(squadId),
    onSuccess: () => {
      toast.success('Вы успешно вступили в группу!');
      fetchProfile();
      queryClient.invalidateQueries({ queryKey: ['leaderboard', 'squads'] });
    },
    onError: () => {
      toast.error('Ошибка при вступлении в группу');
    }
  });

  const createSquadMutation = useMutation({
    mutationFn: (name) => SquadService.createSquad(name),
    onSuccess: () => {
      toast.success('Группа успешно создана!');
      fetchProfile();
      queryClient.invalidateQueries({ queryKey: ['leaderboard', 'squads'] });
    },
    onError: (err) => {
      toast.error(err.response?.data || 'Ошибка при создании группы.');
    }
  });

  const donateMutation = useMutation({
    mutationFn: (amount) => SquadService.donate(amount),
    onSuccess: () => {
      toast.success('Пожертвование успешно!');
      fetchProfile();
      queryClient.invalidateQueries({ queryKey: ['leaderboard', 'squads'] });
    },
    onError: (err) => {
      toast.error(err.response?.data || 'Ошибка при пожертвовании. Возможно, недостаточно средств.');
    }
  });

  const boostMutation = useMutation({
    mutationFn: () => SquadService.boost(),
    onSuccess: () => {
      toast.success('Буст x2 успешно активирован на 24 часа!');
      fetchProfile();
      queryClient.invalidateQueries({ queryKey: ['leaderboard', 'squads'] });
    },
    onError: (err) => {
      toast.error(err.response?.data || 'Ошибка при активации буста.');
    }
  });

  const handleJoinSquad = (squadId) => {
    joinSquadMutation.mutate(squadId);
  };

  const handleCreateSquad = () => {
    const name = prompt('Введите название новой группы (Стоимость: 50000 🪙):');
    if (!name || name.trim() === '') return;
    createSquadMutation.mutate(name.trim());
  };

  const handleDonate = (squadId) => {
    const amountStr = prompt('Сколько коинов пожертвовать в общак?');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    donateMutation.mutate(amount);
  };

  const handleBoost = (squadId) => {
    boostMutation.mutate();
  };

  const TabBtn = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold transition-colors ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
    >
      <Icon size={16} /> <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="p-5 pb-24 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Рейтинги</h2>

      {/* Tabs */}
      <div className="flex justify-center flex-wrap gap-2 mb-6">
        <TabBtn id="users" icon={Trophy} label="Студенты" />
        <TabBtn id="squads" icon={Users} label="Группы" />
        <TabBtn id="tippers" icon={Heart} label="Меценаты" />
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1,2,3,4,5].map(i => (
             <Skeleton key={i} className="h-20 rounded-xl w-full" />
          ))}
        </div>
      )}
      
      {error && <div className="text-center text-red-500 font-medium p-4 bg-red-50 rounded-xl">{error}</div>}

      {/* Users List */}
      {!loading && !error && activeTab === 'users' && (
        <div className="flex flex-col gap-3">
          {users.map((u, index) => (
            <div key={u.tg_id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-3">
                <span className={`font-bold w-6 text-center ${index < 3 ? 'text-blue-600' : 'text-slate-400'}`}>#{index + 1}</span>
                <span className="font-semibold">{u.custom_name || u.username || 'Аноним'}</span>
              </div>
              <div className="font-bold text-blue-600 flex items-center gap-1">
                {u.balance.toFixed(0)} <img src="/icons/coin.png" alt="coin" className="w-5 h-5 object-contain" />
              </div>
            </div>
          ))}
          {users.length === 0 && <div className="text-center text-slate-500 py-10">Пусто</div>}
        </div>
      )}

      {/* Tippers List */}
      {!loading && !error && activeTab === 'tippers' && (
        <div className="flex flex-col gap-3">
          {tippers.map((t, index) => (
            <div key={t.tg_id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-3">
                <span className={`font-bold w-6 text-center ${index < 3 ? 'text-pink-500' : 'text-slate-400'}`}>#{index + 1}</span>
                <span className="font-semibold">{t.custom_name || t.username || 'Аноним'}</span>
              </div>
              <div className="font-bold text-pink-500 flex items-center gap-1">
                {t.total_tips.toFixed(0)} <img src="/icons/coin.png" alt="coin" className="w-5 h-5 object-contain" />
              </div>
            </div>
          ))}
          {tippers.length === 0 && <div className="text-center text-slate-500 py-10">Пока нет меценатов</div>}
        </div>
      )}

      {/* Squads List */}
      {!loading && !error && activeTab === 'squads' && (
        <div className="flex flex-col gap-3">
          
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-xl shadow-lg mb-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20 text-6xl">⚔️</div>
            <h3 className="font-bold text-lg mb-1 relative z-10">Битва Сквадов: Сезон 1 🔥</h3>
            <p className="text-xs text-blue-100 relative z-10 mb-3">Сквад-победитель недели получит 5,000,000 коинов в общак и уникальный визуальный статус!</p>
            <div className="text-[10px] font-mono bg-black/20 inline-block px-2 py-1 rounded">Осталось: 2 дн 14 ч</div>
          </div>

          <button 
            onClick={handleCreateSquad}
            className="p-4 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold cursor-pointer transition-all hover:bg-blue-100 flex items-center justify-center gap-2"
          >
            + Создать группу (50,000 <img src="/icons/coin.png" alt="coin" className="w-5 h-5" />)
          </button>
          
          {squads.map((s, index) => (
            <div key={s.id} className={`flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 border ${index === 0 ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-slate-100 dark:border-slate-700 shadow-sm'} rounded-xl`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${index === 0 ? 'text-amber-500 text-xl drop-shadow-sm' : index < 3 ? 'text-blue-600' : 'text-slate-400'}`}>#{index + 1}</span>
                    <span className="font-bold text-lg">{s.name}</span>
                    {index === 0 && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Лидер</span>}
                  </div>
                  <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    Очки: <span className="font-semibold text-slate-700 dark:text-slate-300">{s.total_points.toFixed(0)}</span>
                  </div>
                </div>
                
                {user.squad_id !== s.id ? (
                  <button 
                    onClick={() => handleJoinSquad(s.id)}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]"
                  >
                    Вступить
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-bold rounded-md">Ваша группа</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 rounded mt-1">Роль: Участник</span>
                  </div>
                )}
              </div>
              
              {user.squad_id === s.id && (
                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Общак сквада:</span>
                    <strong className="text-slate-800 dark:text-white flex items-center gap-1">
                      {s.treasury_balance?.toFixed(0) || 0} <img src="/icons/coin.png" alt="coin" className="w-4 h-4" />
                    </strong>
                  </div>
                  
                  {s.boost_until && new Date(s.boost_until) > new Date() ? (
                    <div className="text-xs text-purple-600 bg-purple-50 px-2 py-2 rounded-md font-bold text-center border border-purple-100">
                      🔥 x2 Буст активен до {new Date(s.boost_until).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDonate(s.id)}
                        className="flex-1 py-2 rounded-md bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs transition-colors shadow-sm"
                      >
                        Пополнить общак
                      </button>
                      <button
                        onClick={() => handleBoost(s.id)}
                        disabled={(s.treasury_balance || 0) < 1000000}
                        className={`flex-1 py-2 rounded-md font-bold text-xs transition-colors shadow-sm ${
                          (s.treasury_balance || 0) >= 1000000 
                            ? 'bg-purple-600 text-white hover:bg-purple-700' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Купить Буст (1M)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {squads.length === 0 && <div className="text-center text-slate-500 py-10">Групп пока нет</div>}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

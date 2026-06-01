import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/client';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/Skeleton';

const Leaderboard = () => {
  const { user, fetchProfile } = useUser();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'squads'
  
  const [users, setUsers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'users') {
          const res = await apiClient.get('/leaderboard/users');
          setUsers(res.data.users || []);
        } else {
          const res = await apiClient.get('/squads');
          setSquads(res.data.squads || []);
        }
      } catch (err) {
        setError('Не удалось загрузить рейтинг');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const handleJoinSquad = async (squadId) => {
    try {
      await apiClient.post('/squads/join', { squad_id: squadId });
      toast.success('Вы успешно вступили в группу!');
      await fetchProfile(); // Обновляем профиль (чтобы squad_id подтянулся)
    } catch (err) {
      toast.error('Ошибка при вступлении в группу');
    }
  };

  const handleCreateSquad = async () => {
    const name = prompt('Введите название новой группы (Стоимость: 50000  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" />):');
    if (!name || name.trim() === '') return;

    try {
      await apiClient.post('/squads/create', { name: name.trim() });
      toast.success('Группа успешно создана!');
      await fetchProfile();
      // Перезагружаем список групп
      const res = await apiClient.get('/squads');
      setSquads(res.data.squads || []);
    } catch (err) {
      const msg = err.response?.data || 'Ошибка при создании группы.';
      toast.error(msg);
    }
  };

  const handleDonate = async (squadId) => {
    const amountStr = prompt('Сколько коинов пожертвовать в общак?');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await apiClient.post('/squads/donate', { amount });
      toast.success('Пожертвование успешно!');
      await fetchProfile();
      const res = await apiClient.get('/squads');
      setSquads(res.data.squads || []);
    } catch (err) {
      toast.error(err.response?.data || 'Ошибка при пожертвовании. Возможно, недостаточно средств.');
    }
  };

  const handleBoost = async (squadId) => {
    try {
      await apiClient.post('/squads/boost');
      toast.success('Буст x2 успешно активирован на 24 часа!');
      await fetchProfile();
      const res = await apiClient.get('/squads');
      setSquads(res.data.squads || []);
    } catch (err) {
      toast.error(err.response?.data || 'Ошибка при активации буста.');
    }
  };

  return (
    <div className="p-5 font-sans pb-20">
      <h2 className="text-center">Рейтинги</h2>

      {/* Tabs */}
      <div className="flex justify-center mb-5 gap-2.5">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-full font-bold cursor-pointer transition-colors border ${activeTab === 'users' ? 'border-blue-600 bg-[rgba(163,230,53,0.1)] text-blue-600' : 'border-transparent bg-transparent text-slate-800'}`}
        >
          Студенты
        </button>
        <button 
          onClick={() => setActiveTab('squads')}
          className={`px-5 py-2.5 rounded-full font-bold cursor-pointer transition-colors border ${activeTab === 'squads' ? 'border-blue-600 bg-[rgba(163,230,53,0.1)] text-blue-600' : 'border-transparent bg-transparent text-slate-800'}`}
        >
          Группы
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-2.5">
          {[1,2,3,4,5].map(i => (
             <Skeleton key={i} className="h-16 rounded-xl w-full" />
          ))}
        </div>
      )}
      {error && <div className="text-center text-red-500">{error}</div>}

      {/* Users List */}
      {!loading && !error && activeTab === 'users' && (
        <div className="flex flex-col gap-2.5">
          {users.map((u, index) => (
            <div key={u.tg_id} className="flex justify-between items-center p-4 bg-[rgba(18,18,18,0.75)] border border-[rgba(255,255,255,0.05)] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <div>
                <strong>#{index + 1}</strong> <span className="ml-2.5">{u.custom_name || u.username || 'Аноним'}</span>
              </div>
              <div className="font-bold text-slate-600">
                {u.balance.toFixed(0)}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" />
              </div>
            </div>
          ))}
          {users.length === 0 && <div className="text-center">Пусто</div>}
        </div>
      )}

      {/* Squads List */}
      {!loading && !error && activeTab === 'squads' && (
        <div className="flex flex-col gap-2.5">
          <button 
            onClick={handleCreateSquad}
            className="p-3 rounded-xl border-2 border-dashed border-blue-600 bg-transparent text-blue-600 font-bold cursor-pointer mb-2.5"
          >
            + Создать группу (50000  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" />)
          </button>
          
          {squads.map((s, index) => (
            <div key={s.id} className="flex justify-between items-center p-4 bg-[rgba(18,18,18,0.75)] border border-[rgba(255,255,255,0.05)] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <div>
                <strong>#{index + 1}</strong> <span className="ml-2.5">{s.name}</span>
                <div className="text-xs text-slate-600 mt-1">
                  Счет: {s.total_points.toFixed(0)}
                </div>
              </div>
              
              {user.squad_id !== s.id ? (
                <button 
                  onClick={() => handleJoinSquad(s.id)}
                  className="px-4 py-2 rounded-lg border-none bg-blue-600 text-white cursor-pointer font-bold"
                >
                  Вступить
                </button>
              ) : (
                <div className="flex flex-col gap-2 items-end">
                  <span className="text-green-500 font-bold text-sm">Ваша группа</span>
                  
                  <div className="text-sm text-slate-600">
                    Общак: <strong className="text-black">{s.treasury_balance?.toFixed(0) || 0}</strong>  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" />
                  </div>
                  
                  {s.boost_until && new Date(s.boost_until) > new Date() ? (
                    <div className="text-xs text-purple-400 font-bold mt-1">
                      🔥 Буст x2 активен до {new Date(s.boost_until).toLocaleTimeString()}
                    </div>
                  ) : (
                    <div className="flex gap-1.5 mt-1">
                      <button
                        onClick={() => handleDonate(s.id)}
                        className="px-3 py-1.5 rounded-md border-none bg-amber-400 text-black font-bold cursor-pointer text-xs"
                      >
                        Скинуть
                      </button>
                      <button
                        onClick={() => handleBoost(s.id)}
                        disabled={(s.treasury_balance || 0) < 1000000}
                        className={`px-3 py-1.5 rounded-md border-none font-bold text-xs ${
                          (s.treasury_balance || 0) >= 1000000 
                            ? 'bg-blue-600 text-white cursor-pointer shadow-[0_0_10px_rgba(163,230,53,0.3)]' 
                            : 'bg-slate-100 text-black cursor-not-allowed hidden-shadow opacity-50'
                        }`}
                      >
                        x2 Буст (1M)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {squads.length === 0 && <div className="text-center">Групп пока нет</div>}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useUser } from '../../context/UserContext';

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
      alert('Вы успешно вступили в группу!');
      await fetchProfile(); // Обновляем профиль (чтобы squad_id подтянулся)
    } catch (err) {
      alert('Ошибка при вступлении в группу');
    }
  };

  const handleCreateSquad = async () => {
    const name = prompt('Введите название новой группы (Стоимость: 50000 🪙):');
    if (!name || name.trim() === '') return;

    try {
      await apiClient.post('/squads/create', { name: name.trim() });
      alert('Группа успешно создана!');
      await fetchProfile();
      // Перезагружаем список групп
      const res = await apiClient.get('/squads');
      setSquads(res.data.squads || []);
    } catch (err) {
      const msg = err.response?.data || 'Ошибка при создании группы. Возможно, недостаточно средств или имя занято.';
      alert(msg);
    }
  };

  const handleDonate = async (squadId) => {
    const amountStr = prompt('Сколько коинов пожертвовать в общак?');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await apiClient.post('/squads/donate', { amount });
      alert('Пожертвование успешно!');
      await fetchProfile();
      const res = await apiClient.get('/squads');
      setSquads(res.data.squads || []);
    } catch (err) {
      alert(err.response?.data || 'Ошибка при пожертвовании. Возможно, недостаточно средств.');
    }
  };

  const handleBoost = async (squadId) => {
    try {
      await apiClient.post('/squads/boost');
      alert('Буст x2 успешно активирован на 24 часа!');
      await fetchProfile();
      const res = await apiClient.get('/squads');
      setSquads(res.data.squads || []);
    } catch (err) {
      alert(err.response?.data || 'Ошибка при активации буста.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', paddingBottom: '80px' }}>
      <h2 style={{ textAlign: 'center' }}>Рейтинги</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '20px',
            backgroundColor: activeTab === 'users' ? 'var(--tg-theme-button-color, #2481cc)' : 'transparent',
            color: activeTab === 'users' ? 'var(--tg-theme-button-text-color, #fff)' : 'var(--tg-theme-text-color, #000)',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Студенты
        </button>
        <button 
          onClick={() => setActiveTab('squads')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '20px',
            backgroundColor: activeTab === 'squads' ? 'var(--tg-theme-button-color, #2481cc)' : 'transparent',
            color: activeTab === 'squads' ? 'var(--tg-theme-button-text-color, #fff)' : 'var(--tg-theme-text-color, #000)',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Группы
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center' }}>Загрузка...</div>}
      {error && <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>}

      {/* Users List */}
      {!loading && !error && activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map((u, index) => (
            <div key={u.tg_id} style={{
              display: 'flex', justifyContent: 'space-between', padding: '15px', 
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              borderRadius: '10px',
              alignItems: 'center'
            }}>
              <div>
                <strong>#{index + 1}</strong> <span style={{marginLeft: '10px'}}>{u.custom_name || u.username || 'Аноним'}</span>
              </div>
              <div style={{ fontWeight: 'bold', color: 'var(--tg-theme-hint-color, #999)' }}>
                {u.balance.toFixed(0)} 🪙
              </div>
            </div>
          ))}
          {users.length === 0 && <div style={{ textAlign: 'center' }}>Пусто</div>}
        </div>
      )}

      {/* Squads List */}
      {!loading && !error && activeTab === 'squads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={handleCreateSquad}
            style={{
              padding: '12px',
              borderRadius: '10px',
              border: '2px dashed var(--tg-theme-button-color, #2481cc)',
              backgroundColor: 'transparent',
              color: 'var(--tg-theme-button-color, #2481cc)',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            + Создать группу (50000 🪙)
          </button>
          
          {squads.map((s, index) => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', padding: '15px', 
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              borderRadius: '10px',
              alignItems: 'center'
            }}>
              <div>
                <strong>#{index + 1}</strong> <span style={{marginLeft: '10px'}}>{s.name}</span>
                <div style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color, #999)', marginTop: '4px' }}>
                  Счет: {s.total_points.toFixed(0)}
                </div>
              </div>
              
              {user.squad_id !== s.id ? (
                <button 
                  onClick={() => handleJoinSquad(s.id)}
                  style={{
                    padding: '8px 15px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
                    color: 'var(--tg-theme-button-text-color, #fff)',
                    cursor: 'pointer'
                  }}
                >
                  Вступить
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Ваша группа</span>
                  
                  <div style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color, #999)' }}>
                    Общак: <strong>{s.treasury_balance?.toFixed(0) || 0}</strong> 🪙
                  </div>
                  
                  {s.boost_until && new Date(s.boost_until) > new Date() ? (
                    <div style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: 'bold' }}>
                      🔥 Буст x2 активен до {new Date(s.boost_until).toLocaleTimeString()}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                      <button
                        onClick={() => handleDonate(s.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#fbbf24',
                          color: '#fff',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Скинуть
                      </button>
                      <button
                        onClick={() => handleBoost(s.id)}
                        disabled={(s.treasury_balance || 0) < 1000000}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: (s.treasury_balance || 0) >= 1000000 ? '#8b5cf6' : '#ccc',
                          color: '#fff',
                          fontWeight: 'bold',
                          cursor: (s.treasury_balance || 0) >= 1000000 ? 'pointer' : 'not-allowed',
                          fontSize: '12px'
                        }}
                      >
                        x2 Буст (1M)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {squads.length === 0 && <div style={{ textAlign: 'center' }}>Групп пока нет</div>}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

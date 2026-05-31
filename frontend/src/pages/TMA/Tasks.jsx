import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import apiClient from '../../api/client';

const Tasks = () => {
  const { user, fetchProfile } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/tasks');
      setTasks(res.data.tasks || []);
    } catch (err) {
      setError('Не удалось загрузить задания');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleClaim = async (task) => {
    if (task.is_completed) return;

    // Open Telegram link or normal link
    if (window.Telegram?.WebApp?.openTelegramLink && task.link_url.includes('t.me')) {
      window.Telegram.WebApp.openTelegramLink(task.link_url);
    } else {
      window.open(task.link_url, '_blank');
    }

    // Small delay to simulate user looking at the group before claiming
    setTimeout(async () => {
      try {
        await apiClient.post('/tasks/claim', { task_id: task.id });
        await fetchProfile(); // Update balance in context
        await fetchTasks(); // Update tasks list to show completed status
      } catch (err) {
        console.error('Claim error:', err);
        // Might fail if already completed via race condition
        const msg = err.response?.data || 'Не удалось получить награду';
        if (err.response?.status !== 409) {
          alert(msg);
        }
      }
    }, 2000);
  };

  const handleCopyReferral = () => {
    const refLink = "https://t.me/famcs_coin_bot?startapp=ref_" + user?.tg_id;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '90px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Задания (Earn)</h2>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '30px', fontSize: '14px' }}>
        Выполняй простые квесты и получай монеты!
      </p>

      {/* Referral Block */}
      <div style={{
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#4ade80' }}>🎁 Пригласи друга</h3>
        <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#cbd5e1' }}>
          Получи 50,000 🪙 за каждого друга!
        </p>
        <button
          onClick={handleCopyReferral}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: copied ? '#4ade80' : 'var(--accent-color)',
            color: copied ? '#0f172a' : '#ffffff',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {copied ? 'Скопировано! ✅' : 'Скопировать ссылку'}
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center' }}>Загрузка...</div>}
      {error && <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {tasks.map((task) => (
            <div key={task.id} style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{task.title}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>{task.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleClaim(task)}
                disabled={task.is_completed}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: task.is_completed ? '#334155' : 'var(--accent-color)',
                  color: task.is_completed ? '#94a3b8' : '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: task.is_completed ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {task.is_completed ? 'Выполнено' : `Выполнить (+${task.reward_coins.toLocaleString()} 🪙)`}
              </button>
            </div>
          ))}
          {tasks.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8' }}>Заданий пока нет</div>}
        </div>
      )}
    </div>
  );
};

export default Tasks;

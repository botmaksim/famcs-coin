import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [tgId, setTgId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error'

  useEffect(() => {
    if (!token) {
      setStatus('error');
    }
  }, [token]);

  const handleAccept = async (e) => {
    e.preventDefault();
    if (!tgId || !token) return;

    setLoading(true);
    try {
      const res = await apiClient.post('/admin/accept_invite', {
        token: token,
        tg_id: parseInt(tgId)
      });
      if (res.data.success) {
        setStatus('success');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: 'var(--accent-color)', textShadow: '0 0 15px rgba(163, 230, 53, 0.5)' }}>✅ Приглашение принято!</h2>
        <p>Ваша роль была успешно обновлена.</p>
        <button onClick={() => navigate('/admin-panel')} style={{
          marginTop: '20px', padding: '12px 24px', borderRadius: '8px', border: 'none',
          backgroundColor: 'var(--accent-color)', color: '#000', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 15px rgba(163, 230, 53, 0.3)'
        }}>
          Перейти в Панель управления
        </button>
      </div>
    );
  }

  if (status === 'error' && !token) {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#ef4444' }}>❌ Неверная ссылка</h2>
        <p>Отсутствует токен приглашения.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '50px 20px', minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Принять приглашение персонала</h2>
      <p style={{ opacity: 0.8, maxWidth: '400px', textAlign: 'center', marginBottom: '30px' }}>
        Для получения прав модератора или суперадмина введите ваш Telegram ID. 
        Узнать свой ID можно через бота @userinfobot.
      </p>

      {status === 'error' && (
        <div style={{ padding: '15px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px', maxWidth: '300px', width: '100%', textAlign: 'center' }}>
          Ошибка! Возможно, ссылка уже использована или недействительна.
        </div>
      )}

      <form onSubmit={handleAccept} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', width: '100%' }}>
        <input
          type="number"
          placeholder="Ваш Telegram ID"
          value={tgId}
          onChange={(e) => setTgId(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '16px' }}
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '12px', borderRadius: '8px', border: 'none',
            backgroundColor: 'var(--accent-color)', color: '#000',
            fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, fontSize: '16px', boxShadow: '0 0 15px rgba(163, 230, 53, 0.3)'
          }}
        >
          {loading ? 'Обработка...' : 'Подтвердить'}
        </button>
      </form>
    </div>
  );
};

export default AcceptInvite;

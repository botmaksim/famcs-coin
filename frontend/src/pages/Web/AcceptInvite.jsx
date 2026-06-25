import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AdminService } from '../../api/services/AdminService';

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
      const res = await AdminService.acceptInvite(token, tgId);
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
      <div className="py-[50px] px-5 text-center min-h-[50vh] flex flex-col items-center justify-center font-sans">
        <h2 className="text-blue-600 dark:text-blue-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]">✅ Приглашение принято!</h2>
        <p className="text-[var(--text-color)]">Ваша роль была успешно обновлена.</p>
        <button 
          onClick={() => navigate('/admin-panel')} 
          className="mt-5 px-6 py-3 rounded-lg border-none bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-700 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-colors"
        >
          Перейти в Панель управления
        </button>
      </div>
    );
  }

  if (status === 'error' && !token) {
    return (
      <div className="py-[50px] px-5 text-center min-h-[50vh] flex flex-col items-center justify-center font-sans">
        <h2 className="text-red-500">❌ Неверная ссылка</h2>
        <p className="text-[var(--text-color)]">Отсутствует токен приглашения.</p>
      </div>
    );
  }

  return (
    <div className="py-[50px] px-5 min-h-[50vh] font-sans flex flex-col items-center justify-center text-[var(--text-color)]">
      <h2>Принять приглашение персонала</h2>
      <p className="opacity-80 max-w-[400px] text-center mb-[30px] text-slate-600 dark:text-slate-400">
        Для получения прав модератора или суперадмина введите ваш Telegram ID. 
        Узнать свой ID можно через бота @userinfobot.
      </p>

      {status === 'error' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-5 max-w-[300px] w-full text-center border border-red-200 dark:border-red-900/50">
          Ошибка! Возможно, ссылка уже использована или недействительна.
        </div>
      )}

      <form onSubmit={handleAccept} className="flex flex-col gap-4 max-w-[300px] w-full">
        <input
          type="number"
          placeholder="Ваш Telegram ID"
          value={tgId}
          onChange={(e) => setTgId(e.target.value)}
          className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] text-base outline-none focus:border-blue-600"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className={`p-3 rounded-lg border-none font-bold text-base transition-colors ${loading ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-not-allowed opacity-70' : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]'}`}
        >
          {loading ? 'Обработка...' : 'Подтвердить'}
        </button>
      </form>
    </div>
  );
};

export default AcceptInvite;

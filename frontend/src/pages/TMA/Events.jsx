import { useState, useEffect, useRef } from 'react';
import { useUser } from '../../context/UserContext';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';
import { Skeleton } from '../../components/Skeleton';

const Events = () => {
  const { user, fetchProfile } = useUser();
  const [quiz, setQuiz] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // State for placing bets (Event ID -> { option: 'A', amount: 100 })
  const [betForms, setBetForms] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    fetchData();
    setupWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const setupWebSocket = () => {
    const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8083/api')
                  .replace(/^http/, 'ws') + '/ws';
    
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'bet_placed') {
          // Increment pool dynamically
          setBets(prev => prev.map(b => {
            if (b.id === data.payload.event_id) {
               return {
                 ...b,
                 pool_a: data.payload.option === 'A' ? b.pool_a + data.payload.amount : b.pool_a,
                 pool_b: data.payload.option === 'B' ? b.pool_b + data.payload.amount : b.pool_b
               };
            }
            return b;
          }));
        } else if (data.type === 'bet_resolved') {
          setBets(prev => prev.map(b => {
             if (b.id === data.payload.event_id) {
               return {
                 ...b,
                 status: 'resolved',
                 winning_option: data.payload.winning_option
               };
             }
             return b;
          }));
        }
      } catch(err) {
        console.error('WS Error:', err);
      }
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quizRes, betsRes] = await Promise.all([
        apiClient.get('/quiz/today').catch(() => ({ data: { quiz: null } })),
        apiClient.get('/bets/active').catch(() => ({ data: { events: [] } }))
      ]);
      setQuiz(quizRes.data.quiz);
      setBets(betsRes.data.events || []);
    } catch (err) {
      setError('Не удалось загрузить события');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await apiClient.post('/quiz/submit', { answer: answer.trim() });
      if (res.data.is_correct) {
        toast.success('Верно! Награда начислена.');
      } else {
        toast.error('Неверный ответ.');
      }
      await fetchProfile(); // Обновляем баланс
      await fetchData();    // Обновляем состояние квиза (has_attempted)
    } catch (err) {
      toast.error(err.response?.data || 'Ошибка при отправке');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceBet = async (eventId, option, amount) => {
    if (!option || amount <= 0) return;
    try {
      await apiClient.post('/bets/place', {
        event_id: eventId,
        chosen_option: option,
        amount: parseInt(amount)
      });
      toast.success('Ставка успешно принята!');
      await fetchProfile();
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data || 'Ошибка при размещении ставки');
    }
  };

  if (loading) return (
    <div className="p-5 pb-[90px] font-sans">
      <Skeleton className="w-1/2 h-8 mx-auto mb-2.5 mt-0" />
      <Skeleton className="w-1/3 h-4 mx-auto mb-[30px]" />
      <Skeleton className="w-full h-48 rounded-2xl mb-10" />
      <Skeleton className="w-1/2 h-6 mx-auto mb-5" />
      <div className="flex flex-col gap-5">
         <Skeleton className="w-full h-64 rounded-2xl" />
      </div>
    </div>
  );
  
  if (error) return <div className="text-center pt-12 text-red-500">{error}</div>;

  return (
    <div className="p-5 pb-[90px] font-sans">
      <h2 className="text-center mb-2.5 mt-0">События</h2>
      <p className="text-center text-slate-600 mb-[30px] text-sm">
        Дейли Викторина
      </p>

      {!quiz ? (
        <div className="text-center text-slate-600">На сегодня задач нет. Возвращайтесь завтра!</div>
      ) : (
        <div className="bg-[rgba(18,18,18,0.75)] rounded-2xl p-5 border border-[rgba(255,255,255,0.05)] backdrop-blur-md shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="m-0 text-lg text-blue-600">Задача дня</h3>
            <span className="text-sm font-bold text-amber-400">
              +{quiz.reward.toLocaleString()}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" />
            </span>
          </div>
          
          <div className="bg-slate-100 p-4 rounded-xl mb-5 text-[15px] leading-relaxed">
            {quiz.question}
          </div>

          {quiz.has_attempted ? (
            <div className={`text-center p-4 rounded-xl border ${quiz.is_correct ? 'bg-[rgba(34,197,94,0.2)] border-green-500' : 'bg-[rgba(239,68,68,0.2)] border-red-500'}`}>
              <div className={`font-bold mb-1.5 ${quiz.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                {quiz.is_correct ? 'Вы ответили верно! 🎉' : 'Ответ неверный 😢'}
              </div>
              <div className="text-[13px] text-slate-700">
                Вы уже использовали попытку сегодня. Возвращайтесь завтра!
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Ваш ответ (число)"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full p-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[#121212] text-black text-base outline-none focus:border-blue-600"
                required
              />
              <button
                type="submit"
                disabled={submitting || !answer.trim()}
                className={`w-full p-4 rounded-xl border-none font-bold text-[15px] transition-all
                  ${(submitting || !answer.trim()) ? 'bg-slate-100 text-slate-600 cursor-not-allowed hidden-shadow opacity-70' : 'bg-blue-600 text-white cursor-pointer shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]'}
                `}
              >
                {submitting ? 'Отправка...' : 'Отправить (Только 1 попытка!)'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Bets Section */}
      <div className="mt-10">
        <h3 className="text-center mb-5 text-blue-600">Тотализатор</h3>
        {bets.length === 0 ? (
          <div className="text-center text-slate-600">Нет активных событий для ставок.</div>
        ) : (
          <div className="flex flex-col gap-5">
            {bets.map(bet => {
              const totalPool = bet.pool_a + bet.pool_b;
              const coefA = bet.pool_a > 0 ? ((totalPool) / bet.pool_a).toFixed(2) : '2.00';
              const coefB = bet.pool_b > 0 ? ((totalPool) / bet.pool_b).toFixed(2) : '2.00';
              
              const formState = betForms[bet.id] || { option: 'A', amount: 1000 };
              
              const updateForm = (updates) => {
                setBetForms({ ...betForms, [bet.id]: { ...formState, ...updates } });
              };

              return (
                <div key={bet.id} className="bg-[rgba(18,18,18,0.75)] rounded-2xl p-5 border border-[rgba(255,255,255,0.05)] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
                  <h4 className="m-0 mb-4 text-base text-center">{bet.title}</h4>
                  
                  {/* Options & Coefficients */}
                  <div className="flex justify-between gap-2.5 mb-4">
                    <div 
                      onClick={() => bet.status === 'open' && !bet.user_bet_option && updateForm({ option: 'A' })}
                      className={`flex-1 p-2.5 rounded-xl text-center border transition-colors
                        ${(bet.status === 'open' && !bet.user_bet_option) ? 'cursor-pointer' : 'cursor-default'}
                        ${formState.option === 'A' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-black hover:bg-[rgba(0,0,0,0.3)] border-[rgba(255,255,255,0.05)]'}
                      `}
                    >
                      <div className="text-sm font-bold">{bet.option_a_name}</div>
                      <div className="text-xs opacity-80 mt-1">Кэф: {coefA}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">Пул: {bet.pool_a}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" /></div>
                    </div>
                    
                    <div 
                      onClick={() => bet.status === 'open' && !bet.user_bet_option && updateForm({ option: 'B' })}
                      className={`flex-1 p-2.5 rounded-xl text-center border transition-colors
                        ${(bet.status === 'open' && !bet.user_bet_option) ? 'cursor-pointer' : 'cursor-default'}
                        ${formState.option === 'B' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-black hover:bg-[rgba(0,0,0,0.3)] border-[rgba(255,255,255,0.05)]'}
                      `}
                    >
                      <div className="text-sm font-bold">{bet.option_b_name}</div>
                      <div className="text-xs opacity-80 mt-1">Кэф: {coefB}</div>
                      <div className="text-[10px] opacity-60 mt-0.5">Пул: {bet.pool_b}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" /></div>
                    </div>
                  </div>

                  {bet.status === 'open' && !bet.user_bet_option ? (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Ставка: {formState.amount}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" /></span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max={Math.max(10, user.balance)} 
                        step="10" 
                        value={formState.amount}
                        className="w-full accent-lime-400"
                        onChange={(e) => updateForm({ amount: parseInt(e.target.value) })}
                      />
                      <button 
                        onClick={() => handlePlaceBet(bet.id, formState.option, formState.amount)}
                        className="w-full p-3 rounded-xl border-none bg-blue-600 text-white font-bold cursor-pointer transition-colors hover:bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] mt-2"
                      >
                        Сделать ставку
                      </button>
                    </div>
                  ) : bet.user_bet_option ? (
                    <div className="text-center p-3 bg-[rgba(34,197,94,0.1)] rounded-xl text-green-400 border border-[rgba(34,197,94,0.2)] mt-2">
                      Вы поставили <strong>{bet.user_bet_amount}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" /></strong> на <strong>{bet.user_bet_option === 'A' ? bet.option_a_name : bet.option_b_name}</strong>
                      {bet.status === 'closed' && (
                        <div className={`mt-2.5 font-bold ${bet.winning_option === bet.user_bet_option ? 'text-amber-400' : 'text-red-500'}`}>
                          {bet.winning_option === bet.user_bet_option ? 'Вы победили!' : 'Ставка проиграла'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-slate-600 p-2 mt-2">
                       Событие завершено. Победитель: {bet.winning_option === 'A' ? bet.option_a_name : (bet.winning_option === 'B' ? bet.option_b_name : 'Отменено')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;

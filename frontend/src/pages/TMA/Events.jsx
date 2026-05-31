import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import apiClient from '../../api/client';

const Events = () => {
  const { fetchProfile } = useUser();
  const [quiz, setQuiz] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // State for placing bets (Event ID -> { option: 'A', amount: 100 })
  const [betForms, setBetForms] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

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
        alert('Верно! Награда начислена.');
      } else {
        alert('Неверный ответ.');
      }
      await fetchProfile(); // Обновляем баланс
      await fetchData();    // Обновляем состояние квиза (has_attempted)
    } catch (err) {
      alert(err.response?.data || 'Ошибка при отправке');
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
      alert('Ставка успешно принята!');
      await fetchProfile();
      await fetchData();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при размещении ставки');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', paddingTop: '50px' }}>Загрузка...</div>;
  if (error) return <div style={{ textAlign: 'center', paddingTop: '50px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '90px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>События</h2>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '30px', fontSize: '14px' }}>
        Дейли Викторина
      </p>

      {!quiz ? (
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>На сегодня задач нет. Возвращайтесь завтра!</div>
      ) : (
        <div style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--accent-color)' }}>Задача дня</h3>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fbbf24' }}>
              +{quiz.reward.toLocaleString()} 🪙
            </span>
          </div>
          
          <div style={{ 
            backgroundColor: 'rgba(0,0,0,0.2)', 
            padding: '15px', 
            borderRadius: '10px', 
            marginBottom: '20px',
            fontSize: '15px',
            lineHeight: '1.5'
          }}>
            {quiz.question}
          </div>

          {quiz.has_attempted ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '15px', 
              borderRadius: '10px',
              backgroundColor: quiz.is_correct ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${quiz.is_correct ? '#22c55e' : '#ef4444'}`
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: quiz.is_correct ? '#4ade80' : '#f87171' }}>
                {quiz.is_correct ? 'Вы ответили верно! 🎉' : 'Ответ неверный 😢'}
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                Вы уже использовали попытку сегодня. Возвращайтесь завтра!
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                placeholder="Ваш ответ (число)"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'var(--secondary-bg)',
                  color: 'white',
                  fontSize: '16px'
                }}
                required
              />
              <button
                type="submit"
                disabled={submitting || !answer.trim()}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: (submitting || !answer.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (submitting || !answer.trim()) ? 0.7 : 1,
                  transition: '0.2s'
                }}
              >
                {submitting ? 'Отправка...' : 'Отправить (Только 1 попытка!)'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Bets Section */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--accent-color)' }}>Тотализатор</h3>
        {bets.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>Нет активных событий для ставок.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {bets.map(bet => {
              const totalPool = bet.pool_a + bet.pool_b;
              const coefA = bet.pool_a > 0 ? ((totalPool) / bet.pool_a).toFixed(2) : '2.00';
              const coefB = bet.pool_b > 0 ? ((totalPool) / bet.pool_b).toFixed(2) : '2.00';
              
              const formState = betForms[bet.id] || { option: 'A', amount: 1000 };
              
              const updateForm = (updates) => {
                setBetForms({ ...betForms, [bet.id]: { ...formState, ...updates } });
              };

              return (
                <div key={bet.id} style={{
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'center' }}>{bet.title}</h4>
                  
                  {/* Options & Coefficients */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '15px' }}>
                    <div 
                      onClick={() => bet.status === 'open' && !bet.user_bet_option && updateForm({ option: 'A' })}
                      style={{ 
                        flex: 1, padding: '10px', borderRadius: '10px', textAlign: 'center',
                        backgroundColor: formState.option === 'A' ? 'var(--accent-color)' : 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glass-border)',
                        cursor: (bet.status === 'open' && !bet.user_bet_option) ? 'pointer' : 'default',
                        color: formState.option === 'A' ? '#fff' : 'inherit'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{bet.option_a_name}</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>Кэф: {coefA}</div>
                      <div style={{ fontSize: '10px', opacity: 0.6 }}>Пул: {bet.pool_a} 🪙</div>
                    </div>
                    
                    <div 
                      onClick={() => bet.status === 'open' && !bet.user_bet_option && updateForm({ option: 'B' })}
                      style={{ 
                        flex: 1, padding: '10px', borderRadius: '10px', textAlign: 'center',
                        backgroundColor: formState.option === 'B' ? 'var(--accent-color)' : 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glass-border)',
                        cursor: (bet.status === 'open' && !bet.user_bet_option) ? 'pointer' : 'default',
                        color: formState.option === 'B' ? '#fff' : 'inherit'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{bet.option_b_name}</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>Кэф: {coefB}</div>
                      <div style={{ fontSize: '10px', opacity: 0.6 }}>Пул: {bet.pool_b} 🪙</div>
                    </div>
                  </div>

                  {bet.status === 'open' && !bet.user_bet_option ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                        <span>Ставка: {formState.amount} 🪙</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max={Math.max(10, user.balance)} 
                        step="10" 
                        value={formState.amount}
                        onChange={(e) => updateForm({ amount: parseInt(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                      <button 
                        onClick={() => handlePlaceBet(bet.id, formState.option, formState.amount)}
                        style={{
                          width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                          backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
                        }}
                      >
                        Сделать ставку
                      </button>
                    </div>
                  ) : bet.user_bet_option ? (
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px', color: '#4ade80' }}>
                      Вы поставили <strong>{bet.user_bet_amount} 🪙</strong> на <strong>{bet.user_bet_option === 'A' ? bet.option_a_name : bet.option_b_name}</strong>
                      {bet.status === 'closed' && (
                        <div style={{ marginTop: '10px', color: bet.winning_option === bet.user_bet_option ? '#fbbf24' : '#ef4444' }}>
                          {bet.winning_option === bet.user_bet_option ? 'Вы победили!' : 'Ставка проиграла'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
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

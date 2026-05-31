import { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const DAO = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/dao/proposals');
      setProposals(res.data.proposals || []);
    } catch (err) {
      setError('Не удалось загрузить голосования');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleVote = async (proposalId, voteType) => {
    try {
      await apiClient.post('/dao/vote', { proposal_id: proposalId, vote_type: voteType });
      // Обновляем список, чтобы отобразить наш голос и новые циферки
      await fetchProposals();
    } catch (err) {
      const msg = err.response?.data || 'Ошибка при голосовании';
      alert(msg);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', paddingBottom: '80px' }}>
      <h2 style={{ textAlign: 'center' }}>DAO Голосования</h2>
      <p style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color, #999)', marginBottom: '20px' }}>
        Влияй на развитие университета! Каждый голос имеет значение.
      </p>

      {loading && <div style={{ textAlign: 'center' }}>Загрузка...</div>}
      {error && <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {proposals.map(p => {
            const hasVoted = p.user_vote && p.user_vote !== "";
            const isUp = p.user_vote === 'up';
            const isDown = p.user_vote === 'down';

            return (
              <div key={p.id} style={{
                padding: '20px',
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                borderRadius: '12px'
              }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px' }}>{p.title}</h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px', lineHeight: '1.4' }}>{p.description}</p>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    disabled={hasVoted}
                    onClick={() => handleVote(p.id, 'up')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isUp ? 'var(--tg-theme-button-color, #2481cc)' : (hasVoted ? '#ccc' : '#e0e0e0'),
                      color: isUp ? 'var(--tg-theme-button-text-color, #fff)' : '#333',
                      fontWeight: 'bold',
                      cursor: hasVoted ? 'default' : 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    👍 <span>{p.votes_up}</span>
                  </button>
                  <button
                    disabled={hasVoted}
                    onClick={() => handleVote(p.id, 'down')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isDown ? 'tomato' : (hasVoted ? '#ccc' : '#e0e0e0'),
                      color: isDown ? '#fff' : '#333',
                      fontWeight: 'bold',
                      cursor: hasVoted ? 'default' : 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    👎 <span>{p.votes_down}</span>
                  </button>
                </div>
              </div>
            );
          })}
          {proposals.length === 0 && <div style={{ textAlign: 'center' }}>Активных голосований нет</div>}
        </div>
      )}
    </div>
  );
};

export default DAO;

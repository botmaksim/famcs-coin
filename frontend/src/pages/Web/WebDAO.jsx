import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Link } from 'react-router-dom';
import TelegramLoginWidget from '../../components/TelegramLoginWidget';

const WebDAO = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('web_user_token');
    if (token) {
      setIsAuthenticated(true);
      fetchProposals();
    }
  }, []);

  const handleAuth = () => {
    setIsAuthenticated(true);
    fetchProposals();
  };

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

  const handleVote = async (proposalId, voteType) => {
    try {
      await apiClient.post('/dao/vote', { proposal_id: proposalId, vote_type: voteType });
      await fetchProposals();
    } catch (err) {
      const msg = err.response?.data || 'Ошибка при голосовании';
      alert(msg);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', flex: 1, width: '100%' }}>
        <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '20px', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>DAO Голосования</h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '40px', fontSize: '20px' }}>
          Влияй на развитие университета! Каждый голос имеет значение.
        </p>

        {!isAuthenticated ? (
          <div style={{ maxWidth: '400px', margin: '0 auto', marginTop: '60px' }}>
            <TelegramLoginWidget onAuth={handleAuth} />
          </div>
        ) : (
          <>
            {loading && <div style={{ textAlign: 'center', fontSize: '20px', color: '#94a3b8' }}>Загрузка...</div>}
            {error && <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '18px' }}>{error}</div>}

            {!loading && !error && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '30px' }}>
                {proposals.map(p => {
                  const hasVoted = p.user_vote && p.user_vote !== "";
                  const isUp = p.user_vote === 'up';
                  const isDown = p.user_vote === 'down';

                  return (
                    <div key={p.id} style={{
                      padding: '30px',
                      backgroundColor: 'var(--card-bg)',
                      borderRadius: '16px',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '24px', color: 'var(--text-color)' }}>{p.title}</h3>
                      <p style={{ margin: '0 0 25px 0', fontSize: '16px', lineHeight: '1.6', color: '#cbd5e1', flex: 1 }}>{p.description}</p>
                      
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <button
                          disabled={hasVoted}
                          onClick={() => handleVote(p.id, 'up')}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: isUp ? 'var(--accent-color)' : (hasVoted ? 'rgba(255,255,255,0.1)' : 'var(--secondary-bg)'),
                            color: isUp ? '#fff' : (hasVoted ? '#64748b' : 'var(--text-color)'),
                            fontWeight: 'bold',
                            fontSize: '18px',
                            cursor: hasVoted ? 'default' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: isUp ? '0 5px 15px rgba(59, 130, 246, 0.4)' : 'none'
                          }}
                        >
                          👍 <span>{p.votes_up}</span>
                        </button>
                        <button
                          disabled={hasVoted}
                          onClick={() => handleVote(p.id, 'down')}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            border: 'none',
                            backgroundColor: isDown ? '#ef4444' : (hasVoted ? 'rgba(255,255,255,0.1)' : 'var(--secondary-bg)'),
                            color: isDown ? '#fff' : (hasVoted ? '#64748b' : 'var(--text-color)'),
                            fontWeight: 'bold',
                            fontSize: '18px',
                            cursor: hasVoted ? 'default' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: isDown ? '0 5px 15px rgba(239, 68, 68, 0.4)' : 'none'
                          }}
                        >
                          👎 <span>{p.votes_down}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {proposals.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '20px', color: '#94a3b8', padding: '40px' }}>Активных голосований нет</div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WebDAO;

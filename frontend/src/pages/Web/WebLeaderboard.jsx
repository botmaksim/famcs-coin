import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Link } from 'react-router-dom';

const WebLeaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [activeTab, setActiveTab] = useState('players');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [playersRes, squadsRes] = await Promise.all([
          apiClient.get('/web/leaderboard/players'),
          apiClient.get('/web/leaderboard/squads')
        ]);
        setPlayers(playersRes.data || []);
        setSquads(squadsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch leaderboards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color)' }}>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '40px', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>Глобальные Рейтинги</h1>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
          <button
            onClick={() => setActiveTab('players')}
            style={{
              padding: '12px 30px',
              borderRadius: '30px',
              border: 'none',
              backgroundColor: activeTab === 'players' ? 'var(--accent-color)' : 'var(--secondary-bg)',
              color: activeTab === 'players' ? '#fff' : 'var(--text-color)',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'players' ? '0 5px 15px rgba(59, 130, 246, 0.4)' : 'none'
            }}
          >
            Игроки
          </button>
          <button
            onClick={() => setActiveTab('squads')}
            style={{
              padding: '12px 30px',
              borderRadius: '30px',
              border: 'none',
              backgroundColor: activeTab === 'squads' ? 'var(--accent-color)' : 'var(--secondary-bg)',
              color: activeTab === 'squads' ? '#fff' : 'var(--text-color)',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'squads' ? '0 5px 15px rgba(59, 130, 246, 0.4)' : 'none'
            }}
          >
            Сквады
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '20px', color: '#94a3b8' }}>Загрузка данных...</div>
        ) : (
          <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '20px', width: '80px', textAlign: 'center' }}>Ранг</th>
                  <th style={{ padding: '20px' }}>{activeTab === 'players' ? 'Студент' : 'Название сквада'}</th>
                  <th style={{ padding: '20px', textAlign: 'right' }}>{activeTab === 'players' ? 'Баланс' : 'Общие очки'}</th>
                  {activeTab === 'players' && <th style={{ padding: '20px', textAlign: 'right', display: 'none' }}>Пассивный доход</th>}
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'players' ? players : squads).map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '20px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: index < 3 ? 'var(--accent-color)' : '#94a3b8' }}>
                      #{index + 1}
                    </td>
                    <td style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {activeTab === 'players' && (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--secondary-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '20px' }}>🕵️</span>
                          )}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {activeTab === 'players' ? (item.custom_name || item.username) : item.name}
                        </div>
                        {activeTab === 'players' && item.is_hidden && (
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Скрытый профиль</div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'right', fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                      {Math.floor(activeTab === 'players' ? item.balance : item.total_points).toLocaleString()} FAMCS
                    </td>
                  </tr>
                ))}
                {(activeTab === 'players' ? players : squads).length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Нет данных</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebLeaderboard;

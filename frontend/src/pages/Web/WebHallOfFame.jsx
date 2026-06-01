import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Link } from 'react-router-dom';

const WebHallOfFame = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/web/hall_of_fame');
        setAdmins(res.data || []);
      } catch (error) {
        console.error('Failed to fetch hall of fame:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const superAdmins = admins.filter(a => a.role === 'superadmin');
  const regularAdmins = admins.filter(a => a.role === 'admin');

  return (
    <div style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color)' }}>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '20px', textShadow: '0 0 20px rgba(245, 158, 11, 0.5)', color: '#f59e0b' }}>Зал Славы</h1>
        <p style={{ textAlign: 'center', fontSize: '20px', color: '#94a3b8', marginBottom: '60px', maxWidth: '600px', margin: '0 auto 60px auto' }}>
          Список легенд, создателей и модераторов проекта, благодаря которым FAMCS Coin продолжает жить и развиваться.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '20px', color: '#94a3b8' }}>Загрузка...</div>
        ) : (
          <>
            {superAdmins.length > 0 && (
              <div style={{ marginBottom: '60px' }}>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', borderBottom: '2px solid rgba(245, 158, 11, 0.3)', paddingBottom: '10px', display: 'inline-block' }}>Основатели</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                  {superAdmins.map((admin, index) => (
                    <AdminCard key={index} admin={admin} isSuper={true} />
                  ))}
                </div>
              </div>
            )}

            {regularAdmins.length > 0 && (
              <div>
                <h2 style={{ fontSize: '32px', marginBottom: '30px', borderBottom: '2px solid rgba(59, 130, 246, 0.3)', paddingBottom: '10px', display: 'inline-block' }}>Модераторы</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                  {regularAdmins.map((admin, index) => (
                    <AdminCard key={index} admin={admin} isSuper={false} />
                  ))}
                </div>
              </div>
            )}
            
            {admins.length === 0 && (
              <div style={{ textAlign: 'center', fontSize: '20px', color: '#94a3b8' }}>Пока здесь пусто...</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AdminCard = ({ admin, isSuper }) => {
  return (
    <div style={{ 
      backgroundColor: 'var(--card-bg)', 
      borderRadius: '16px', 
      padding: '30px 20px', 
      border: `1px solid ${isSuper ? 'rgba(245, 158, 11, 0.3)' : 'var(--glass-border)'}`,
      boxShadow: isSuper ? '0 10px 30px rgba(245, 158, 11, 0.1)' : '0 10px 30px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      transition: 'transform 0.3s',
      cursor: 'default'
    }}
    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ 
        width: '100px', 
        height: '100px', 
        borderRadius: '50%', 
        backgroundColor: 'var(--secondary-bg)', 
        marginBottom: '20px',
        overflow: 'hidden',
        border: `3px solid ${isSuper ? '#f59e0b' : 'var(--accent-color)'}`
      }}>
        {admin.avatar_url ? (
          <img src={admin.avatar_url} alt={admin.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px' }}>🥷</div>
        )}
      </div>
      
      <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{admin.custom_name || admin.username}</h3>
      
      <div style={{ 
        padding: '5px 12px', 
        borderRadius: '20px', 
        fontSize: '12px', 
        fontWeight: 'bold', 
        backgroundColor: isSuper ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        color: isSuper ? '#f59e0b' : '#3b82f6',
        marginBottom: '15px'
      }}>
        {isSuper ? 'Суперадмин' : 'Модератор'}
      </div>
      
      {admin.responsibility && (
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>
          "{admin.responsibility}"
        </p>
      )}
    </div>
  );
};

export default WebHallOfFame;

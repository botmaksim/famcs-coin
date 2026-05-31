import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useUser } from '../../context/UserContext';

const ShopSkins = () => {
  const { user, fetchProfile } = useUser();
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSkins = async () => {
    try {
      const response = await apiClient.get('/shop/skins');
      setSkins(response.data.skins || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch skins:', err);
      setError('Не удалось загрузить скины');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkins();
  }, []);

  const handleBuy = async (skinId) => {
    try {
      await apiClient.post('/shop/skins/buy', { skin_id: skinId });
      alert('Скин успешно куплен!');
      await fetchProfile();
      await fetchSkins();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при покупке скина');
    }
  };

  const handleSelect = async (skinId) => {
    try {
      await apiClient.post('/shop/skins/active', { skin_id: skinId });
      await fetchProfile();
      await fetchSkins();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при выборе скина');
    }
  };

  if (loading) return <div style={{ textAlign: 'center' }}>Загрузка скинов...</div>;
  if (error) return <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
      {skins.map((skin) => {
        const canAfford = user.balance >= skin.price;

        return (
          <div 
            key={skin.id} 
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              borderRadius: '12px',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: skin.is_active ? '0 0 10px rgba(36, 129, 204, 0.5)' : '0 2px 5px rgba(0,0,0,0.1)',
              border: skin.is_active ? '2px solid var(--tg-theme-button-color, #2481cc)' : '2px solid transparent'
            }}
          >
            <img 
              src={skin.image_url} 
              alt={skin.name} 
              style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px' }} 
            />
            <h4 style={{ margin: '0 0 10px 0', textAlign: 'center', fontSize: '14px' }}>{skin.name}</h4>
            
            {skin.is_active ? (
              <button disabled style={{
                padding: '8px', borderRadius: '8px', border: 'none', width: '100%',
                backgroundColor: '#22c55e', color: '#fff', fontWeight: 'bold'
              }}>Активно</button>
            ) : skin.is_owned || skin.price === 0 ? (
              <button 
                onClick={() => handleSelect(skin.id)}
                style={{
                padding: '8px', borderRadius: '8px', border: 'none', width: '100%', cursor: 'pointer',
                backgroundColor: 'var(--tg-theme-button-color, #2481cc)', color: '#fff', fontWeight: 'bold'
              }}>Выбрать</button>
            ) : (
              <button 
                onClick={() => handleBuy(skin.id)}
                disabled={!canAfford}
                style={{
                  padding: '8px', borderRadius: '8px', border: 'none', width: '100%',
                  backgroundColor: canAfford ? '#f59e0b' : '#ccc', color: '#fff', fontWeight: 'bold',
                  cursor: canAfford ? 'pointer' : 'not-allowed'
                }}
              >
                {skin.price} 🪙
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ShopSkins;

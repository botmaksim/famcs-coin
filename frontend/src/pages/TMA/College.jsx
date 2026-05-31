import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useUser } from '../../context/UserContext';
import { useUser } from '../../context/UserContext';
import ShopSkins from './ShopSkins';

const College = () => {
  const { user, fetchProfile } = useUser();
  const [activeTab, setActiveTab] = useState('upgrades'); // 'upgrades' | 'skins'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await apiClient.get('/shop/items');
        setItems(response.data.items || []); // Предполагаем формат { items: [...] }
        setError(null);
      } catch (err) {
        console.error('Failed to fetch shop items:', err);
        setError('Не удалось загрузить список улучшений');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleBuy = async (upgradeId) => {
    try {
      setBuyingId(upgradeId);
      await apiClient.post('/shop/buy', { upgrade_id: upgradeId });
      
      // После успешной покупки обновляем профиль с бэкенда (чтобы актуализировать баланс и пассивку)
      await fetchProfile();

      // Опционально: можно также перегрузить список items, чтобы обновить цены/уровни
      // Если бэкенд возвращает обновленные цены в /shop/items, то нужно дернуть и его.
    } catch (err) {
      console.error('Buy error:', err);
      // Пытаемся достать текст ошибки от бэкенда
      const errMsg = err.response?.data || err.message || 'Ошибка при покупке';
      alert(`Не удалось купить: ${errMsg}`);
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка магазина...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>Универ (Магазин)</h2>
      <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--tg-theme-hint-color, #999)' }}>
        Твой баланс: <strong>{user.balance?.toFixed(0)} 🪙</strong>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
        <button 
          onClick={() => setActiveTab('upgrades')}
          style={{
            padding: '10px 20px', border: 'none', borderRadius: '20px',
            backgroundColor: activeTab === 'upgrades' ? 'var(--tg-theme-button-color, #2481cc)' : 'transparent',
            color: activeTab === 'upgrades' ? 'var(--tg-theme-button-text-color, #fff)' : 'var(--tg-theme-text-color, #000)',
            cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          Улучшения
        </button>
        <button 
          onClick={() => setActiveTab('skins')}
          style={{
            padding: '10px 20px', border: 'none', borderRadius: '20px',
            backgroundColor: activeTab === 'skins' ? 'var(--tg-theme-button-color, #2481cc)' : 'transparent',
            color: activeTab === 'skins' ? 'var(--tg-theme-button-text-color, #fff)' : 'var(--tg-theme-text-color, #000)',
            cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          Скины
        </button>
      </div>

      {activeTab === 'skins' ? (
        <ShopSkins />
      ) : (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '15px' 
          }}>
        {items.map((item) => {
          // Высчитываем возможность покупки
          // В реальном приложении цена item.price уже должна приходить с бэкенда 
          // с учетом уровня юзера (base_price * (price_multiplier ^ current_level)).
          const canAfford = user.balance >= item.price;
          const isBuying = buyingId === item.id;

          return (
            <div 
              key={item.id} 
              style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
                borderRadius: '12px',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>{item.title}</h3>
                {item.description && (
                  <p style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #666)', margin: '0 0 15px 0' }}>
                    {item.description}
                  </p>
                )}
                
                <div style={{ fontSize: '14px', marginBottom: '15px' }}>
                  <div style={{ color: 'var(--tg-theme-button-color, #2481cc)', fontWeight: 'bold' }}>
                    +{item.profit_increase} 🪙 / час
                  </div>
                  <div>Уровень: {item.current_level || 0}</div>
                </div>
              </div>

              <button
                onClick={() => handleBuy(item.id)}
                disabled={!canAfford || isBuying}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: canAfford 
                    ? 'var(--tg-theme-button-color, #2481cc)' 
                    : 'var(--tg-theme-hint-color, #ccc)',
                  color: canAfford 
                    ? 'var(--tg-theme-button-text-color, #fff)' 
                    : '#666',
                  fontWeight: 'bold',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  opacity: isBuying ? 0.7 : 1
                }}
              >
                {isBuying ? 'Покупка...' : `${item.price.toFixed(0)} 🪙`}
              </button>
            </div>
          );
        })}
      </div>
      
      {items.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999' }}>
          Карточки пока не добавлены
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default College;

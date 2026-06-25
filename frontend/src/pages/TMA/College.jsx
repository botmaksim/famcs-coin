import { useState } from 'react';
import { ShopService } from '../../api/services/ShopService';
import { useUser } from '../../context/UserContext';
import ShopSkins from './ShopSkins';
import { Skeleton } from '../../components/Skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const College = () => {
  const { user, fetchProfile } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upgrades'); // 'upgrades' | 'skins'

  const { data: itemsData, isLoading: loading, error: itemsError } = useQuery({
    queryKey: ['shopItems'],
    queryFn: async () => {
      const response = await ShopService.getItems();
      return response.data.items || [];
    },
    enabled: activeTab === 'upgrades'
  });

  const items = itemsData || [];
  const error = itemsError ? 'Не удалось загрузить список улучшений' : null;

  const buyItemMutation = useMutation({
    mutationFn: (upgradeId) => ShopService.buyItem(upgradeId),
    onSuccess: () => {
      fetchProfile();
      queryClient.invalidateQueries({ queryKey: ['shopItems'] });
    },
    onError: (err) => {
      console.error('Buy error:', err);
      const errMsg = err.response?.data || err.message || 'Ошибка при покупке';
      alert(`Не удалось купить: ${errMsg}`);
    }
  });

  const handleBuy = (upgradeId) => {
    buyItemMutation.mutate(upgradeId);
  };

  if (loading) return (
    <div className="p-5 font-sans">
      <Skeleton className="w-1/2 h-8 mx-auto mb-2" />
      <Skeleton className="w-1/3 h-4 mx-auto mb-5" />
      <div className="flex justify-center gap-2.5 mb-5">
        <Skeleton className="w-28 h-10 rounded-full" />
        <Skeleton className="w-28 h-10 rounded-full" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
  if (error) return <div className="p-5 text-center text-red-500">{error}</div>;

  return (
    <div className="p-5 font-sans">
      <h2 className="text-center mb-0 mt-0">Универ (Магазин)</h2>
      <div className="text-center mb-5 text-slate-600">
        Твой баланс: <strong>{user.balance?.toFixed(0)}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" /></strong>
      </div>

      <div className="flex justify-center mb-5 gap-2.5">
        <button 
          onClick={() => setActiveTab('upgrades')}
          className={`px-5 py-2.5 rounded-full border-none font-bold cursor-pointer transition-colors ${activeTab === 'upgrades' ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]' : 'bg-transparent text-slate-800'}`}
        >
          Улучшения
        </button>
        <button 
          onClick={() => setActiveTab('skins')}
          className={`px-5 py-2.5 rounded-full border-none font-bold cursor-pointer transition-colors ${activeTab === 'skins' ? 'bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]' : 'bg-transparent text-slate-800'}`}
        >
          Скины
        </button>
      </div>

      {activeTab === 'skins' ? (
        <ShopSkins />
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
        {items.map((item) => {
          // Высчитываем возможность покупки
          // В реальном приложении цена item.price уже должна приходить с бэкенда 
          // с учетом уровня юзера (base_price * (price_multiplier ^ current_level)).
          const canAfford = user.balance >= item.price;
          const isBuying = buyItemMutation.isPending && buyItemMutation.variables === item.id;

          return (
            <div 
              key={item.id} 
              className="bg-[rgba(18,18,18,0.75)] rounded-xl py-4 px-3 flex flex-col justify-between shadow-[0_4px_6px_rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)]"
            >
              <div>
                <h3 className="m-0 mb-2.5 text-base">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-slate-600 m-0 mb-4">
                    {item.description}
                  </p>
                )}
                
                <div className="text-sm mb-4">
                  <div className="text-green-400 font-bold">
                    +{item.profit_increase}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" /> / час
                  </div>
                  <div>Уровень: {item.current_level || 0}</div>
                </div>
              </div>

              <button
                onClick={() => handleBuy(item.id)}
                disabled={!canAfford || isBuying}
                className={`p-2.5 rounded-lg border-none font-bold flex justify-center items-center gap-1 transition-all
                  ${canAfford ? 'bg-blue-600 text-white cursor-pointer shadow-[0_0_10px_rgba(163,230,53,0.3)] hover:bg-blue-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed hidden-shadow'}
                  ${isBuying ? 'opacity-70' : 'opacity-100'}
                `}
              >
                {isBuying ? 'Покупка...' : (
                  <>
                    {item.price.toFixed(0)} <img src="/icons/coin.png" alt="coin" className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      {items.length === 0 && (
        <div className="text-center text-slate-600 pt-5">
          Карточки пока не добавлены
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default College;

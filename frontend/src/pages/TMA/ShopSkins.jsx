import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/client';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/Skeleton';

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
      toast.success('Скин успешно куплен!');
      await fetchProfile();
      await fetchSkins();
    } catch (err) {
      toast.error(err.response?.data || 'Ошибка при покупке скина');
    }
  };

  const handleSelect = async (skinId) => {
    try {
      await apiClient.post('/shop/skins/active', { skin_id: skinId });
      toast.success('Скин выбран!');
      await fetchProfile();
      await fetchSkins();
    } catch (err) {
      toast.error(err.response?.data || 'Ошибка при выборе скина');
    }
  };

  if (loading) return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-[rgba(18,18,18,0.75)] rounded-xl p-4 flex flex-col items-center">
           <Skeleton className="w-20 h-20 rounded-full mb-2.5" />
           <Skeleton className="w-24 h-4 mb-2.5" />
           <Skeleton className="w-full h-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
  if (error) return <div className="text-center pt-5 text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
      {skins.map((skin) => {
        const canAfford = user.balance >= skin.price;

        return (
          <div 
            key={skin.id} 
            className={`bg-[rgba(18,18,18,0.75)] rounded-xl p-4 flex flex-col items-center border ${skin.is_active ? 'border-blue-600 shadow-[0_0_15px_rgba(163,230,53,0.4)]' : 'border-[rgba(255,255,255,0.05)] shadow-[0_4px_6px_rgba(0,0,0,0.3)]'}`}
          >
            <img 
              src={skin.image_url} 
              alt={skin.name} 
              className="w-20 h-20 object-contain mb-2.5" 
            />
            <h4 className="m-0 mb-2.5 text-center text-sm">{skin.name}</h4>
            
            {skin.is_active ? (
              <button disabled className="w-full p-2 rounded-lg border-none bg-green-500 text-black font-bold opacity-100 cursor-default">
                Активно
              </button>
            ) : skin.is_owned || skin.price === 0 ? (
              <button 
                onClick={() => handleSelect(skin.id)}
                className="w-full p-2 rounded-lg border-none bg-blue-600 text-white font-bold cursor-pointer transition-colors hover:bg-blue-600 text-white"
              >
                Выбрать
              </button>
            ) : (
              <button 
                onClick={() => handleBuy(skin.id)}
                disabled={!canAfford}
                className={`w-full p-2 rounded-lg border-none font-bold transition-colors ${canAfford ? 'bg-amber-500 text-black cursor-pointer hover:bg-amber-400' : 'bg-slate-100 text-black cursor-not-allowed hidden-shadow opacity-50'}`}
              >
                {skin.price}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ShopSkins;

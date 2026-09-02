import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { AdminService } from '../../api/services/AdminService';
import { BetsService } from '../../api/services/BetsService';
import { ShopService } from '../../api/services/ShopService';
import { FeedbackService } from '../../api/services/FeedbackService';
import { NewsService } from '../../api/services/NewsService';
import { ArrowLeft, Plus, Trash2, CheckCircle, Shield, AlertCircle, MessageSquare, Search, Check, X, Clock, RefreshCw, Newspaper, ThumbsUp, ThumbsDown } from 'lucide-react';

const TmaAdmin = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('bets'); // 'bets' | 'shop' | 'feedback' | 'news'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // News State
  const [adminNews, setAdminNews] = useState([]);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');

  // Bets State
  const [bets, setBets] = useState([]);
  const [betTitle, setBetTitle] = useState('');
  const [betDesc, setBetDesc] = useState('');
  const [betOptions, setBetOptions] = useState(['', '']);
  const [betClosesAt, setBetClosesAt] = useState('');
  const [selectedWinners, setSelectedWinners] = useState({});

  // Shop State
  const [shopItems, setShopItems] = useState([]);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemProfit, setItemProfit] = useState('');
  const [itemImage, setItemImage] = useState('/famcscoin.png');

  // Feedback State
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [feedbackSearch, setFeedbackSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [betsRes, shopRes, feedbackRes, newsRes] = await Promise.all([
        BetsService.getActiveBets(),
        ShopService.getItems(),
        FeedbackService.getFeedback().catch(() => ({ data: [] })),
        NewsService.getNews().catch(() => ({ data: [] }))
      ]);
      setBets(betsRes.data || []);
      setShopItems(shopRes.data || []);
      setFeedbacks(feedbackRes.data || []);
      setAdminNews(newsRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      showNotification('Заполните заголовок и текст новости', 'error');
      return;
    }
    setLoading(true);
    try {
      await NewsService.createNews({
        title: newsTitle.trim(),
        content: newsContent.trim(),
        image_url: newsImage.trim() || null
      });
      showNotification('Новость успешно опубликована!');
      setNewsTitle('');
      setNewsContent('');
      setNewsImage('');
      const res = await NewsService.getNews();
      setAdminNews(res.data || []);
    } catch (err) {
      showNotification(err.response?.data || 'Ошибка создания новости', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm('Удалить эту новость?')) return;
    setLoading(true);
    try {
      await NewsService.deleteNews(id);
      showNotification('Новость удалена');
      setAdminNews(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      showNotification('Ошибка при удалении новости', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId, status) => {
    setLoading(true);
    try {
      await AdminService.updateFeedbackStatus(feedbackId, status);
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status } : f));
      showNotification('Статус отзыва успешно обновлен!');
    } catch (err) {
      showNotification(err.response?.data || 'Ошибка при обновлении статуса', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // --- BET ACTIONS ---
  const handleAddOption = () => {
    setBetOptions(prev => [...prev, '']);
  };

  const handleRemoveOption = (index) => {
    if (betOptions.length <= 2) return;
    setBetOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    setBetOptions(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleCreateBet = async (e) => {
    e.preventDefault();
    const cleanOptions = betOptions.map(o => o.trim()).filter(Boolean);
    if (!betTitle || cleanOptions.length < 2 || !betClosesAt) {
      showNotification('Заполните название, дату и минимум 2 варианта', 'error');
      return;
    }

    setLoading(true);
    try {
      await AdminService.createBet({
        title: betTitle,
        description: betDesc,
        options: cleanOptions,
        closes_at: new Date(betClosesAt).toISOString()
      });
      showNotification('Событие для ставок успешно создано!');
      setBetTitle('');
      setBetDesc('');
      setBetOptions(['', '']);
      setBetClosesAt('');
      loadData();
    } catch (err) {
      showNotification(err.response?.data || 'Ошибка при создании события', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBet = async (eventId) => {
    const winnerIdx = selectedWinners[eventId];
    if (winnerIdx === undefined || winnerIdx === '') {
      showNotification('Выберите вариант-победитель перед завершением', 'error');
      return;
    }

    if (!confirm('Завершить событие и выплатить выигрыши участникам?')) return;

    setLoading(true);
    try {
      await AdminService.closeBet(eventId, parseInt(winnerIdx, 10));
      showNotification('Событие завершено, выигрыши начислены!');
      loadData();
    } catch (err) {
      showNotification(err.response?.data || 'Ошибка при завершении события', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- SHOP ACTIONS ---
  const handleCreateShopItem = async (e) => {
    e.preventDefault();
    if (!itemTitle || !itemPrice || !itemProfit) {
      showNotification('Заполните название, цену и доход', 'error');
      return;
    }

    setLoading(true);
    try {
      await AdminService.createShopItem({
        title: itemTitle,
        description: itemDesc,
        base_price: parseFloat(itemPrice),
        profit_increase: parseFloat(itemProfit),
        image_url: itemImage
      });
      showNotification('Товар успешно добавлен в магазин!');
      setItemTitle('');
      setItemDesc('');
      setItemPrice('');
      setItemProfit('');
      setItemImage('/famcscoin.png');
      loadData();
    } catch (err) {
      showNotification(err.response?.data || 'Ошибка при добавлении товара', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShopItem = async (itemId) => {
    if (!confirm('Удалить этот товар? Потраченные коины вернутся игрокам автоматически!')) return;

    setLoading(true);
    try {
      await AdminService.deleteShopItem(itemId);
      showNotification('Товар удален, средства возвращены игрокам');
      loadData();
    } catch (err) {
      showNotification(err.response?.data || 'Ошибка при удалении товара', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Shield size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold dark:text-white mb-2">Доступ ограничен</h2>
        <p className="text-sm text-slate-500 mb-6">Эта страница доступна только администраторам проекта.</p>
        <button
          onClick={() => navigate('/app/terminal')}
          className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/app/profile')}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
            Панель управления
          </h2>
          <span className="text-xs text-orange-500 font-bold uppercase tracking-wider">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Status Notifications */}
      {message.text && (
        <div className={`p-4 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 ${
          message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'
        }`}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('bets')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'bets' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'
          }`}
        >
          Ставки
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'shop' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'
          }`}
        >
          Магазин
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'feedback' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'
          }`}
        >
          Отзывы
          {feedbacks.length > 0 && (
            <span className="px-1.5 py-0.2 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-full text-[10px]">
              {feedbacks.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'news' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'
          }`}
        >
          Новости
          {adminNews.length > 0 && (
            <span className="px-1.5 py-0.2 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 rounded-full text-[10px]">
              {adminNews.length}
            </span>
          )}
        </button>
      </div>

      {/* === BETS TAB === */}
      {activeTab === 'bets' && (
        <div className="flex flex-col gap-6">
          {/* Create Bet Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">
              Создать событие для ставок
            </h3>
            <form onSubmit={handleCreateBet} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Название события</label>
                <input
                  type="text"
                  value={betTitle}
                  onChange={(e) => setBetTitle(e.target.value)}
                  placeholder="Например: Кто сдаст матан с 1 раза?"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Описание</label>
                <textarea
                  value={betDesc}
                  onChange={(e) => setBetDesc(e.target.value)}
                  placeholder="Подробности события..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Варианты исхода</label>
                <div className="flex flex-col gap-2">
                  {betOptions.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Вариант ${index + 1}`}
                        className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white"
                        required
                      />
                      {betOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="self-start text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 mt-1"
                  >
                    <Plus size={14} /> Добавить вариант
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Дата и время закрытия</label>
                <input
                  type="datetime-local"
                  value={betClosesAt}
                  onChange={(e) => setBetClosesAt(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Создание...' : 'Опубликовать событие'}
              </button>
            </form>
          </div>

          {/* Manage Existing Bets */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">
              Активные события ({bets.length})
            </h3>
            <div className="flex flex-col gap-4">
              {bets.map((bet) => (
                <div key={bet.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-white text-base">{bet.title}</h4>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      bet.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {bet.status}
                    </span>
                  </div>
                  {bet.description && (
                    <p className="text-xs text-slate-500 mb-3">{bet.description}</p>
                  )}

                  {bet.status === 'open' ? (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 block">
                        Выбрать победителя для закрытия:
                      </label>
                      <div className="flex flex-col gap-1.5 mb-3">
                        {bet.options?.map((opt, idx) => (
                          <label key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer">
                            <input
                              type="radio"
                              name={`winner-${bet.id}`}
                              value={idx}
                              checked={selectedWinners[bet.id] === String(idx)}
                              onChange={(e) => setSelectedWinners({ ...selectedWinners, [bet.id]: e.target.value })}
                              className="accent-orange-500"
                            />
                            <span className="dark:text-slate-200">{opt}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCloseBet(bet.id)}
                        disabled={loading}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-sm"
                      >
                        Завершить и выплатить выигрыш
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 mt-2">
                      Победитель: {bet.options?.[bet.winning_option_index] || 'Завершено'}
                    </div>
                  )}
                </div>
              ))}
              {bets.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-6">Событий пока нет</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === SHOP TAB === */}
      {activeTab === 'shop' && (
        <div className="flex flex-col gap-6">
          {/* Add Shop Item Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">
              Добавить источник дохода
            </h3>
            <form onSubmit={handleCreateShopItem} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Название улучшения</label>
                <input
                  type="text"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="Например: Кофе из автомата"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Описание</label>
                <textarea
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Что даёт это улучшение..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Цена покупки</label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="2000"
                    min="1"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Доход в час</label>
                  <input
                    type="number"
                    value={itemProfit}
                    onChange={(e) => setItemProfit(e.target.value)}
                    placeholder="150"
                    min="1"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Картинка (URL или пресет)</label>
                <input
                  type="text"
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                  placeholder="/shawarma.png"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white mb-2"
                />
                <div className="flex gap-2">
                  {[
                    { label: 'Шаурма', path: '/shawarma.png' },
                    { label: 'Монета', path: '/famcscoin.png' }
                  ].map(preset => (
                    <button
                      key={preset.path}
                      type="button"
                      onClick={() => setItemImage(preset.path)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-500"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Добавление...' : 'Добавить в магазин'}
              </button>
            </form>
          </div>

          {/* Current Shop Items */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">
              Товары в магазине ({shopItems.length})
            </h3>
            <div className="flex flex-col gap-3">
              {shopItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-14 h-14 rounded-xl object-cover"
                    onError={(e) => { e.target.src = '/famcscoin.png'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{item.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                    <div className="flex gap-2 text-xs font-semibold mt-1">
                      <span className="text-orange-500">{Math.floor(item.price).toLocaleString()} коинов</span>
                      <span className="text-green-500">+{item.profit_increase}/ч</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteShopItem(item.id)}
                    disabled={loading}
                    className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
                    title="Удалить товар"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {shopItems.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-6">В магазине пока нет товаров</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === FEEDBACK TAB === */}
      {activeTab === 'feedback' && (
        <div className="flex flex-col gap-5">
          {/* Header & Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <MessageSquare size={20} className="text-orange-500" />
                  Отзывы и предложения
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Всего отзывов: {feedbacks.length}
                </p>
              </div>
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-orange-500 bg-slate-100 dark:bg-slate-700/60 rounded-xl transition"
                title="Обновить список"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3.5">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                placeholder="Поиск по автору или тексту..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-xs text-slate-800 dark:text-white"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'Все' },
                { id: 'pending', label: 'На рассмотрении' },
                { id: 'approved', label: 'Одобренные' },
                { id: 'rejected', label: 'Отклонённые' }
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setFeedbackFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    feedbackFilter === chip.id
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {chip.label}
                  {chip.id !== 'all' && (
                    <span className="ml-1 opacity-75">
                      ({feedbacks.filter(f => f.status === chip.id).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Cards List */}
          <div className="flex flex-col gap-3">
            {feedbacks
              .filter(f => {
                const matchesFilter = feedbackFilter === 'all' || f.status === feedbackFilter;
                const matchesSearch = !feedbackSearch || 
                  (f.username && f.username.toLowerCase().includes(feedbackSearch.toLowerCase())) ||
                  (f.text && f.text.toLowerCase().includes(feedbackSearch.toLowerCase()));
                return matchesFilter && matchesSearch;
              })
              .map(item => (
                <div 
                  key={item.id} 
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                        <span>@{item.username || 'Аноним'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">#{item.user_id}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(item.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      item.status === 'approved' 
                        ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-200/50' 
                        : item.status === 'rejected'
                        ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50'
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50'
                    }`}>
                      {item.status === 'approved' ? 'Одобрено' : item.status === 'rejected' ? 'Отклонено' : 'На рассмотрении'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    {item.text}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      onClick={() => handleUpdateFeedbackStatus(item.id, 'approved')}
                      disabled={loading || item.status === 'approved'}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                        item.status === 'approved'
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-400'
                          : 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
                      }`}
                    >
                      <Check size={13} />
                      Одобрить
                    </button>

                    <button
                      onClick={() => handleUpdateFeedbackStatus(item.id, 'rejected')}
                      disabled={loading || item.status === 'rejected'}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                        item.status === 'rejected'
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-400'
                          : 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                      }`}
                    >
                      <X size={13} />
                      Отклонить
                    </button>

                    {item.status !== 'pending' && (
                      <button
                        onClick={() => handleUpdateFeedbackStatus(item.id, 'pending')}
                        disabled={loading}
                        className="py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-700 transition"
                        title="Вернуть в рассмотрение"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {feedbacks.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs font-medium bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                Пока нет ни одного отзыва
              </div>
            )}
          </div>
        </div>
      )}

      {/* === NEWS & DEVELOPMENT IDEAS TAB === */}
      {activeTab === 'news' && (
        <div className="flex flex-col gap-6">
          {/* Create News Form */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Plus size={16} className="text-orange-500" />
              Опубликовать новость / идею развития
            </h3>
            <form onSubmit={handleCreateNews} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Заголовок</label>
                <input
                  type="text"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="Например: Добавим клановые войны?"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Описание и детали</label>
                <textarea
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="Подробно опишите планируемый функционал..."
                  rows={4}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">URL изображения (необязательно)</label>
                <input
                  type="text"
                  value={newsImage}
                  onChange={(e) => setNewsImage(e.target.value)}
                  placeholder="https://... или /image.png"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all disabled:opacity-50 text-xs mt-1"
              >
                {loading ? 'Публикация...' : 'Опубликовать для голосования'}
              </button>
            </form>
          </div>

          {/* List of News */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider px-1">
              Опубликованные новости ({adminNews.length})
            </h4>

            {adminNews.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {new Date(item.created_at).toLocaleDateString('ru-RU')}
                  </span>
                  <button
                    onClick={() => handleDeleteNews(item.id)}
                    disabled={loading}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    title="Удалить новость"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="font-bold text-sm text-slate-800 dark:text-white">
                  {item.title}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                  {item.content}
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-1 text-emerald-600 font-bold">
                    <ThumbsUp size={13} />
                    <span>{item.likes_count}</span>
                  </div>
                  <div className="flex items-center gap-1 text-rose-600 font-bold">
                    <ThumbsDown size={13} />
                    <span>{item.dislikes_count}</span>
                  </div>
                </div>
              </div>
            ))}

            {adminNews.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs font-medium bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                Новостей пока нет. Создайте первую новость выше!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TmaAdmin;

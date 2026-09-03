import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { AdminService } from '../../api/services/AdminService';
import { BetsService } from '../../api/services/BetsService';
import { ShopService } from '../../api/services/ShopService';
import { FeedbackService } from '../../api/services/FeedbackService';
import { NewsService } from '../../api/services/NewsService';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Plus, Trash2, CheckCircle, Shield, AlertCircle, MessageSquare, Search, Check, X, Clock, RefreshCw, Newspaper, ThumbsUp, ThumbsDown, Edit3, XCircle, FileText, Languages, ChevronDown, Users, Crown } from 'lucide-react';
import { convertLayout, convertTextToRu } from '../../utils/keyboardLayout';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

const TmaAdmin = () => {
  const { user, fetchProfile } = useUser();
  const { showSuccess, showError, showConfirm } = useToast();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'superadmin';

  const [activeTab, setActiveTab] = useState('bets'); // 'bets' | 'shop' | 'feedback' | 'news' | 'roles'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [forceRuLayout, setForceRuLayout] = useState(false);

  // Superadmin Roles Management State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState(null);

  // News State
  const [adminNews, setAdminNews] = useState([]);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [newsStatus, setNewsStatus] = useState('open');
  const [newsVerdict, setNewsVerdict] = useState('');
  const [newsVerdictNote, setNewsVerdictNote] = useState('');
  const [editingNewsId, setEditingNewsId] = useState(null);

  // News Header & Rich Text State
  const [headerTitle, setHeaderTitle] = useState('Новости и Идеи Развития');
  const [headerSubtitle, setHeaderSubtitle] = useState('Узнавайте первыми о новых фичах факультетской игры и голосуйте за идеи!');
  const [headerBanner, setHeaderBanner] = useState('');
  const [showBannerConfig, setShowBannerConfig] = useState(false);

  const handleFieldChange = (setter) => (e) => {
    const val = e.target.value;
    setter(forceRuLayout ? convertTextToRu(val) : val);
  };

  // Bets State
  const getTomorrowDate = () => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [bets, setBets] = useState([]);
  const [betTitle, setBetTitle] = useState('');
  const [betDesc, setBetDesc] = useState('');
  const [betOptions, setBetOptions] = useState(['', '']);
  const [betCloseDate, setBetCloseDate] = useState(getTomorrowDate);
  const [betCloseHour, setBetCloseHour] = useState('18');
  const [betCloseMinute, setBetCloseMinute] = useState('00');
  const [selectedWinners, setSelectedWinners] = useState({});

  const handleApplyDatePreset = (hours) => {
    const d = new Date(Date.now() + hours * 3600 * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    setBetCloseDate(`${year}-${month}-${day}`);
    setBetCloseHour(h);
    setBetCloseMinute(m);
  };

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

  const fetchUsers = useCallback(async (query = '') => {
    if (!isSuperAdmin) return;
    try {
      setLoadingUsers(true);
      const res = await AdminService.getUsers(query);
      setUsersList(res.data || []);
    } catch (err) {
      console.error('Failed to load users for role management', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [isSuperAdmin]);

  const handleRoleChange = (targetUser, targetRole) => {
    if (targetUser.tg_id === user?.tg_id) {
      showError('Нельзя изменить роль своего собственного аккаунта');
      return;
    }

    const roleNames = {
      superadmin: 'Суперадмин',
      admin: 'Администратор',
      user: 'Студент (User)'
    };
    const roleName = roleNames[targetRole] || targetRole;
    const targetLabel = targetUser.username 
      ? `@${targetUser.username.replace(/^@/, '')}` 
      : (targetUser.custom_name || targetUser.first_name || `ID: ${targetUser.tg_id}`);

    showConfirm(
      `Назначить роль «${roleName}» пользователю ${targetLabel}?`,
      async () => {
        try {
          setRoleUpdatingId(targetUser.tg_id);
          await AdminService.updateRole(targetUser.tg_id, targetRole);
          showSuccess(`Роль пользователя обновлена на ${roleName}`);
          await fetchUsers(userSearch);
        } catch (err) {
          showError(err.response?.data || 'Ошибка при обновлении роли');
        } finally {
          setRoleUpdatingId(null);
        }
      }
    );
  };

  const loadData = useCallback(async () => {
    try {
      const [betsRes, shopRes, feedbackRes, newsRes, headerRes] = await Promise.all([
        BetsService.getActiveBets(),
        ShopService.getItems(),
        FeedbackService.getFeedback().catch(() => ({ data: [] })),
        NewsService.getNews().catch(() => ({ data: [] })),
        NewsService.getNewsHeader().catch(() => null)
      ]);
      setBets(betsRes.data || []);
      setShopItems(shopRes.data || []);
      setFeedbacks(feedbackRes.data || []);
      setAdminNews(newsRes.data || []);
      if (headerRes?.data) {
        setHeaderTitle(headerRes.data.title || 'Новости и Идеи Развития');
        setHeaderSubtitle(headerRes.data.subtitle || '');
        setHeaderBanner(headerRes.data.banner || '');
      }
      if (isSuperAdmin) {
        fetchUsers(userSearch);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  }, [isSuperAdmin, fetchUsers, userSearch]);

  const refreshAdmin = useCallback(() => {
    loadData();
    fetchProfile?.();
  }, [loadData, fetchProfile]);

  useAutoRefresh(refreshAdmin);

  const handleStartEditNews = (item) => {
    setEditingNewsId(item.id);
    setNewsTitle(item.title);
    setNewsContent(item.content);
    setNewsImage(item.image_url || '');
    setNewsStatus(item.status || 'open');
    setNewsVerdict(item.verdict || '');
    setNewsVerdictNote(item.verdict_note || '');
  };

  const handleCancelEditNews = () => {
    setEditingNewsId(null);
    setNewsTitle('');
    setNewsContent('');
    setNewsImage('');
    setNewsStatus('open');
    setNewsVerdict('');
    setNewsVerdictNote('');
  };

  const handleSaveNews = async (e) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      showNotification('Заполните заголовок и текст новости', 'error');
      return;
    }
    setLoading(true);
    try {
      if (editingNewsId) {
        await NewsService.updateNews({
          id: editingNewsId,
          title: newsTitle.trim(),
          content: newsContent.trim(),
          image_url: newsImage.trim() || null,
          status: newsStatus,
          verdict: newsVerdict.trim() || null,
          verdict_note: newsVerdictNote.trim() || null
        });
        showNotification('Новость успешно обновлена!');
      } else {
        await NewsService.createNews({
          title: newsTitle.trim(),
          content: newsContent.trim(),
          image_url: newsImage.trim() || null,
          status: newsStatus
        });
        showNotification('Новость успешно опубликована!');
      }
      handleCancelEditNews();
      const res = await NewsService.getNews();
      setAdminNews(res.data || []);
    } catch (err) {
      showNotification(err.response?.data || 'Ошибка при сохранении новости', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (id, status, verdict = null, verdictNote = null) => {
    setLoading(true);
    try {
      await NewsService.closePoll({
        id,
        status,
        verdict,
        verdict_note: verdictNote
      });
      showNotification('Статус опроса обновлен!');
      const res = await NewsService.getNews();
      setAdminNews(res.data || []);
    } catch (err) {
      showNotification(err.response?.data || 'Ошибка обновления статуса', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHeaderSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await NewsService.updateNewsHeader({
        title: headerTitle.trim(),
        subtitle: headerSubtitle.trim(),
        banner: headerBanner.trim()
      });
      showNotification('Вступительный текст и баннер сохранены!');
      setShowBannerConfig(false);
    } catch (err) {
      showNotification('Ошибка сохранения текста', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async (id) => {
    const confirmed = await showConfirm({
      title: 'Удалить новость?',
      message: 'Эта новость и результаты голосования будут безвозвратно удалены.',
      confirmText: 'Удалить',
      isDanger: true,
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      await NewsService.deleteNews(id);
      showNotification('Новость успешно удалена');
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

  const handleDeleteFeedback = async (feedbackId) => {
    const confirmed = await showConfirm({
      title: 'Удалить отзыв?',
      message: 'Вы уверены, что хотите удалить этот отзыв из базы данных?',
      confirmText: 'Удалить',
      isDanger: true,
    });
    if (!confirmed) return;
    setLoading(true);
    try {
      await AdminService.deleteFeedback(feedbackId);
      setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
      showNotification('Отзыв успешно удален!');
    } catch (err) {
      showNotification(err.response?.data || 'Ошибка при удалении отзыва', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text, type = 'success') => {
    if (type === 'error') {
      showError(text);
    } else {
      showSuccess(text);
    }
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
    if (!betTitle || cleanOptions.length < 2 || !betCloseDate) {
      showNotification('Заполните название, дату и минимум 2 варианта', 'error');
      return;
    }

    const effectiveClosesAt = `${betCloseDate}T${betCloseHour}:${betCloseMinute}:00`;

    setLoading(true);
    try {
      await AdminService.createBet({
        title: betTitle,
        description: betDesc,
        options: cleanOptions,
        closes_at: new Date(effectiveClosesAt).toISOString()
      });
      showNotification('Событие для ставок успешно создано!');
      setBetTitle('');
      setBetDesc('');
      setBetOptions(['', '']);
      setBetCloseDate(getTomorrowDate());
      setBetCloseHour('18');
      setBetCloseMinute('00');
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

    const confirmed = await showConfirm({
      title: 'Завершить событие?',
      message: 'Завершить событие и выплатить выигрыши всем победителям?',
      confirmText: 'Завершить и выплатить',
      isDanger: false,
    });
    if (!confirmed) return;

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
    const confirmed = await showConfirm({
      title: 'Удалить товар?',
      message: 'Удалить этот товар из магазина? Потраченные коины вернутся игрокам автоматически.',
      confirmText: 'Удалить и вернуть средства',
      isDanger: true,
    });
    if (!confirmed) return;

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
          <div className="flex items-center gap-1.5 mt-0.5">
            {isSuperAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 shadow-sm">
                <Crown size={11} className="text-amber-500" />
                Суперадминистратор
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center gap-1 shadow-sm">
                <Shield size={11} className="text-orange-500" />
                Администратор
              </span>
            )}
          </div>
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
      <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => setActiveTab('bets')}
          className={`flex-1 min-w-[62px] py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'bets' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'
          }`}
        >
          Ставки
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 min-w-[62px] py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'shop' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'
          }`}
        >
          Магазин
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 min-w-[62px] py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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
          className={`flex-1 min-w-[62px] py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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
        {isSuperAdmin && (
          <button
            onClick={() => {
              setActiveTab('roles');
              fetchUsers(userSearch);
            }}
            className={`flex-1 min-w-[62px] py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'roles' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-600 dark:text-purple-400'
            }`}
          >
            <Users size={12} />
            <span>Роли</span>
          </button>
        )}
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
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">
                  Дата и время закрытия (24-часовой формат)
                </label>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <span className="text-[11px] font-semibold text-slate-400 mr-0.5">Быстро:</span>
                  {[
                    { label: '+2ч', hours: 2 },
                    { label: '+6ч', hours: 6 },
                    { label: '+12ч', hours: 12 },
                    { label: '+1 день', hours: 24 },
                    { label: '+3 дня', hours: 72 },
                    { label: '+1 неделя', hours: 168 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyDatePreset(preset.hours)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-slate-700/60 dark:hover:bg-slate-700 dark:text-orange-400 transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Date & 24h Time Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="date"
                      value={betCloseDate}
                      onChange={(e) => setBetCloseDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-xs text-slate-800 dark:text-white cursor-pointer font-medium"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="relative">
                      <select
                        value={betCloseHour}
                        onChange={(e) => setBetCloseHour(e.target.value)}
                        className="w-full appearance-none p-2.5 pr-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-xs text-slate-800 dark:text-white cursor-pointer font-mono font-bold text-center"
                      >
                        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                          <option key={h} value={h} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            {h} ч
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={betCloseMinute}
                        onChange={(e) => setBetCloseMinute(e.target.value)}
                        className="w-full appearance-none p-2.5 pr-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-xs text-slate-800 dark:text-white cursor-pointer font-mono font-bold text-center"
                      >
                        {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')).map(m => (
                          <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                            {m} м
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Banner in 24h Russian format */}
                {betCloseDate && (
                  <div className="mt-2.5 p-2.5 bg-orange-50/80 dark:bg-slate-900/60 rounded-xl border border-orange-200/50 dark:border-slate-800 text-xs flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-orange-500 shrink-0" />
                      <span className="font-semibold capitalize">
                        {(() => {
                          try {
                            const d = new Date(`${betCloseDate}T${betCloseHour}:${betCloseMinute}:00`);
                            if (isNaN(d.getTime())) return '';
                            return d.toLocaleDateString('ru-RU', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            }) + `, ${betCloseHour}:${betCloseMinute}`;
                          } catch (e) {
                            return '';
                          }
                        })()}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/40 dark:border-orange-800/40">
                      24ч
                    </span>
                  </div>
                )}
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
                  <div className="relative">
                    <input
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="2000"
                      min="1"
                      className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      FC
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Доход в час</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={itemProfit}
                      onChange={(e) => setItemProfit(e.target.value)}
                      placeholder="150"
                      min="1"
                      className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-500 pointer-events-none">
                      +/ч
                    </span>
                  </div>
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
                      <div className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
                        {item.username ? (
                          <a 
                            href={`https://t.me/${item.username.replace(/^@/, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 dark:text-blue-400 hover:underline inline-flex items-center"
                            title="Написать пользователю в Telegram"
                          >
                            <span>@{item.username.replace(/^@/, '')}</span>
                          </a>
                        ) : (
                          <span>ID: {item.user_id}</span>
                        )}
                        {item.first_name && item.first_name !== item.username && (
                          <span className="text-xs text-slate-400 font-medium">({item.first_name})</span>
                        )}
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

                    <button
                      onClick={() => handleDeleteFeedback(item.id)}
                      disabled={loading}
                      className="py-1.5 px-2.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 transition flex items-center gap-1"
                      title="Удалить отзыв"
                    >
                      <Trash2 size={12} />
                      <span>Удалить</span>
                    </button>
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
          {/* Header & Banner Settings Accordion */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm">
            <button
              type="button"
              onClick={() => setShowBannerConfig(!showBannerConfig)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <FileText size={16} className="text-orange-500" />
                Вступительный текст и баннер страницы
              </span>
              <span className="text-orange-500">{showBannerConfig ? 'Скрыть' : 'Настроить'}</span>
            </button>

            {showBannerConfig && (
              <form onSubmit={handleSaveHeaderSettings} className="flex flex-col gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                {/* Keyboard Layout Helper Bar */}
                <div className="flex items-center justify-between p-2.5 bg-orange-50 dark:bg-slate-900/60 rounded-xl border border-orange-200/50 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Languages size={15} className="text-orange-500 shrink-0" />
                    <span className="text-[11px] font-medium">Баг Telegram Desktop с раскладкой?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForceRuLayout(!forceRuLayout)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      forceRuLayout 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>Авто-RU: {forceRuLayout ? 'ВКЛ' : 'ВЫКЛ'}</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-400">Главный заголовок</label>
                    {headerTitle && (
                      <button
                        type="button"
                        onClick={() => setHeaderTitle(convertLayout(headerTitle))}
                        className="text-[10px] font-bold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded transition border border-orange-200/40 dark:border-orange-800/40"
                        title="Исправить раскладку (RU ⇄ EN)"
                      >
                        RU ⇄ EN
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={headerTitle}
                    onChange={handleFieldChange(setHeaderTitle)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-400">Подзаголовок</label>
                    {headerSubtitle && (
                      <button
                        type="button"
                        onClick={() => setHeaderSubtitle(convertLayout(headerSubtitle))}
                        className="text-[10px] font-bold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded transition border border-orange-200/40 dark:border-orange-800/40"
                        title="Исправить раскладку (RU ⇄ EN)"
                      >
                        RU ⇄ EN
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={headerSubtitle}
                    onChange={handleFieldChange(setHeaderSubtitle)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-400">Текст баннера / Объявление (опционально)</label>
                    {headerBanner && (
                      <button
                        type="button"
                        onClick={() => setHeaderBanner(convertLayout(headerBanner))}
                        className="text-[10px] font-bold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded transition border border-orange-200/40 dark:border-orange-800/40"
                        title="Исправить раскладку (RU ⇄ EN)"
                      >
                        RU ⇄ EN
                      </button>
                    )}
                  </div>
                  <textarea
                    value={headerBanner}
                    onChange={handleFieldChange(setHeaderBanner)}
                    placeholder="Например: Итоги опроса подводим в пятницу!"
                    rows={2}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
                >
                  Сохранить вступительный текст
                </button>
              </form>
            )}
          </div>

          {/* Create / Edit News Form */}
          <div className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border transition-all shadow-sm ${
            editingNewsId ? 'border-2 border-orange-500 ring-4 ring-orange-500/10' : 'border-slate-100 dark:border-slate-700/80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                {editingNewsId ? <Edit3 size={16} className="text-orange-500" /> : <Plus size={16} className="text-orange-500" />}
                {editingNewsId ? `Редактирование новости #${editingNewsId}` : 'Опубликовать новость / опрос'}
              </h3>
              {editingNewsId && (
                <button
                  type="button"
                  onClick={handleCancelEditNews}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition"
                >
                  <XCircle size={14} />
                  Отмена
                </button>
              )}
            </div>

            <form onSubmit={handleSaveNews} className="flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400">Заголовок</label>
                  {newsTitle && (
                    <button
                      type="button"
                      onClick={() => setNewsTitle(convertLayout(newsTitle))}
                      className="text-[10px] font-bold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded transition border border-orange-200/40 dark:border-orange-800/40"
                      title="Исправить раскладку (RU ⇄ EN)"
                    >
                      RU ⇄ EN
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={newsTitle}
                  onChange={handleFieldChange(setNewsTitle)}
                  placeholder="Например: Добавим клановые войны?"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400">Описание и детали</label>
                  {newsContent && (
                    <button
                      type="button"
                      onClick={() => setNewsContent(convertLayout(newsContent))}
                      className="text-[10px] font-bold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded transition border border-orange-200/40 dark:border-orange-800/40"
                      title="Исправить раскладку (RU ⇄ EN)"
                    >
                      RU ⇄ EN
                    </button>
                  )}
                </div>
                <textarea
                  value={newsContent}
                  onChange={handleFieldChange(setNewsContent)}
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

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Статус голосования</label>
                <div className="relative">
                  <select
                    value={newsStatus}
                    onChange={(e) => setNewsStatus(e.target.value)}
                    className="w-full appearance-none p-3 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="open" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Открытое голосование</option>
                    <option value="in_progress" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">В разработке (принято)</option>
                    <option value="implemented" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Реализовано (в игре)</option>
                    <option value="rejected" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Отклонено</option>
                    <option value="closed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Голосование закрыто</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {newsStatus !== 'open' && (
                <div className="flex flex-col gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Краткий вердикт</label>
                      {newsVerdict && (
                        <button
                          type="button"
                          onClick={() => setNewsVerdict(convertLayout(newsVerdict))}
                          className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded transition"
                          title="Исправить раскладку (RU ⇄ EN)"
                        >
                          RU ⇄ EN
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={newsVerdict}
                      onChange={handleFieldChange(setNewsVerdict)}
                      placeholder="Принято в спринт #2"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs outline-none text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Комментарий администрации</label>
                      {newsVerdictNote && (
                        <button
                          type="button"
                          onClick={() => setNewsVerdictNote(convertLayout(newsVerdictNote))}
                          className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded transition"
                          title="Исправить раскладку (RU ⇄ EN)"
                        >
                          RU ⇄ EN
                        </button>
                      )}
                    </div>
                    <textarea
                      value={newsVerdictNote}
                      onChange={handleFieldChange(setNewsVerdictNote)}
                      placeholder="Подробности реализации или причина закрытия..."
                      rows={2}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs outline-none text-slate-800 dark:text-white resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all disabled:opacity-50 text-xs"
                >
                  {loading ? 'Сохранение...' : editingNewsId ? 'Сохранить изменения' : 'Опубликовать для голосования'}
                </button>
                {editingNewsId && (
                  <button
                    type="button"
                    onClick={handleCancelEditNews}
                    className="py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List of News */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider px-1">
              Опубликованные новости и опросы ({adminNews.length})
            </h4>

            {adminNews.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {new Date(item.created_at).toLocaleDateString('ru-RU')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 border-blue-200/50' :
                      item.status === 'implemented' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border-emerald-200/50' :
                      item.status === 'rejected' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-200/50' :
                      item.status === 'closed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' :
                      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border-emerald-200/50'
                    }`}>
                      {item.status === 'in_progress' ? 'В разработке' :
                       item.status === 'implemented' ? 'Реализовано' :
                       item.status === 'rejected' ? 'Отклонено' :
                       item.status === 'closed' ? 'Завершено' : 'Открыто'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEditNews(item)}
                      disabled={loading}
                      className="text-orange-500 hover:text-orange-700 p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 transition flex items-center gap-1 text-xs font-bold"
                      title="Редактировать новость"
                    >
                      <Edit3 size={15} />
                      <span>Изменить</span>
                    </button>
                    <button
                      onClick={() => handleDeleteNews(item.id)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title="Удалить опрос"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="font-bold text-sm text-slate-800 dark:text-white">
                  {item.title}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.content}
                </p>

                {item.verdict && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/50">
                    <span className="font-bold">Итог: </span>{item.verdict}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-emerald-600 font-bold">
                      <ThumbsUp size={13} />
                      <span>{item.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1 text-rose-600 font-bold">
                      <ThumbsDown size={13} />
                      <span>{item.dislikes_count}</span>
                    </div>
                  </div>

                  {/* Quick status actions */}
                  <div className="flex items-center gap-1 text-[10px]">
                    {item.status === 'open' ? (
                      <button
                        onClick={() => handleQuickStatusChange(item.id, 'closed', 'Голосование завершено')}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200"
                      >
                        Закрыть опрос
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickStatusChange(item.id, 'open', null, null)}
                        className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-semibold hover:bg-emerald-100"
                      >
                        Открыть заново
                      </button>
                    )}
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

      {/* === ROLES TAB (SUPERADMIN ONLY) === */}
      {activeTab === 'roles' && isSuperAdmin && (
        <div className="flex flex-col gap-5">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-slate-900/40 p-4 rounded-2xl border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Crown size={18} className="text-amber-400" />
              <h3 className="font-black text-sm text-purple-200 dark:text-purple-100">
                Управление доступом и ролями
              </h3>
            </div>
            <p className="text-xs text-purple-300/80 leading-relaxed">
              Только суперадминистратор может назначать администраторов и других суперадминов.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => {
                const val = e.target.value;
                setUserSearch(val);
                fetchUsers(val);
              }}
              placeholder="Поиск по нику, @username или Telegram ID..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm dark:text-white"
            />
            {userSearch && (
              <button
                onClick={() => {
                  setUserSearch('');
                  fetchUsers('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Users List */}
          <div className="flex flex-col gap-3">
            {loadingUsers && (
              <div className="flex items-center justify-center py-10 text-xs text-slate-400">
                <RefreshCw size={16} className="animate-spin mr-2 text-purple-500" />
                Загрузка списка пользователей...
              </div>
            )}

            {!loadingUsers && usersList.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs font-medium bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                Пользователи не найдены
              </div>
            )}

            {!loadingUsers && usersList.map((u) => {
              const isCurrentUser = u.tg_id === user?.tg_id;
              const isUpdating = roleUpdatingId === u.tg_id;

              return (
                <div 
                  key={u.tg_id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border transition-all shadow-sm ${
                    u.role === 'superadmin'
                      ? 'border-purple-200 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/10'
                      : u.role === 'admin'
                      ? 'border-orange-200 dark:border-orange-900/50'
                      : 'border-slate-100 dark:border-slate-700/70'
                  }`}
                >
                  {/* User info row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-200 shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (u.username || u.first_name || 'U').slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-800 dark:text-white truncate">
                            {u.custom_name || u.first_name || u.username || 'Пользователь'}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              Вы
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {u.username && <span>@{u.username}</span>}
                          <span className="font-mono text-[11px]">ID: {u.tg_id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Current role badge */}
                    <div className="shrink-0">
                      {u.role === 'superadmin' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                          <Crown size={10} className="text-amber-500" />
                          Суперадмин
                        </span>
                      ) : u.role === 'admin' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                          <Shield size={10} className="text-orange-500" />
                          Админ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          Студент
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Switcher Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Назначить:</span>
                    
                    <button
                      onClick={() => handleRoleChange(u, 'user')}
                      disabled={isCurrentUser || isUpdating || u.role === 'user'}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                        u.role === 'user'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-default'
                          : isCurrentUser
                          ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Студент
                    </button>

                    <button
                      onClick={() => handleRoleChange(u, 'admin')}
                      disabled={isCurrentUser || isUpdating || u.role === 'admin'}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                        u.role === 'admin'
                          ? 'bg-orange-500 text-white cursor-default shadow-sm'
                          : isCurrentUser
                          ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/40 hover:bg-orange-100'
                      }`}
                    >
                      Админ
                    </button>

                    <button
                      onClick={() => handleRoleChange(u, 'superadmin')}
                      disabled={isCurrentUser || isUpdating || u.role === 'superadmin'}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                        u.role === 'superadmin'
                          ? 'bg-purple-600 text-white cursor-default shadow-sm'
                          : isCurrentUser
                          ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40 hover:bg-purple-100'
                      }`}
                    >
                      Суперадмин
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TmaAdmin;

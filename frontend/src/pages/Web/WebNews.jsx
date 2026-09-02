import React, { useState, useEffect } from 'react';
import { NewsService } from '../../api/services/NewsService';
import { useUser } from '../../context/UserContext';
import { 
  ThumbsUp, ThumbsDown, Calendar, Sparkles, Plus, Edit3, Trash2, X, 
  Lock, CheckCircle, Clock, XCircle, FileText, Check, Shield, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WebNews = () => {
  const { user } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState(null);

  // Header Rich Text State
  const [headerContent, setHeaderContent] = useState({
    title: 'Новости и Идеи Развития',
    subtitle: 'Узнавайте первыми о новых фичах факультетской игры и голосуйте за идеи, которые хотите увидеть в следующем релизе!',
    banner: ''
  });
  const [headerEditorOpen, setHeaderEditorOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerSubtitle, setHeaderSubtitle] = useState('');
  const [headerBanner, setHeaderBanner] = useState('');
  const [savingHeader, setSavingHeader] = useState(false);

  // News Item Modal Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formStatus, setFormStatus] = useState('open');
  const [saving, setSaving] = useState(false);

  // Poll Close/Resolve Modal State
  const [resolverOpen, setResolverOpen] = useState(false);
  const [resolvingItem, setResolvingItem] = useState(null);
  const [resolveStatus, setResolveStatus] = useState('in_progress');
  const [resolveVerdict, setResolveVerdict] = useState('');
  const [resolveNote, setResolveNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchNewsAndHeader = async () => {
    try {
      setLoading(true);
      const [newsRes, headerRes] = await Promise.all([
        NewsService.getNews(),
        NewsService.getNewsHeader().catch(() => null)
      ]);
      setNews(newsRes.data || []);
      if (headerRes?.data) {
        setHeaderContent(headerRes.data);
      }
    } catch (err) {
      console.error('Failed to load news', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewsAndHeader();
  }, []);

  // Header edit handlers
  const handleOpenHeaderEditor = () => {
    setHeaderTitle(headerContent.title);
    setHeaderSubtitle(headerContent.subtitle);
    setHeaderBanner(headerContent.banner || '');
    setHeaderEditorOpen(true);
  };

  const handleSaveHeader = async (e) => {
    e.preventDefault();
    setSavingHeader(true);
    try {
      await NewsService.updateNewsHeader({
        title: headerTitle.trim(),
        subtitle: headerSubtitle.trim(),
        banner: headerBanner.trim()
      });
      setHeaderContent({
        title: headerTitle.trim(),
        subtitle: headerSubtitle.trim(),
        banner: headerBanner.trim()
      });
      setHeaderEditorOpen(false);
    } catch (err) {
      alert('Ошибка при сохранении шапки');
    } finally {
      setSavingHeader(false);
    }
  };

  // News create/edit handlers
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setFormImage('');
    setFormStatus('open');
    setEditorOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormImage(item.image_url || '');
    setFormStatus(item.status || 'open');
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingItem(null);
  };

  const handleSaveNews = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setSaving(true);
    try {
      if (editingItem) {
        await NewsService.updateNews({
          id: editingItem.id,
          title: formTitle.trim(),
          content: formContent.trim(),
          image_url: formImage.trim() || null,
          status: formStatus,
          verdict: editingItem.verdict || null,
          verdict_note: editingItem.verdict_note || null
        });
      } else {
        await NewsService.createNews({
          title: formTitle.trim(),
          content: formContent.trim(),
          image_url: formImage.trim() || null,
          status: formStatus
        });
      }
      handleCloseEditor();
      fetchNewsAndHeader();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при сохранении новости');
    } finally {
      setSaving(false);
    }
  };

  // Poll Close/Resolve handlers
  const handleOpenResolver = (item) => {
    setResolvingItem(item);
    setResolveStatus(item.status === 'open' ? 'in_progress' : item.status);
    setResolveVerdict(item.verdict || '');
    setResolveNote(item.verdict_note || '');
    setResolverOpen(true);
  };

  const handleCloseResolver = () => {
    setResolverOpen(false);
    setResolvingItem(null);
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!resolvingItem) return;

    setResolving(true);
    try {
      await NewsService.closePoll({
        id: resolvingItem.id,
        status: resolveStatus,
        verdict: resolveVerdict.trim() || null,
        verdict_note: resolveNote.trim() || null
      });
      handleCloseResolver();
      fetchNewsAndHeader();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при закрытии опроса');
    } finally {
      setResolving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Точно удалить эту новость / опрос?')) return;
    try {
      await NewsService.deleteNews(id);
      setNews(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const handleVote = async (newsItem, voteType) => {
    if (newsItem.status && newsItem.status !== 'open') {
      alert('Голосование по этому предложению уже завершено');
      return;
    }

    const newsId = newsItem.id;
    // Optimistic UI update
    setNews(prev => prev.map(item => {
      if (item.id !== newsId) return item;

      let likes = item.likes_count;
      let dislikes = item.dislikes_count;
      let userVote = item.user_vote;

      if (userVote === voteType) {
        if (voteType === 'like') likes = Math.max(0, likes - 1);
        else dislikes = Math.max(0, dislikes - 1);
        userVote = null;
      } else if (userVote) {
        if (voteType === 'like') {
          likes += 1;
          dislikes = Math.max(0, dislikes - 1);
        } else {
          dislikes += 1;
          likes = Math.max(0, likes - 1);
        }
        userVote = voteType;
      } else {
        if (voteType === 'like') likes += 1;
        else dislikes += 1;
        userVote = voteType;
      }

      return {
        ...item,
        likes_count: likes,
        dislikes_count: dislikes,
        user_vote: userVote
      };
    }));

    setVotingId(newsId);
    try {
      const res = await NewsService.voteNews(newsId, voteType);
      if (res.data && res.data.status === 'ok') {
        setNews(prev => prev.map(item => {
          if (item.id !== newsId) return item;
          return {
            ...item,
            likes_count: res.data.likes_count,
            dislikes_count: res.data.dislikes_count,
            user_vote: res.data.user_vote
          };
        }));
      }
    } catch (err) {
      alert(err.response?.data || 'Ошибка при голосовании');
      fetchNewsAndHeader();
    } finally {
      setVotingId(null);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock size={12} />
            В разработке
          </span>
        );
      case 'implemented':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle size={12} />
            Реализовано
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle size={12} />
            Отклонено
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Lock size={12} />
            Опрос завершён
          </span>
        );
      case 'open':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Открытое голосование
          </span>
        );
    }
  };

  return (
    <div className="font-sans py-12 px-5 max-w-[900px] mx-auto w-full">
      {/* Page Header (Editable by Admin) */}
      <div className="text-center mb-10 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-500 text-xs font-bold mb-3 border border-orange-200/50 dark:border-orange-800/40">
          <Sparkles size={14} />
          <span>Планы и обновления</span>
        </div>

        <h1 className="text-4xl sm:text-5xl tracking-tight font-black text-slate-800 dark:text-white mb-3">
          {headerContent.title}
        </h1>

        <p className="text-slate-600 dark:text-slate-300 text-base max-w-[650px] mx-auto leading-relaxed">
          {headerContent.subtitle}
        </p>

        {/* Optional Rich Text Announcement Banner */}
        {headerContent.banner && (
          <div className="mt-6 p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/20 rounded-2xl text-left max-w-[750px] mx-auto">
            <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>Важное объявление</span>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {headerContent.banner}
            </div>
          </div>
        )}

        {/* Admin Header & Create Actions */}
        {isAdmin && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={18} />
              <span>Создать новость / опрос</span>
            </button>
            <button
              onClick={handleOpenHeaderEditor}
              className="inline-flex items-center gap-2 py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-sm border border-slate-200 dark:border-slate-700 transition"
            >
              <FileText size={16} className="text-orange-500" />
              <span>Изменить текст в начале</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-xl text-slate-400 py-24 animate-pulse font-medium">
          Загрузка новостей и опросов...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {news.map((item, index) => {
            const totalVotes = item.likes_count + item.dislikes_count;
            const likePercent = totalVotes > 0 ? Math.round((item.likes_count / totalVotes) * 100) : 50;
            const isClosed = item.status && item.status !== 'open';

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-7 border transition-shadow shadow-sm hover:shadow-md ${
                  isClosed ? 'border-slate-200 dark:border-slate-700/60' : 'border-slate-100 dark:border-slate-700/80'
                }`}
              >
                {/* Meta header: Date, Status, Admin actions */}
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    {renderStatusBadge(item.status)}
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1">
                      <Calendar size={13} className="text-orange-500" />
                      {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenResolver(item)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition flex items-center gap-1 text-xs font-bold border border-blue-200/50 dark:border-blue-800/40"
                        title="Подвести итоги или закрыть голосование"
                      >
                        <Shield size={13} />
                        <span>Итоги / Статус</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition flex items-center gap-1 text-xs font-bold"
                        title="Редактировать текст новости"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Удалить опрос"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
                  {item.title}
                </h2>

                {/* Optional Image */}
                {item.image_url && (
                  <div className="mb-4 rounded-2xl overflow-hidden max-h-80 border border-slate-100 dark:border-slate-700/60">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Content */}
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line mb-5 font-normal">
                  {item.content}
                </p>

                {/* Admin Verdict & Note callout (if resolved) */}
                {(item.verdict || item.verdict_note) && (
                  <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                      <Shield size={14} />
                      <span>Решение администрации: {item.verdict || 'Голосование завершено'}</span>
                    </div>
                    {item.verdict_note && (
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed m-0 font-medium">
                        {item.verdict_note}
                      </p>
                    )}
                  </div>
                )}

                {/* Voting & Reaction Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Buttons */}
                  <div className="flex items-center gap-3">
                    {/* Like Button */}
                    <button
                      onClick={() => handleVote(item, 'like')}
                      disabled={votingId === item.id || isClosed}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
                        item.user_vote === 'like'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-[0_2px_10px_rgba(16,185,129,0.3)]'
                          : isClosed
                          ? 'bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-80'
                          : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 hover:border-emerald-300'
                      }`}
                    >
                      <ThumbsUp size={15} className={item.user_vote === 'like' ? 'fill-white' : ''} />
                      <span>Нравится</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                        item.user_vote === 'like'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {item.likes_count}
                      </span>
                    </button>

                    {/* Dislike Button */}
                    <button
                      onClick={() => handleVote(item, 'dislike')}
                      disabled={votingId === item.id || isClosed}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
                        item.user_vote === 'dislike'
                          ? 'bg-rose-500 text-white border-rose-600 shadow-[0_2px_10px_rgba(244,63,94,0.3)]'
                          : isClosed
                          ? 'bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-80'
                          : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 hover:border-rose-300'
                      }`}
                    >
                      <ThumbsDown size={15} className={item.user_vote === 'dislike' ? 'fill-white' : ''} />
                      <span>Не нравится</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                        item.user_vote === 'dislike'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {item.dislikes_count}
                      </span>
                    </button>

                    {isClosed && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium ml-1">
                        <Lock size={12} />
                        Опрос закрыт
                      </span>
                    )}
                  </div>

                  {/* Sentiment Bar */}
                  {totalVotes > 0 && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-400">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{likePercent}%</span>
                      <div className="w-24 h-2 bg-rose-200 dark:bg-rose-950/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${likePercent}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">{totalVotes} голосов</span>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}

          {news.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 text-slate-400 text-sm font-medium">
              Пока нет опубликованных новостей и опросов. Скоро здесь появятся первые идеи развития!
            </div>
          )}
        </div>
      )}

      {/* Admin News Modal Editor */}
      <AnimatePresence>
        {editorOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 w-full max-w-[600px] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                  {editingItem ? 'Редактировать новость / опрос' : 'Новый опрос / идея развития'}
                </h3>
                <button
                  onClick={handleCloseEditor}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveNews} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Заголовок
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Например: Добавим клановые войны?"
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Описание и подробности
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Подробно расскажите о планируемом функционале..."
                    rows={5}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    URL изображения (опционально)
                  </label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="https://... или /image.png"
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Статус опроса
                  </label>
                  <div className="relative">
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full appearance-none p-3.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white cursor-pointer"
                    >
                      <option value="open" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Открытое голосование</option>
                      <option value="in_progress" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">В разработке</option>
                      <option value="implemented" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Реализовано</option>
                      <option value="rejected" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Отклонено</option>
                      <option value="closed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Голосование закрыто</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCloseEditor}
                    className="py-3 px-5 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-7 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all disabled:opacity-50"
                  >
                    {saving ? 'Сохранение...' : editingItem ? 'Сохранить изменения' : 'Опубликовать опрос'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Close / Resolve Poll Modal (similar to totalizator) */}
      <AnimatePresence>
        {resolverOpen && resolvingItem && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 w-full max-w-[540px] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Shield size={20} className="text-orange-500" />
                  Управление опросом
                </h3>
                <button
                  onClick={handleCloseResolver}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="font-bold text-slate-400 block mb-0.5">Опрос:</span>
                <span className="font-bold text-slate-800 dark:text-white text-sm">{resolvingItem.title}</span>
                <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                  <span className="text-emerald-500">Лайков: {resolvingItem.likes_count}</span>
                  <span className="text-rose-500">Дизлайков: {resolvingItem.dislikes_count}</span>
                </div>
              </div>

              <form onSubmit={handleSaveResolution} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Статус решения
                  </label>
                  <div className="relative">
                    <select
                      value={resolveStatus}
                      onChange={(e) => setResolveStatus(e.target.value)}
                      className="w-full appearance-none p-3.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white cursor-pointer"
                    >
                      <option value="in_progress" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">В разработке (принято)</option>
                      <option value="implemented" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Реализовано (в игре)</option>
                      <option value="rejected" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Отклонено</option>
                      <option value="closed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Голосование закрыто</option>
                      <option value="open" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">Открыть голосование заново</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Краткий вердикт
                  </label>
                  <input
                    type="text"
                    value={resolveVerdict}
                    onChange={(e) => setResolveVerdict(e.target.value)}
                    placeholder="Например: Принято в спринт #4 или Одобрено студентами"
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Комментарий разработчиков / администрации
                  </label>
                  <textarea
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="Опишите детали решения, сроки реализации или причину отказа..."
                    rows={3}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-3">
                  <button
                    type="button"
                    onClick={handleCloseResolver}
                    className="py-3 px-5 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={resolving}
                    className="py-3 px-7 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all disabled:opacity-50"
                  >
                    {resolving ? 'Сохранение...' : 'Применить решение'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Header Rich Text Editor Modal */}
      <AnimatePresence>
        {headerEditorOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 w-full max-w-[620px] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText size={20} className="text-orange-500" />
                  Редактирование вступления и баннера
                </h3>
                <button
                  onClick={() => setHeaderEditorOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveHeader} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Главный заголовок
                  </label>
                  <input
                    type="text"
                    value={headerTitle}
                    onChange={(e) => setHeaderTitle(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Подзаголовок страницы
                  </label>
                  <textarea
                    value={headerSubtitle}
                    onChange={(e) => setHeaderSubtitle(e.target.value)}
                    rows={2}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Рич-текст баннера / важное объявление (опционально)
                  </label>
                  <textarea
                    value={headerBanner}
                    onChange={(e) => setHeaderBanner(e.target.value)}
                    placeholder="Например: В пятницу в 18:00 подводим итоги голосования за кланы и раздаём бусты!"
                    rows={4}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white resize-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Если оставить пустым, блок баннера отображаться не будет.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setHeaderEditorOpen(false)}
                    className="py-3 px-5 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={savingHeader}
                    className="py-3 px-7 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all disabled:opacity-50"
                  >
                    {savingHeader ? 'Сохранение...' : 'Сохранить шапку'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WebNews;

import React, { useState, useEffect } from 'react';
import { NewsService } from '../../api/services/NewsService';
import { useUser } from '../../context/UserContext';
import { ThumbsUp, ThumbsDown, Calendar, Sparkles, Plus, Edit3, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WebNews = () => {
  const { user } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState(null);

  // Modal Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImage, setFormImage] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await NewsService.getNews();
      setNews(res.data || []);
    } catch (err) {
      console.error('Failed to load news', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setFormImage('');
    setEditorOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormImage(item.image_url || '');
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setSaving(true);
    try {
      if (editingItem) {
        await NewsService.updateNews({
          id: editingItem.id,
          title: formTitle.trim(),
          content: formContent.trim(),
          image_url: formImage.trim() || null
        });
      } else {
        await NewsService.createNews({
          title: formTitle.trim(),
          content: formContent.trim(),
          image_url: formImage.trim() || null
        });
      }
      handleCloseEditor();
      fetchNews();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при сохранении новости');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Точно удалить эту новость / идею?')) return;
    try {
      await NewsService.deleteNews(id);
      setNews(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('Ошибка при удалении новости');
    }
  };

  const handleVote = async (newsId, voteType) => {
    // Optimistic UI update
    setNews(prev => prev.map(item => {
      if (item.id !== newsId) return item;

      let likes = item.likes_count;
      let dislikes = item.dislikes_count;
      let userVote = item.user_vote;

      if (userVote === voteType) {
        // Unvote
        if (voteType === 'like') likes = Math.max(0, likes - 1);
        else dislikes = Math.max(0, dislikes - 1);
        userVote = null;
      } else if (userVote) {
        // Switch vote
        if (voteType === 'like') {
          likes += 1;
          dislikes = Math.max(0, dislikes - 1);
        } else {
          dislikes += 1;
          likes = Math.max(0, likes - 1);
        }
        userVote = voteType;
      } else {
        // New vote
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
      console.error('Failed to vote', err);
      fetchNews();
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="font-sans py-12 px-5 max-w-[900px] mx-auto w-full">
      {/* Page Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-500 text-xs font-bold mb-3 border border-orange-200/50 dark:border-orange-800/40">
          <Sparkles size={14} />
          <span>Планы и обновления</span>
        </div>
        <h1 className="text-4xl sm:text-5xl tracking-tight font-black text-slate-800 dark:text-white mb-3">
          Новости и <span className="text-orange-500">Идеи Развития</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-[600px] mx-auto">
          Узнавайте первыми о новых фичах факультетской игры и голосуйте за идеи, которые хотите увидеть в следующем релизе!
        </p>

        {/* Admin Action Button */}
        {isAdmin && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={18} />
              <span>Опубликовать новость / идею</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-xl text-slate-400 py-24 animate-pulse font-medium">
          Загрузка новостей...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {news.map((item, index) => {
            const totalVotes = item.likes_count + item.dislikes_count;
            const likePercent = totalVotes > 0 ? Math.round((item.likes_count / totalVotes) * 100) : 50;

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow relative"
              >
                {/* Meta header with Admin Actions */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    <Calendar size={13} className="text-orange-500" />
                    <span>{new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>•</span>
                    <span className="text-orange-500">Разработка FAMCS</span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition flex items-center gap-1 text-xs font-bold"
                        title="Редактировать новость"
                      >
                        <Edit3 size={15} />
                        <span className="hidden sm:inline">Изменить</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Удалить новость"
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
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line mb-6 font-normal">
                  {item.content}
                </p>

                {/* Voting & Reaction Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Buttons */}
                  <div className="flex items-center gap-3">
                    {/* Like Button */}
                    <button
                      onClick={() => handleVote(item.id, 'like')}
                      disabled={votingId === item.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
                        item.user_vote === 'like'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-[0_2px_10px_rgba(16,185,129,0.3)]'
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
                      onClick={() => handleVote(item.id, 'dislike')}
                      disabled={votingId === item.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
                        item.user_vote === 'dislike'
                          ? 'bg-rose-500 text-white border-rose-600 shadow-[0_2px_10px_rgba(244,63,94,0.3)]'
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
              Пока нет опубликованных новостей и планов. Скоро здесь появятся первые идеи развития!
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
                  {editingItem ? 'Редактировать новость' : 'Новая новость / идея развития'}
                </h3>
                <button
                  onClick={handleCloseEditor}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Заголовок
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Например: Новые клановые задания"
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
                    {saving ? 'Сохранение...' : editingItem ? 'Сохранить изменения' : 'Опубликовать'}
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

import React, { useState, useEffect } from 'react';
import { NewsService } from '../../api/services/NewsService';
import { ThumbsUp, ThumbsDown, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const WebNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState(null);

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
      // Revert on error
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
        <h1 className="text-5xl tracking-tight font-black text-slate-800 dark:text-white mb-3">
          Новости и <span className="text-orange-500">Идеи Развития</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-[600px] mx-auto">
          Узнавайте первыми о новых фичах факультетской игры и голосуйте за идеи, которые хотите увидеть в следующем релизе!
        </p>
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
                className="bg-white dark:bg-slate-800 rounded-3xl p-7 border border-slate-100 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Meta header */}
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-3 font-semibold">
                  <Calendar size={13} className="text-orange-500" />
                  <span>{new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>•</span>
                  <span className="text-orange-500">Разработка FAMCS</span>
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
    </div>
  );
};

export default WebNews;

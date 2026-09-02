import { useState, useEffect } from 'react';
import { FeedbackService } from '../../api/services/FeedbackService';
import { NewsService } from '../../api/services/NewsService';
import { ThumbsUp, ThumbsDown, Sparkles, Calendar, CheckCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const Feedback = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // News / Ideas voting state
  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [votingId, setVotingId] = useState(null);

  const fetchNews = async () => {
    try {
      setLoadingNews(true);
      const res = await NewsService.getNews();
      setNews(res.data || []);
    } catch (err) {
      console.error("Failed to load news/ideas", err);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      await FeedbackService.submitFeedback(message);
      setSentSuccess(true);
      setMessage("");
      setTimeout(() => setSentSuccess(false), 4000);
    } catch (err) {
      alert("Ошибка при отправке отзыва");
    } finally {
      setLoading(false);
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
      console.error("Failed to vote", err);
      fetchNews();
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="flex flex-col p-5 pb-28">
      {/* Header */}
      <h2 className="text-3xl font-black mb-1 text-slate-800 dark:text-white drop-shadow-sm flex items-center gap-2">
        <img src="/icon_feedback.png" alt="Идеи" className="w-8 h-8" /> Идеи и предложения
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs font-medium">
        Предложите свою идею для игры или расскажите о баге разработчикам!
      </p>

      {/* Feedback Submission Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/80 mb-8">
        {sentSuccess && (
          <div className="p-3.5 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            <CheckCircle size={16} />
            Спасибо! Ваша идея передана разработчикам.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Опишите вашу идею или найденную ошибку..."
            rows={4}
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 resize-none text-xs text-slate-800 dark:text-slate-100"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
          >
            <Send size={14} />
            {loading ? "Отправка..." : "Отправить разработчикам"}
          </button>
        </form>
      </div>

      {/* News & Development Ideas Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-orange-500" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              Планы развития и голосование
            </h3>
          </div>
          <span className="text-[11px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-200/50 dark:border-orange-800/40">
            {news.length}
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs -mt-2 font-medium">
          Голосуйте за фичи и обновления, которые хотите увидеть в игре:
        </p>

        {loadingNews ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium">
            Загрузка планов развития...
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {news.map((item) => {
              const totalVotes = item.likes_count + item.dislikes_count;
              const likePercent = totalVotes > 0 ? Math.round((item.likes_count / totalVotes) * 100) : 50;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                    <Calendar size={12} className="text-orange-500" />
                    <span>{new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>

                  <h4 className="font-bold text-base text-slate-800 dark:text-white leading-snug">
                    {item.title}
                  </h4>

                  {item.image_url && (
                    <div className="rounded-xl overflow-hidden max-h-48 border border-slate-100 dark:border-slate-700">
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {item.content}
                  </p>

                  {/* Voting Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Like */}
                      <button
                        onClick={() => handleVote(item.id, 'like')}
                        disabled={votingId === item.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                          item.user_vote === 'like'
                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        <ThumbsUp size={13} className={item.user_vote === 'like' ? 'fill-white' : ''} />
                        <span>{item.likes_count}</span>
                      </button>

                      {/* Dislike */}
                      <button
                        onClick={() => handleVote(item.id, 'dislike')}
                        disabled={votingId === item.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                          item.user_vote === 'dislike'
                            ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        }`}
                      >
                        <ThumbsDown size={13} className={item.user_vote === 'dislike' ? 'fill-white' : ''} />
                        <span>{item.dislikes_count}</span>
                      </button>
                    </div>

                    {totalVotes > 0 && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                        <span className="text-emerald-500 font-bold">{likePercent}%</span>
                        <div className="w-14 h-1.5 bg-rose-200 dark:bg-rose-950/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${likePercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {news.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs font-medium bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                Скоро здесь появятся первые идеи развития!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;

import { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const WebFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await apiClient.get('/feedback');
        setFeedbacks(res.data || []);
      } catch (err) {
        console.error("Failed to fetch feedback", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  return (
    <div className="font-sans py-10 px-5 max-w-[800px] mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <img src="/icon_feedback.png" alt="Идеи" className="w-10 h-10 object-contain drop-shadow-sm" />
        <h1 className="text-4xl m-0 font-black text-slate-800 dark:text-white">Идеи и Отзывы</h1>
      </div>
      <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg">
        Здесь отображаются последние предложения по улучшению кликера от наших игроков. Оставить свою идею можно внутри Telegram Mini App.
      </p>

      {loading ? (
        <div className="text-center text-slate-500 py-20 text-lg font-medium">Загрузка отзывов...</div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center text-slate-500 py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <p className="text-lg">Отзывов пока нет.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {feedbacks.map((f, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center font-bold">
                  {f.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">@{f.username}</div>
                  <div className="text-xs text-slate-400">{new Date(f.created_at).toLocaleString('ru-RU')}</div>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{f.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebFeedback;

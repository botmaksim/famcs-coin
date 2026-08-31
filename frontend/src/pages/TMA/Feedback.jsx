import { useState } from 'react';
import { FeedbackService } from '../../api/services/FeedbackService';

const Feedback = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      await FeedbackService.submitFeedback(message);
      alert("Отзыв успешно отправлен! Спасибо за обратную связь.");
      setMessage("");
    } catch (err) {
      alert("Ошибка при отправке отзыва");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-5 pb-24 overflow-y-auto">
      <h2 className="text-3xl font-black mb-1 text-slate-800 dark:text-white drop-shadow-sm flex items-center gap-2">
        <span className="text-3xl">💡</span> Идеи
      </h2>
      <p className="text-slate-500 mb-6 text-sm font-medium">Предложи идею для приложения или расскажи о баге напрямую разработчикам!</p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Я хочу предложить..."
            rows={6}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 resize-y text-slate-800 dark:text-slate-100"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all disabled:opacity-50"
          >
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;

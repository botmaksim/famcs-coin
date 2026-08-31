import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { UserService } from '../../api/services/UserService';

const Profile = () => {
  const { user, fetchProfile } = useUser();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [isHidden, setIsHidden] = useState(user?.is_hidden || false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await UserService.updateSettings({
        display_name: displayName,
        is_hidden: isHidden
      });
      await fetchProfile();
      alert("Настройки сохранены!");
    } catch (err) {
      alert("Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-5 pb-24 overflow-y-auto">
      <h2 className="text-3xl font-black mb-6 text-slate-800 dark:text-white drop-shadow-sm flex items-center gap-2">
        <span className="text-3xl">👤</span> Профиль
      </h2>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-3 mb-6">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center text-4xl font-black shadow-inner">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="text-xl font-bold text-slate-800 dark:text-white">
          @{user?.username}
        </div>
        <div className="text-sm font-medium px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400">
          Роль: {user?.role}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Настройки приватности</h3>
        
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Отображаемое имя (Leaderboard)</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Введите имя или ник..."
              className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-slate-100"
            />
            <p className="text-xs text-slate-400 mt-1">Оставьте пустым, чтобы использовать ваш Telegram username.</p>
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={isHidden}
              onChange={(e) => setIsHidden(e.target.checked)}
              className="w-5 h-5 accent-orange-500"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">Анонимный режим</span>
              <span className="text-xs text-slate-500">Скрыть меня из всех публичных лидербордов</span>
            </div>
          </label>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all disabled:opacity-50"
          >
            {loading ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </form>
      </div>

    </div>
  );
};

export default Profile;

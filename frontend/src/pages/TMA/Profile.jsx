import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { UserService } from '../../api/services/UserService';
import { Shield, ScrollText } from 'lucide-react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { TermsModal } from '../../components/TMA/TermsModal';

const Profile = () => {
  const { user, fetchProfile } = useUser();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.display_name || user?.custom_name || "");
  const [isHidden, setIsHidden] = useState(user?.is_hidden || false);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useAutoRefresh(fetchProfile);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.custom_name || "");
      setIsHidden(user.is_hidden || false);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await UserService.updateSettings({
        display_name: displayName,
        is_hidden: isHidden
      });
      await fetchProfile();
      showSuccess("Настройки успешно сохранены!");
    } catch (err) {
      showError("Ошибка при сохранении настроек");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 pb-24 overflow-y-auto max-w-[480px] mx-auto w-full">
      <h2 className="text-2xl font-black mb-4 text-slate-800 dark:text-white">
        Профиль
      </h2>

      <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 shadow-xs border border-slate-100 dark:border-slate-700/60 flex flex-col items-center gap-2 mb-4 text-center">
        <div className="relative">
          <div className="w-18 h-18 bg-gradient-to-tr from-orange-500 to-amber-400 text-white rounded-full flex items-center justify-center text-3xl font-black shadow-md overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              (user?.custom_name || user?.first_name || user?.username || 'U')[0].toUpperCase()
            )}
          </div>
        </div>

        <div className="text-lg font-bold text-slate-800 dark:text-white mt-1">
          {user?.custom_name || user?.first_name || (user?.username ? `@${user.username}` : 'Студент')}
        </div>

        {user?.username && (
          <div className="text-xs font-semibold text-slate-400 -mt-1">
            @{user.username.replace(/^@/, '')}
          </div>
        )}

        <div className="text-[11px] font-bold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
          {user?.role === 'superadmin' ? 'Суперадминистратор' : user?.role === 'admin' ? 'Администратор' : 'Студент'}
        </div>
      </div>

      {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <button
          onClick={() => navigate('/app/admin')}
          className="mb-4 w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-xs flex items-center justify-center gap-2 text-sm active:scale-98 transition cursor-pointer"
        >
          <Shield size={18} />
          Панель администратора
        </button>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Настройки приватности</h3>
        
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Игровой никнейм (в рейтинге)</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Введите никнейм..."
              className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-slate-100"
            />
            <p className="text-xs text-slate-400 mt-1">Оставьте пустым, чтобы отображать имя из Telegram ({user?.first_name || (user?.username ? `@${user.username}` : 'Студент')}).</p>
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
            className="mt-2 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setShowTermsModal(true)}
        className="mt-4 flex items-center justify-between w-full p-4 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-100 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <ScrollText size={16} className="text-orange-500 shrink-0" />
          <span>Публичная оферта и правила</span>
        </div>
        <span className="text-[11px] text-orange-500 dark:text-orange-400 font-bold">Читать</span>
      </button>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        isReadonly={true}
      />

    </div>
  );
};

export default Profile;

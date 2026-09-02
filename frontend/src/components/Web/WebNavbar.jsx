import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TelegramLoginWidget from '../TelegramLoginWidget';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, LogIn, LogOut, Shield, X, Send, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WebNavbar = () => {
  const { user, fetchProfile } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('telegram'); // 'telegram' | 'admin'

  // Admin form state
  const [adminTgId, setAdminTgId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('web_admin_auth');
    localStorage.removeItem('web_user_token');
    localStorage.removeItem('web_tg_user');
    fetchProfile();
    window.location.reload();
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminTgId || !adminPassword) return;

    setAdminLoading(true);
    try {
      const token = `web:${adminTgId.trim()}:${adminPassword.trim()}`;
      localStorage.setItem('web_admin_auth', token);
      await fetchProfile();
      setIsAuthModalOpen(false);
      setAdminPassword('');
      navigate('/admin-panel');
    } catch (err) {
      alert('Ошибка авторизации. Проверьте ID и пароль');
    } finally {
      setAdminLoading(false);
    }
  };

  const isUserAuthenticated = Boolean(
    user?.tg_id || 
    localStorage.getItem('web_admin_auth') || 
    localStorage.getItem('web_user_token')
  );

  return (
    <>
      <nav className="flex justify-between items-center px-6 sm:px-10 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[1000] shadow-sm transition-colors">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <img 
            src="/famcscoin.png" 
            alt="FAMCS" 
            className="w-8 h-8 rounded-full object-contain" 
            onError={(e) => { e.target.src = '/famcscoin.jpg'; }}
          />
          <Link to="/" className="text-xl font-black text-slate-800 dark:text-white no-underline tracking-wide hover:opacity-80 transition-opacity">
            FAMCS
          </Link>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-7">
          <Link to="/info" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium transition-colors text-sm">
            Информация
          </Link>
          <Link to="/leaderboard" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium transition-colors text-sm">
            Рейтинг
          </Link>
          <Link to="/news" className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium transition-colors text-sm">
            Новости
          </Link>
          <a 
            href={`https://t.me/${import.meta.env.VITE_BOT_USERNAME || 'famcs_coin_bot'}/app`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-orange-500 font-bold hover:text-orange-600 transition-colors flex items-center gap-1.5 text-xs bg-orange-50 dark:bg-orange-950/40 px-3.5 py-1.5 rounded-full border border-orange-200/60 dark:border-orange-800/40"
          >
            <Send size={12} />
            <span>Играть в Telegram</span>
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Переключить тему"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isUserAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-800 dark:text-white font-semibold text-xs hidden sm:inline">
                @{user?.username || user?.first_name || 'Админ'}
              </span>

              {(user?.role === 'admin' || user?.role === 'superadmin' || localStorage.getItem('web_admin_auth')) && (
                <Link 
                  to="/admin-panel" 
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  <Shield size={13} />
                  <span>Админка</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Выйти из аккаунта"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <LogIn size={15} />
              <span>Войти</span>
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-800 w-full max-w-[440px] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                  Вход в аккаунт
                </h3>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 mb-5">
                <button
                  onClick={() => setAuthTab('telegram')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authTab === 'telegram'
                      ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Через Telegram
                </button>
                <button
                  onClick={() => setAuthTab('admin')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authTab === 'admin'
                      ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Администратор
                </button>
              </div>

              {/* Tab 1: Telegram Login */}
              {authTab === 'telegram' && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                    Авторизуйтесь через Telegram для синхронизации игрового прогресса и профиля:
                  </p>

                  <div className="w-full flex justify-center py-2">
                    <TelegramLoginWidget 
                      botName="famcs_coin_bot" 
                      onAuth={() => {
                        setIsAuthModalOpen(false);
                        fetchProfile();
                      }} 
                    />
                  </div>

                  <a
                    href={`https://t.me/${import.meta.env.VITE_BOT_USERNAME || 'famcs_coin_bot'}/app`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
                  >
                    <Send size={14} className="text-orange-500" />
                    <span>Открыть бота @famcs_coin_bot</span>
                  </a>

                  {/* Domain hint note */}
                  <div className="w-full p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    <span className="font-bold text-slate-600 dark:text-slate-300 block mb-0.5">Примечание для виджета:</span>
                    Если Telegram пишет <em>"Bot domain invalid"</em>, привяжите домен сайта к <strong>@famcs_coin_bot</strong> в <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-orange-500 underline font-semibold">@BotFather</a> через команду <code>/setdomain</code>.
                  </div>
                </div>
              )}

              {/* Tab 2: Admin Password Login */}
              {authTab === 'admin' && (
                <form onSubmit={handleAdminLogin} className="flex flex-col gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Telegram ID администратора
                    </label>
                    <input
                      type="number"
                      value={adminTgId}
                      onChange={(e) => setAdminTgId(e.target.value)}
                      placeholder="Например: 123456789"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Пароль администратора
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Введите пароль админ-панели"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    <KeyRound size={15} />
                    <span>{adminLoading ? 'Вход...' : 'Войти в панель управления'}</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WebNavbar;

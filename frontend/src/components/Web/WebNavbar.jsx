import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, LogOut, X, Send, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerGlobalRefresh } from '../../hooks/useAutoRefresh';

const WebNavbar = () => {
  const { user, fetchProfile } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('web_user_token');
    localStorage.removeItem('web_tg_user');
    fetchProfile();
    window.location.reload();
  };

  const isUserAuthenticated = Boolean(
    user?.tg_id || 
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
          <Link 
            to="/" 
            onClick={() => triggerGlobalRefresh()}
            className="text-xl font-black text-slate-800 dark:text-white no-underline tracking-wide hover:opacity-80 transition-opacity"
          >
            FAMCS
          </Link>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-7">
          <Link 
            to="/info" 
            onClick={() => triggerGlobalRefresh()}
            className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium transition-colors text-sm"
          >
            Информация
          </Link>
          <Link 
            to="/leaderboard" 
            onClick={() => triggerGlobalRefresh()}
            className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium transition-colors text-sm"
          >
            Рейтинг
          </Link>
          <Link 
            to="/news" 
            onClick={() => triggerGlobalRefresh()}
            className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium transition-colors text-sm"
          >
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

          {isUserAuthenticated && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-slate-800 dark:text-white font-semibold text-xs">
                {user?.custom_name || user?.first_name || user?.username || 'Студент'}
              </span>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Выйти из аккаунта"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="flex flex-col px-6 py-4 gap-4">
              <Link 
                to="/info" 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  triggerGlobalRefresh();
                }}
                className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium text-sm transition-colors"
              >
                Информация
              </Link>
              <Link 
                to="/leaderboard" 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  triggerGlobalRefresh();
                }}
                className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium text-sm transition-colors"
              >
                Рейтинг
              </Link>
              <Link 
                to="/news" 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  triggerGlobalRefresh();
                }}
                className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-medium text-sm transition-colors"
              >
                Новости
              </Link>
              <a 
                href={`https://t.me/${import.meta.env.VITE_BOT_USERNAME || 'famcs_coin_bot'}/app`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-orange-500 font-bold flex items-center gap-2 text-sm py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Send size={16} />
                <span>Играть в Telegram</span>
              </a>

              {isUserAuthenticated && (
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-800 dark:text-white font-semibold text-xs">
                    {user?.custom_name || user?.first_name || user?.username || 'Студент'}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-rose-500 font-bold text-sm flex items-center gap-2 text-left"
                  >
                    <LogOut size={14} />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WebNavbar;

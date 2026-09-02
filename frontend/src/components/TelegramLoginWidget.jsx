import React, { useEffect, useRef, useState } from 'react';
import { WebService } from '../api/services/WebService';
import { Send, AlertCircle } from 'lucide-react';

const TelegramLoginWidget = ({ onAuth, botName = 'famcs_coin_bot' }) => {
  const containerRef = useRef(null);
  const [isIpOrLocal, setIsIpOrLocal] = useState(false);

  useEffect(() => {
    const currentBot = import.meta.env.VITE_BOT_USERNAME || botName || 'famcs_coin_bot';
    const host = window.location.hostname;
    const isDirectIp = host === 'localhost' || host === '127.0.0.1' || /^[0-9.]+$/.test(host);

    setIsIpOrLocal(isDirectIp);

    // If accessing via raw IP or localhost, Telegram widget always fails with "Bot domain invalid"
    // because BotFather strictly requires a domain name (not an IP).
    if (isDirectIp) {
      return;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';

      window.onTelegramAuth = async (user) => {
        try {
          const res = await WebService.auth(user).catch(() => null);
          if (res?.data?.token) {
            localStorage.setItem('web_user_token', res.data.token);
          } else {
            localStorage.setItem('web_tg_user', JSON.stringify(user));
          }
          if (onAuth) onAuth(user);
        } catch (error) {
          console.error("Auth error:", error);
          if (onAuth) onAuth(user);
        }
      };

      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', currentBot);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [onAuth, botName]);

  if (isIpOrLocal) {
    return (
      <div className="flex flex-col items-center gap-2.5 w-full py-1">
        <a
          href={`https://t.me/${import.meta.env.VITE_BOT_USERNAME || botName || 'famcs_coin_bot'}/app`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#54a9eb] hover:bg-[#489cdb] text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Send size={15} />
          <span>Войти через Telegram Web App</span>
        </a>
        <div className="flex items-start gap-1.5 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800 text-left w-full">
          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <span>При доступе по IP-адресу или localhost виджет Telegram не поддерживается API Telegram. Используйте вход через бота или вкладку «Администратор».</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="telegram-widget-container flex justify-center py-2 min-h-[48px]"></div>
  );
};

export default TelegramLoginWidget;

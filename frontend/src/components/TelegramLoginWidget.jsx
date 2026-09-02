import React, { useEffect, useRef } from 'react';
import { WebService } from '../api/services/WebService';

const TelegramLoginWidget = ({ onAuth, botName = 'famcs_coin_bot' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const currentBot = import.meta.env.VITE_BOT_USERNAME || botName || 'famcs_coin_bot';

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

  return (
    <div ref={containerRef} className="telegram-widget-container flex justify-center py-2 min-h-[48px]"></div>
  );
};

export default TelegramLoginWidget;

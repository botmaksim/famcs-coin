import React, { useEffect, useRef } from 'react';
import { WebService } from '../api/services/WebService';

const TelegramLoginWidget = ({ onAuth }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Make sure we only add the script once
    if (containerRef.current && containerRef.current.children.length === 0) {
      window.onTelegramAuth = async (user) => {
        try {
          const res = await WebService.auth(user);
          if (res.data && res.data.token) {
            localStorage.setItem('web_user_token', res.data.token);
            if (onAuth) onAuth();
          }
        } catch (error) {
          console.error("Auth error:", error);
          alert('Ошибка авторизации');
        }
      };

      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', import.meta.env.VITE_BOT_USERNAME || 'famcs_coin_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '12'); // rounded corners
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      containerRef.current.appendChild(script);
    }
  }, [onAuth]);

  return (
    <div ref={containerRef} className="telegram-widget-container flex justify-center"></div>
  );
};

export default TelegramLoginWidget;

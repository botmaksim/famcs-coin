import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';

const TelegramLoginWidget = ({ onAuth }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Make sure we only add the script once
    if (containerRef.current && containerRef.current.children.length === 0) {
      window.onTelegramAuth = async (user) => {
        try {
          const res = await apiClient.post('/web/auth', user);
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
      script.setAttribute('data-telegram-login', 'famcs_coin_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '4');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      containerRef.current.appendChild(script);
    }
  }, [onAuth]);

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl border border-slate-200 shadow-sm w-full max-w-md mx-auto">
      <h2 className="mb-5 text-center font-bold text-2xl text-slate-800">Auth Required</h2>
      <p className="text-slate-500 mb-8 text-center text-sm">Please connect via Telegram to confirm your identity.</p>
      <div ref={containerRef} className="mb-4"></div>
    </div>
  );
};

export default TelegramLoginWidget;

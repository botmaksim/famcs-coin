import React, { useEffect, useRef } from 'react';
import apiClient from '../api/client';

const TelegramLoginWidget = ({ onAuth }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Make sure we only add the script once
    if (containerRef.current && containerRef.current.children.length === 0) {
      window.onTelegramAuth = async (user) => {
        try {
          // Отправляем данные на бэкенд для проверки
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
      script.setAttribute('data-radius', '10');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      containerRef.current.appendChild(script);
    }
  }, [onAuth]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Вход через Telegram</h2>
      <p style={{ color: '#94a3b8', marginBottom: '30px', textAlign: 'center' }}>Авторизуйтесь, чтобы участвовать в голосованиях DAO.</p>
      <div ref={containerRef}></div>
    </div>
  );
};

export default TelegramLoginWidget;

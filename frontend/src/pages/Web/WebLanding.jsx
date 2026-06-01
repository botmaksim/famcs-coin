import React from 'react';
import { Link } from 'react-router-dom';

const WebLanding = () => {
  return (
    <div style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <main style={{ flex: 1 }}>
        <section style={{ textAlign: 'center', padding: '100px 20px', background: 'radial-gradient(circle at center, var(--secondary-bg) 0%, var(--bg-color) 100%)' }}>
          <h1 style={{ fontSize: '64px', margin: '0 0 20px 0', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>FAMCS Coin</h1>
          <p style={{ fontSize: '24px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 40px auto' }}>
            Первая студенческая криптовалюта ФПМИ. Тапай енота, улучшай свой Универ, участвуй в DAO и поднимай свой рейтинг!
          </p>
          <a 
            href="https://t.me/famcs_coin_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'inline-block', 
              padding: '15px 40px', 
              backgroundColor: 'var(--accent-color)', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '30px', 
              fontSize: '20px', 
              fontWeight: 'bold',
              boxShadow: '0 10px 20px rgba(59, 130, 246, 0.4)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Играть в Telegram
          </a>
        </section>

        {/* Documentation Section */}
        <section id="docs" style={{ padding: '80px 40px', maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '36px', borderBottom: '2px solid var(--accent-color)', paddingBottom: '10px', marginBottom: '40px' }}>Документация</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
            <div style={{ backgroundColor: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ color: 'var(--accent-hover)', fontSize: '24px', marginTop: '0' }}>Экономика и Пассивный доход</h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                В игре присутствует продвинутая экономическая модель. Игроки могут инвестировать заработанные монеты (FAMCS Coins) в улучшения (Универ).
                Каждое улучшение генерирует пассивный доход каждый час.
              </p>
              <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                <strong>Математика:</strong> Стоимость улучшений растет по <i>геометрической прогрессии</i>: 
                <br /><code style={{ backgroundColor: 'var(--secondary-bg)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '8px' }}>New Price = Base Price * (Multiplier ^ Level)</code>.
                Это обеспечивает баланс инфляции монет и делает экономику устойчивой в долгосрочной перспективе.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ color: 'var(--accent-hover)', fontSize: '24px', marginTop: '0' }}>Сквады и DAO</h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                Лор игры завязан на объединении в Сквады. Сквады соревнуются за места в глобальном Лидерборде.
              </p>
              <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                Через систему <strong>DAO</strong> игроки могут голосовать за будущие обновления, добавление новых скинов и изменения в экономическом балансе. 
                Ваш голос имеет вес, пропорциональный количеству заработанных монет.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WebLanding;

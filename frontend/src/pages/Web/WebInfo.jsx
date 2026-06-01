import React from 'react';
import { Link } from 'react-router-dom';

const WebInfo = () => {
  return (
    <div style={{ fontFamily: 'var(--font-family)', color: 'var(--text-color)', lineHeight: '1.6' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Section 1: Gameplay */}
        <section style={{
          backgroundColor: 'var(--card-bg)',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>🎮 Игровой процесс и возможности</h2>
          <p>
            FAMCS Coin — это экономический симулятор и социальный эксперимент студентов ФПМИ. 
            Основная цель: зарабатывать виртуальные монеты, объединяться в студенческие группы (сквады) и участвовать в политической жизни факультета.
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '10px' }}><strong>Тапы и Майнинг:</strong> Кликайте по экрану в терминале для заработка. Не забывайте отправлять студента спать, чтобы восстановить энергию.</li>
            <li style={{ marginBottom: '10px' }}><strong>Сквады:</strong> Объединяйтесь с одногруппниками. Пожертвуйте часть своих монет в казну сквада для покупки глобальных бустов (например, ускорение восстановления энергии для всех участников).</li>
            <li style={{ marginBottom: '10px' }}><strong>DAO:</strong> Предлагайте свои идеи по улучшению факультета или игры. Все активные предложения проходят открытое голосование. Лучшие идеи воплощаются в реальность!</li>
          </ul>
        </section>

        {/* Section 2: Administration */}
        <section style={{
          backgroundColor: 'var(--card-bg)',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>👑 Администрация факультета</h2>
          <p>
            Проект управляется самими студентами. Существует несколько уровней доступа к панели управления:
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '10px' }}><strong>Студент (user):</strong> Базовый доступ. Участие в голосованиях, майнинг, покупка скинов.</li>
            <li style={{ marginBottom: '10px' }}><strong>Модератор (admin):</strong> Назначается администрацией. Может иметь специфические права: <code>moderate_dao</code> (отбор идей на голосование), <code>manage_tasks</code> (добавление заданий в раздел Earn), <code>manage_bets</code> (расчет результатов тотализатора) и <code>bonus_drop</code> (начисление бонусных монет).</li>
            <li style={{ marginBottom: '10px' }}><strong>Суперадмин (superadmin):</strong> Имеет полный доступ к системе, включая управление ролями других пользователей и генерацию инвайт-ссылок.</li>
          </ul>
          <p style={{ fontSize: '0.9em', opacity: 0.8 }}>
            Хотите присоединиться к команде? Проявляйте активность в DAO или свяжитесь с кем-то из <Link to="/hall-of-fame" style={{ color: 'var(--accent-color)' }}>Зала Славы</Link>.
          </p>
        </section>

        {/* Section 3: Legal Disclaimer */}
        <section style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tinted background
          border: '2px solid #ef4444', // Red border for emphasis
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0, color: '#ef4444', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', paddingBottom: '10px' }}>
            ⚠️ Смарт-контракт и Legal Disclaimer
          </h2>
          <p>
            <strong>ВНИМАНИЕ:</strong> FAMCS Coin является <strong>исключительно образовательным проектом</strong> и виртуальной игрой. 
            Коины, добытые в игре, не являются криптовалютой, ценной бумагой или платежным средством.
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '10px' }}><strong>Отсутствие ликвидности:</strong> У проекта нет и не будет пула ликвидности (Liquidity Pool). Монеты нельзя продать, обменять на реальные деньги или другие криптовалюты.</li>
            <li style={{ marginBottom: '10px' }}><strong>Правила ввода/вывода:</strong> Любые функции "перевода" (трансфера) работают только внутри изолированной базы данных проекта. Внешние блокчейны не используются.</li>
            <li style={{ marginBottom: '10px' }}><strong>Отказ от ответственности:</strong> Разработчики не несут никакой финансовой или юридической ответственности за потраченное время, виртуальные активы или любые ожидания пользователей. Игра предоставляется "как есть" (as is).</li>
          </ul>
          <p style={{ fontWeight: 'bold', marginTop: '20px', color: '#fca5a5' }}>
            Используя данное приложение, вы автоматически соглашаетесь с тем, что это просто развлечение.
          </p>
        </section>

      </div>
    </div>
  );
};

export default WebInfo;

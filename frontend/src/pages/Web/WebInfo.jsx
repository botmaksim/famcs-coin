import React from 'react';
import { Link } from 'react-router-dom';

const WebInfo = () => {
  return (
    <div className="font-sans text-slate-800 leading-relaxed py-10 px-5">
      <div className="max-w-[800px] mx-auto">

        {/* Section 1: Gameplay */}
        <section className="bg-white p-6 rounded-xl mb-8 border border-slate-200 shadow-sm">
          <h2 className="mt-0 border-b border-blue-200 pb-2.5 text-blue-600 font-bold text-2xl"><img src="/icons/gamepad.png" alt="gamepad" className="inline-block w-6 h-6 mr-2 align-middle" /> Игровой процесс и возможности</h2>
          <p className="text-slate-600 my-4 text-lg">
            FAMCS Coin — это экономический симулятор и социальный эксперимент студентов ФПМИ. 
            Основная цель: зарабатывать виртуальные монеты, объединяться в студенческие группы (сквады) и участвовать в политической жизни факультета.
          </p>
          <ul className="pl-5 text-slate-600">
            <li className="mb-2.5"><strong className="text-slate-900">Тапы и Майнинг:</strong> Кликайте по экрану в терминале для заработка. Не забывайте отправлять студента спать, чтобы восстановить энергию.</li>
            <li className="mb-2.5"><strong className="text-slate-900">Сквады:</strong> Объединяйтесь с одногруппниками. Пожертвуйте часть своих монет в казну сквада для покупки глобальных бустов (например, ускорение восстановления энергии для всех участников).</li>
            <li className="mb-2.5"><strong className="text-slate-900">DAO:</strong> Предлагайте свои идеи по улучшению факультета или игры. Все активные предложения проходят открытое голосование. Лучшие идеи воплощаются в реальность!</li>
          </ul>
        </section>

        {/* Section 2: Administration */}
        <section className="bg-white p-6 rounded-xl mb-8 border border-slate-200 shadow-sm">
          <h2 className="mt-0 border-b border-blue-200 pb-2.5 text-blue-600 font-bold text-2xl"><img src="/icons/crown.png" alt="crown" className="inline-block w-6 h-6 mr-2 align-middle" /> Администрация факультета</h2>
          <p className="text-slate-600 my-4 text-lg">
            Проект управляется самими студентами. Существует несколько уровней доступа к панели управления:
          </p>
          <ul className="pl-5 text-slate-600">
            <li className="mb-2.5"><strong className="text-slate-900">Студент (user):</strong> Базовый доступ. Участие в голосованиях, майнинг, покупка скинов.</li>
            <li className="mb-2.5"><strong className="text-slate-900">Модератор (admin):</strong> Назначается администрацией. Может иметь специфические права: <code className="bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-sm">moderate_dao</code> (отбор идей на голосование), <code className="bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-sm">manage_tasks</code> (добавление заданий в раздел Earn), <code className="bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-sm">manage_bets</code> (расчет результатов тотализатора) и <code className="bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-sm">bonus_drop</code> (начисление бонусных монет).</li>
            <li className="mb-2.5"><strong className="text-slate-900">Суперадмин (superadmin):</strong> Имеет полный доступ к системе, включая управление ролями других пользователей и генерацию инвайт-ссылок.</li>
          </ul>
          <p className="text-sm text-slate-500 mt-6">
            Хотите присоединиться к команде? Проявляйте активность в DAO или свяжитесь с кем-то из <Link to="/hall-of-fame" className="text-blue-600 font-medium hover:underline">Зала Славы</Link>.
          </p>
        </section>

        {/* Section 3: Legal Disclaimer */}
        <section className="bg-red-50 border-2 border-red-200 p-6 rounded-xl mb-8 shadow-sm">
          <h2 className="mt-0 text-red-600 border-b border-red-200 pb-2.5 font-bold text-2xl flex items-center">
            <span className="text-2xl mr-2">⚠️</span> Смарт-контракт и Legal Disclaimer
          </h2>
          <p className="text-slate-700 my-4 text-lg">
            <strong className="text-red-700">ВНИМАНИЕ:</strong> FAMCS Coin является <strong className="text-red-700">исключительно образовательным проектом</strong> и виртуальной игрой. 
            Коины, добытые в игре, не являются криптовалютой, ценной бумагой или платежным средством.
          </p>
          <ul className="pl-5 text-slate-700">
            <li className="mb-2.5"><strong className="text-red-700">Отсутствие ликвидности:</strong> У проекта нет и не будет пула ликвидности (Liquidity Pool). Монеты нельзя продать, обменять на реальные деньги или другие криптовалюты.</li>
            <li className="mb-2.5"><strong className="text-red-700">Правила ввода/вывода:</strong> Любые функции "перевода" (трансфера) работают только внутри изолированной базы данных проекта. Внешние блокчейны не используются.</li>
            <li className="mb-2.5"><strong className="text-red-700">Отказ от ответственности:</strong> Разработчики не несут никакой финансовой или юридической ответственности за потраченное время, виртуальные активы или любые ожидания пользователей. Игра предоставляется "как есть" (as is).</li>
          </ul>
          <p className="font-bold mt-6 text-red-700 text-center">
            Используя данное приложение, вы автоматически соглашаетесь с тем, что это просто развлечение.
          </p>
        </section>

      </div>
    </div>
  );
};

export default WebInfo;

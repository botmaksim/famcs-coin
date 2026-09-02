import React from 'react';

const WebLanding = () => {
  return (
    <div className="font-sans flex flex-col">
      <main className="flex-1 py-10 px-5 max-w-[1200px] mx-auto w-full">
        
        {/* Verification Section matching screenshot */}
        <section className="flex flex-col gap-[60px] mb-[100px]">
          
          <div className="flex items-center">
             <div className="w-1 h-10 bg-orange-500 mr-5"></div>
             <h1 className="text-[38px] m-0 uppercase tracking-[2px] font-bold text-slate-800 dark:text-white">ЭКОСИСТЕМА ФПМИ</h1>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-[80px] items-center">
            {/* Left: Circle Image Placeholder */}
            <div className="relative flex justify-center">
               <div className="w-[400px] h-[400px] rounded-full bg-slate-50 dark:bg-slate-800 flex justify-center items-center overflow-hidden relative shadow-md">
                 <img src="/famcscoin.png" alt="FAMCS COIN Logo" className="w-full h-full object-cover" />
               </div>
            </div>

            {/* Right: Text Content */}
            <div className="flex flex-col gap-6 pr-5">
              <h2 className="text-4xl text-orange-500 m-0 font-bold">Официальный Кликер</h2>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed m-0">
                Зарабатывай коины прямо в Telegram. Покупай стаканчики кофе и толстые университетские учебники для прокачки пассивного дохода!
              </p>

              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed m-0">
                Участвуй в <strong className="text-slate-900 dark:text-white">тотализаторе</strong>, делай ставки на отчисления, сессию и другие студенческие события, чтобы сорвать куш и занять топ в лидерборде.
              </p>

              <div className="w-20 h-1 bg-orange-500 mt-10 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="text-center py-[60px] px-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
          <h2 className="text-5xl m-0 mb-5 text-slate-800 dark:text-white font-black">Врывайся в Топ</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-[600px] mx-auto mb-10 leading-relaxed font-medium">
            Главная экономическая мини-игра факультета. Тапай, улучшай навыки, делай ставки и соревнуйся.
          </p>
          <a 
            href="https://t.me/famcs_coin_bot/app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block py-4 px-[45px] bg-orange-500 text-white no-underline rounded-xl text-lg font-bold shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] transition-all hover:scale-105 hover:bg-orange-600"
          >
            ИГРАТЬ В TELEGRAM
          </a>
        </section>

      </main>
    </div>
  );
};

export default WebLanding;

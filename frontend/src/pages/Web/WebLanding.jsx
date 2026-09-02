import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const WebLanding = () => {
  return (
    <div className="font-sans flex flex-col">
      <main className="flex-1 py-10 px-4 sm:px-6 max-w-[1200px] mx-auto w-full">
        
        {/* Top Ecosystem Section */}
        <section className="flex flex-col gap-10 mb-16 sm:mb-24">
          
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-9 bg-orange-500 rounded-full"></div>
             <h1 className="text-2xl sm:text-4xl m-0 uppercase tracking-widest font-black text-slate-800 dark:text-white">
               Экосистема ФПМИ
             </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Floating Coin graphic with soft ambient glow */}
            <div className="relative flex justify-center items-center py-6">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex justify-center items-center">
                {/* Soft ambient gradient aura */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-orange-500/25 to-amber-400/25 blur-3xl -z-10 transform scale-90"></div>
                <img 
                  src="/famcscoin.png" 
                  alt="FAMCS COIN" 
                  className="w-full h-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-300 pointer-events-none"
                  onError={(e) => { e.target.src = '/famcscoin.jpg'; }}
                />
              </div>
            </div>

            {/* Right: Text Content */}
            <div className="flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-bold w-fit border border-orange-200/60 dark:border-orange-800/40">
                <Sparkles size={14} />
                <span>Факультетская игра</span>
              </div>

              <h2 className="text-3xl sm:text-4xl text-orange-500 m-0 font-extrabold tracking-tight">
                Официальный Кликер
              </h2>
              
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed m-0 font-medium">
                Зарабатывай коины прямо в Telegram. Покупай стаканчики кофе и толстые университетские учебники для прокачки пассивного дохода!
              </p>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed m-0 font-medium">
                Участвуй в <strong className="text-slate-900 dark:text-white font-bold">тотализаторе</strong>, делай ставки на отчисления, сессию и другие студенческие события, чтобы сорвать куш и занять топ в лидерборде.
              </p>

              <div className="w-16 h-1 bg-orange-500 mt-4 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Hero CTA Section */}
        <section className="relative overflow-hidden text-center py-14 px-6 sm:px-12 bg-gradient-to-br from-orange-50/90 via-white to-amber-50/90 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl shadow-xl shadow-orange-500/5 dark:shadow-2xl border border-orange-200/60 dark:border-slate-800 transition-colors">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <h2 className="text-4xl sm:text-5xl m-0 mb-4 text-slate-900 dark:text-white font-black tracking-tight drop-shadow-sm">
            Врывайся в Топ
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed font-medium">
            Главная экономическая мини-игра факультета. Тапай, улучшай навыки, делай ставки и соревнуйся за первенство факультета.
          </p>
          <a 
            href={`https://t.me/${import.meta.env.VITE_BOT_USERNAME || 'famcs_coin_bot'}/app`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-4 px-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-2xl text-base shadow-[0_8px_25px_rgba(249,115,22,0.35)] transition-all hover:scale-105 active:scale-95 uppercase tracking-wide no-underline"
          >
            <span>Играть в Telegram</span>
            <ArrowRight size={18} />
          </a>
        </section>

      </main>
    </div>
  );
};

export default WebLanding;

import React from 'react';
import { Link } from 'react-router-dom';

const WebLanding = () => {
  return (
    <div className="font-sans text-slate-800 flex flex-col">
      <main className="flex-1 py-10 px-5 max-w-[1200px] mx-auto w-full">
        
        {/* Verification Section matching screenshot */}
        <section className="flex flex-col gap-[60px] mb-[100px]">
          
          <div className="flex items-center">
             <div className="w-1 h-10 bg-blue-600 mr-5"></div>
             <h1 className="text-[38px] m-0 uppercase tracking-[2px] font-bold text-slate-900">VERIFIED PARTICIPATION</h1>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-[80px] items-center">
            {/* Left: Cyberpunk Circle Image Placeholder */}
            <div className="relative flex justify-center">
               <div className="w-[400px] h-[400px] rounded-full bg-slate-50 flex justify-center items-center overflow-hidden relative shadow-md">
                 <img src="/logo.png" alt="FAMCS COIN Logo" className="w-[80%] h-[80%] object-contain" />
               </div>
            </div>

            {/* Right: Text Content */}
            <div className="flex flex-col gap-6 pr-5">
              <h2 className="text-4xl text-blue-600 m-0 font-normal">Telegram Widget Auth</h2>
              
              <p className="text-lg text-slate-600 leading-relaxed m-0">
                Leveraging the <strong className="text-slate-900">Telegram Login Widget</strong> ensures that only verified FAMCS users can participate in governance. This hybrid approach combines the security of the messenger with the power of the web.
              </p>

              <p className="text-lg text-slate-600 leading-relaxed m-0">
                Authentication is cryptographically verified on our Go backend, maintaining a <strong className="text-slate-900">Trustless Governance</strong> environment.
              </p>

              <div className="w-20 h-0.5 bg-blue-600 mt-10"></div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="text-center py-[60px] px-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h2 className="text-5xl m-0 mb-5 text-slate-900 font-bold">Join the Ecosystem</h2>
          <p className="text-xl text-slate-600 max-w-[600px] mx-auto mb-10 leading-relaxed">
            Первая студенческая криптовалюта ФПМИ. Тапай, улучшай свой Универ, участвуй в DAO и поднимай свой рейтинг!
          </p>
          <a 
            href="https://t.me/famcs_coin_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block py-4 px-[45px] bg-blue-600 text-white no-underline rounded-lg text-lg font-bold shadow-md transition-all hover:scale-105 hover:bg-blue-700"
          >
            PLAY IN TELEGRAM
          </a>
        </section>

      </main>
    </div>
  );
};

export default WebLanding;

import React, { useState, useEffect } from 'react';
import { WebService } from '../../api/services/WebService';
import { Link } from 'react-router-dom';

const WebHallOfFame = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await WebService.getHallOfFame();
        setAdmins(res.data || []);
      } catch (error) {
        console.error('Failed to fetch hall of fame:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const superAdmins = admins.filter(a => a.role === 'superadmin');
  const regularAdmins = admins.filter(a => a.role === 'admin');

  return (
    <div className="font-sans">
      <div className="py-10 px-5 max-w-[1200px] mx-auto transition-colors">
        <h1 className="text-5xl uppercase tracking-[2px] text-center mb-5 text-[var(--text-color)] font-bold">
          Зал <span className="text-blue-600">Славы</span>
        </h1>
        <p className="text-center text-lg text-slate-600 dark:text-slate-400 mb-14 max-w-[600px] mx-auto leading-relaxed">
          Список легенд, создателей и модераторов проекта, благодаря которым FAMCS Coin продолжает жить и развиваться.
        </p>

        {loading ? (
          <div className="text-center text-xl text-slate-400 py-20 animate-pulse">Загрузка...</div>
        ) : (
          <>
            {superAdmins.length > 0 && (
              <div className="mb-14">
                <h2 className="text-3xl uppercase mb-7 border-b-2 border-blue-200 dark:border-blue-900 pb-2 inline-block text-[var(--text-color)] font-bold">Основатели</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-7">
                  {superAdmins.map((admin, index) => (
                    <AdminCard key={index} admin={admin} isSuper={true} />
                  ))}
                </div>
              </div>
            )}

            {regularAdmins.length > 0 && (
              <div>
                <h2 className="text-3xl uppercase mb-7 border-b-2 border-slate-200 dark:border-slate-800 pb-2 inline-block text-[var(--text-color)] font-bold">Модераторы</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-7">
                  {regularAdmins.map((admin, index) => (
                    <AdminCard key={index} admin={admin} isSuper={false} />
                  ))}
                </div>
              </div>
            )}
            
            {admins.length === 0 && (
              <div className="text-center text-xl text-slate-500 py-10">Пока здесь пусто...</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AdminCard = ({ admin, isSuper }) => {
  return (
    <div className={`bg-[var(--card-bg)] rounded-xl p-7 flex flex-col items-center text-center transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-md ${isSuper ? 'border-2 border-blue-400 dark:border-blue-700 shadow-md shadow-blue-100 dark:shadow-blue-900/20' : 'border border-[var(--glass-border)] shadow-sm'}`}>
      <div className={`w-[100px] h-[100px] rounded-full mb-5 overflow-hidden flex justify-center items-center bg-slate-100 dark:bg-slate-800 border-2 ${isSuper ? 'border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
        {admin.avatar_url ? (
          <img src={admin.avatar_url} alt={admin.username} className="w-full h-full object-cover" />
        ) : (
          <div className="text-4xl">🥷</div>
        )}
      </div>
      
      <h3 className="m-0 mb-2 text-2xl text-[var(--text-color)] font-bold">{admin.custom_name || admin.username}</h3>
      
      <div className={`px-4 py-1.5 rounded text-xs tracking-wide uppercase font-bold mb-4 ${isSuper ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
        {isSuper ? 'СУПЕРАДМИН' : 'МОДЕРАТОР'}
      </div>
      
      {admin.responsibility && (
        <p className="text-slate-500 dark:text-slate-400 text-sm m-0 italic leading-relaxed">
          "{admin.responsibility}"
        </p>
      )}
    </div>
  );
};

export default WebHallOfFame;

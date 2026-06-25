import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DaoService } from '../../api/services/DaoService';
import { Link } from 'react-router-dom';
import TelegramLoginWidget from '../../components/TelegramLoginWidget';
import { Skeleton } from '../../components/Skeleton';
import { useAppStore } from '../../store/useAppStore';

const WebDAO = () => {
  const { daoProposals, setDaoProposals } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('web_user_token');
    if (token) {
      setIsAuthenticated(true);
      fetchProposals();
    }
  }, []);

  const handleAuth = () => {
    setIsAuthenticated(true);
    fetchProposals();
  };

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await DaoService.getProposals();
      setDaoProposals(res.data.proposals || []);
    } catch (err) {
      setError('Не удалось загрузить голосования');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId, voteType) => {
    try {
      await DaoService.vote(proposalId, voteType);
      toast.success('Голос учтен');
      await fetchProposals();
    } catch (err) {
      toast.error(err.response?.data || 'Ошибка при голосовании');
    }
  };

  return (
    <div className="font-sans flex flex-col transition-colors">
      <div className="py-10 px-5 max-w-[1000px] mx-auto flex-1 w-full relative">
        <div className="flex items-center justify-center mb-5">
             <div className="w-1 h-10 bg-blue-600 mr-5"></div>
             <h1 className="text-[38px] m-0 uppercase tracking-[2px] font-bold text-[var(--text-color)]">DAO УПРАВЛЕНИЕ</h1>
        </div>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-[60px] text-lg leading-relaxed">
          Влияй на развитие университета! Каждый голос имеет значение в нашей доверенной экосистеме.
        </p>

        {!isAuthenticated ? (
          <div className="max-w-[400px] mx-auto mt-[60px]">
            <TelegramLoginWidget onAuth={handleAuth} />
          </div>
        ) : (
          <>
            {loading && daoProposals.length === 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-[30px]">
                {[1,2,3,4].map(i => (
                  <Skeleton key={i} className="h-64 rounded-lg w-full" />
                ))}
              </div>
            )}
            {error && daoProposals.length === 0 && <div className="text-center text-red-500 text-lg">{error}</div>}

            {(!loading || daoProposals.length > 0) && !error && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-[30px]">
                {daoProposals.map(p => {
                  const hasVoted = p.user_vote && p.user_vote !== "";
                  const isUp = p.user_vote === 'up';
                  const isDown = p.user_vote === 'down';

                  return (
                    <div key={p.id} className="p-[30px] bg-[var(--card-bg)] rounded-xl border border-[var(--glass-border)] flex flex-col shadow-sm backdrop-blur-md transition-all hover:-translate-y-1">
                      <h3 className="mt-0 mb-4 text-2xl text-[var(--text-color)] font-bold">{p.title}</h3>
                      <p className="m-0 mb-6 text-base leading-relaxed text-slate-600 dark:text-slate-300 flex-1">{p.description}</p>
                      
                      <div className="flex gap-4">
                        <button
                          disabled={hasVoted}
                          onClick={() => handleVote(p.id, 'up')}
                          className={`flex-1 p-3 rounded-xl border-none font-bold text-lg flex justify-center items-center gap-2.5 transition-all
                            ${isUp ? 'bg-blue-600 text-white shadow-md' : (hasVoted ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50 cursor-pointer')}
                            ${hasVoted ? 'cursor-default' : 'cursor-pointer'}
                          `}
                        >
                          <img src="/icons/thumbs_up.png" alt="up" className="inline-block w-5 h-5 mr-1 align-middle" /> <span>{p.votes_up}</span>
                        </button>
                        <button
                          disabled={hasVoted}
                          onClick={() => handleVote(p.id, 'down')}
                          className={`flex-1 p-3 rounded-xl border-none font-bold text-lg flex justify-center items-center gap-2.5 transition-all
                            ${isDown ? 'bg-red-500 text-white shadow-md' : (hasVoted ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 cursor-pointer')}
                            ${hasVoted ? 'cursor-default' : 'cursor-pointer'}
                          `}
                        >
                          <img src="/icons/thumbs_down.png" alt="down" className="inline-block w-5 h-5 mr-1 align-middle" /> <span>{p.votes_down}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {daoProposals.length === 0 && <div className="col-span-full text-center text-xl text-slate-600 dark:text-slate-400 p-10">Активных голосований нет</div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WebDAO;

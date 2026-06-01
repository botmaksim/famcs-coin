import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/client';
import { Link } from 'react-router-dom';
import TelegramLoginWidget from '../../components/TelegramLoginWidget';
import { Skeleton } from '../../components/Skeleton';

const WebDAO = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('web_user_token');
    if (token) {
      setIsAuthenticated(true);
      fetchProposals();
      setupWebSocket();
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const setupWebSocket = () => {
    const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8083/api')
                  .replace(/^http/, 'ws') + '/ws';
    
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'dao_vote') {
          // Update votes in real time
          setProposals(prev => prev.map(p => {
             if (p.id === data.payload.proposal_id) {
               return {
                 ...p,
                 votes_up: data.payload.vote_type === 'up' ? p.votes_up + 1 : p.votes_up,
                 votes_down: data.payload.vote_type === 'down' ? p.votes_down + 1 : p.votes_down
               };
             }
             return p;
          }));
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    };
  };

  const handleAuth = () => {
    setIsAuthenticated(true);
    fetchProposals();
  };

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/dao/proposals');
      setProposals(res.data.proposals || []);
    } catch (err) {
      setError('Не удалось загрузить голосования');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId, voteType) => {
    try {
      await apiClient.post('/dao/vote', { proposal_id: proposalId, vote_type: voteType });
      toast.success('Голос учтен');
      await fetchProposals();
    } catch (err) {
      toast.error(err.response?.data || 'Ошибка при голосовании');
    }
  };

  return (
    <div className="font-sans text-slate-800 flex flex-col">
      <div className="py-10 px-5 max-w-[1000px] mx-auto flex-1 w-full relative">
        <div className="flex items-center justify-center mb-5">
             <div className="w-1 h-10 bg-blue-600 mr-5"></div>
             <h1 className="text-[38px] m-0 uppercase tracking-[2px] font-bold text-slate-900">DAO GOVERNANCE</h1>
        </div>
        <p className="text-center text-slate-600 mb-[60px] text-lg leading-relaxed">
          Влияй на развитие университета! Каждый голос имеет значение в нашей Trustless Ecosystem.
        </p>

        {!isAuthenticated ? (
          <div className="max-w-[400px] mx-auto mt-[60px]">
            <TelegramLoginWidget onAuth={handleAuth} />
          </div>
        ) : (
          <>
            {loading && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-[30px]">
                {[1,2,3,4].map(i => (
                  <Skeleton key={i} className="h-64 rounded-lg w-full" />
                ))}
              </div>
            )}
            {error && <div className="text-center text-red-500 text-lg">{error}</div>}

            {!loading && !error && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-[30px]">
                {proposals.map(p => {
                  const hasVoted = p.user_vote && p.user_vote !== "";
                  const isUp = p.user_vote === 'up';
                  const isDown = p.user_vote === 'down';

                  return (
                    <div key={p.id} className="p-[30px] bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm">
                      <h3 className="mt-0 mb-4 text-2xl text-slate-900 font-bold">{p.title}</h3>
                      <p className="m-0 mb-6 text-base leading-relaxed text-slate-600 flex-1">{p.description}</p>
                      
                      <div className="flex gap-4">
                        <button
                          disabled={hasVoted}
                          onClick={() => handleVote(p.id, 'up')}
                          className={`flex-1 p-3 rounded-xl border-none font-bold text-lg flex justify-center items-center gap-2.5 transition-all
                            ${isUp ? 'bg-blue-600 text-white shadow-md' : (hasVoted ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer')}
                            ${hasVoted ? 'cursor-default' : 'cursor-pointer'}
                          `}
                        >
                          <img src="/icons/thumbs_up.png" alt="up" className="inline-block w-5 h-5 mr-1 align-middle" /> <span>{p.votes_up}</span>
                        </button>
                        <button
                          disabled={hasVoted}
                          onClick={() => handleVote(p.id, 'down')}
                          className={`flex-1 p-3 rounded-xl border-none font-bold text-lg flex justify-center items-center gap-2.5 transition-all
                            ${isDown ? 'bg-red-500 text-white shadow-md' : (hasVoted ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 cursor-pointer')}
                            ${hasVoted ? 'cursor-default' : 'cursor-pointer'}
                          `}
                        >
                          <img src="/icons/thumbs_down.png" alt="down" className="inline-block w-5 h-5 mr-1 align-middle" /> <span>{p.votes_down}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {proposals.length === 0 && <div className="col-span-full text-center text-xl text-slate-600 p-10">Активных голосований нет</div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WebDAO;

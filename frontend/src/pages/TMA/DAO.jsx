import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/client';
import { Skeleton } from '../../components/Skeleton';

const DAO = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchProposals();
    setupWebSocket();

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
      // Remove toast locally since TMA sometimes doesn't have toast well defined, or we can use generic alert?
      // actually toast is used in WebDAO so it's fine.
    } catch (err) {
      console.error('Ошибка при голосовании', err);
    }
  };

  if (loading) {
     return <div className="p-5 flex flex-col gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-lg w-full" />)}
     </div>;
  }

  if (error) return <div className="p-5 text-center text-red-500">{error}</div>;

  return (
    <div className="p-5 overflow-y-auto pb-24 text-slate-800">
      <h2 className="text-2xl font-bold mt-0 mb-5">DAO Голосования</h2>
      
      <div className="flex flex-col gap-5">
        {proposals.map(p => {
          const hasVoted = p.user_vote && p.user_vote !== "";
          const isUp = p.user_vote === 'up';
          const isDown = p.user_vote === 'down';

          return (
            <div key={p.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="mt-0 mb-2 text-lg text-slate-900 font-bold leading-tight">{p.title}</h3>
              <p className="m-0 mb-4 text-sm leading-relaxed text-slate-600 flex-1">{p.description}</p>
              
              <div className="flex gap-3">
                <button
                  disabled={hasVoted}
                  onClick={() => handleVote(p.id, 'up')}
                  className={`flex-1 p-2.5 rounded-xl border-none font-bold text-base flex justify-center items-center gap-2 transition-all
                    ${isUp ? 'bg-blue-600 text-white shadow-md' : (hasVoted ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100')}
                  `}
                >
                  <img src="/icons/thumbs_up.png" alt="up" className="w-4 h-4" /> <span>{p.votes_up}</span>
                </button>
                <button
                  disabled={hasVoted}
                  onClick={() => handleVote(p.id, 'down')}
                  className={`flex-1 p-2.5 rounded-xl border-none font-bold text-base flex justify-center items-center gap-2 transition-all
                    ${isDown ? 'bg-red-500 text-white shadow-md' : (hasVoted ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}
                  `}
                >
                  <img src="/icons/thumbs_down.png" alt="down" className="w-4 h-4" /> <span>{p.votes_down}</span>
                </button>
              </div>
            </div>
          );
        })}
        {proposals.length === 0 && <div className="text-center text-slate-500 py-10">Нет активных предложений</div>}
      </div>
    </div>
  );
};

export default DAO;

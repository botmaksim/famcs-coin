import React from 'react';
import { toast } from 'react-hot-toast';
import { DaoService } from '../../api/services/DaoService';
import { Skeleton } from '../../components/Skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DAO = () => {
  const queryClient = useQueryClient();

  const { data: daoProposals, isLoading, error } = useQuery({
    queryKey: ['daoProposals'],
    queryFn: async () => {
      const res = await DaoService.getProposals();
      return res.data.proposals || [];
    }
  });

  const voteMutation = useMutation({
    mutationFn: ({ proposalId, voteType }) => DaoService.vote(proposalId, voteType),
    onMutate: async ({ proposalId, voteType }) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['daoProposals'] });
      const previousProposals = queryClient.getQueryData(['daoProposals']);
      
      queryClient.setQueryData(['daoProposals'], (old) => {
        if (!old) return [];
        return old.map(p => {
          if (p.id === proposalId) {
            return {
              ...p,
              user_vote: voteType,
              votes_up: voteType === 'up' ? p.votes_up + 1 : p.votes_up,
              votes_down: voteType === 'down' ? p.votes_down + 1 : p.votes_down,
            };
          }
          return p;
        });
      });
      return { previousProposals };
    },
    onError: (err, newVote, context) => {
       queryClient.setQueryData(['daoProposals'], context.previousProposals);
       toast.error('Ошибка при голосовании');
    },
    onSettled: () => {
       queryClient.invalidateQueries({ queryKey: ['daoProposals'] });
       queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  });

  const handleVote = (proposalId, voteType) => {
    voteMutation.mutate({ proposalId, voteType });
  };

  if (isLoading && (!daoProposals || daoProposals.length === 0)) {
     return <div className="p-5 flex flex-col gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-lg w-full" />)}
     </div>;
  }

  if (error && (!daoProposals || daoProposals.length === 0)) return <div className="p-5 text-center text-red-500">Не удалось загрузить голосования</div>;

  const proposals = daoProposals || [];

  return (
    <div className="p-5 overflow-y-auto pb-24 text-[var(--text-color)]">
      <h2 className="text-2xl font-bold mt-0 mb-5">DAO Голосования</h2>
      
      <div className="flex flex-col gap-5">
        {proposals.map(p => {
          const hasVoted = p.user_vote && p.user_vote !== "";
          const isUp = p.user_vote === 'up';
          const isDown = p.user_vote === 'down';

          return (
            <div key={p.id} className="p-4 bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--glass-border)] flex flex-col">
              <h3 className="mt-0 mb-2 text-lg font-bold leading-tight text-[var(--text-color)]">{p.title}</h3>
              <p className="m-0 mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 flex-1">{p.description}</p>
              
              <div className="flex gap-3">
                <button
                  disabled={hasVoted}
                  onClick={() => handleVote(p.id, 'up')}
                  className={`flex-1 p-2.5 rounded-xl border-none font-bold text-base flex justify-center items-center gap-2 transition-all
                    ${isUp ? 'bg-blue-600 text-white shadow-md' : (hasVoted ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50')}
                  `}
                >
                  <img src="/icons/thumbs_up.png" alt="up" className="w-4 h-4" /> <span>{p.votes_up}</span>
                </button>
                <button
                  disabled={hasVoted}
                  onClick={() => handleVote(p.id, 'down')}
                  className={`flex-1 p-2.5 rounded-xl border-none font-bold text-base flex justify-center items-center gap-2 transition-all
                    ${isDown ? 'bg-red-500 text-white shadow-md' : (hasVoted ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700')}
                  `}
                >
                  <img src="/icons/thumbs_down.png" alt="down" className="w-4 h-4" /> <span>{p.votes_down}</span>
                </button>
              </div>
            </div>
          );
        })}
        {proposals.length === 0 && !isLoading && <div className="text-center text-slate-500 py-10">Нет активных предложений</div>}
      </div>
    </div>
  );
};

export default DAO;

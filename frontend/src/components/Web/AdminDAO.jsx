import React from 'react';
import { AdminService } from '../../api/services/AdminService';

export const AdminDAO = ({ pendingProposals, fetchPendingDao }) => {
  const handleModerateDao = async (proposalId, decision) => {
    try {
      await AdminService.moderateProposal(proposalId, decision);
      fetchPendingDao();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при модерации DAO');
    }
  };

  return (
    <div className="bg-[var(--card-bg)] p-5 rounded-xl mb-5 border border-[var(--glass-border)]">
      <h3 className="mt-0 text-[var(--text-color)] text-xl font-bold mb-4">⚖️ Очередь DAO (Премодерация)</h3>
      
      <div className="flex flex-col gap-3">
        {pendingProposals.map((p) => (
          <div key={p.id} className="flex justify-between items-center bg-white/5 p-4 rounded-lg flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="font-bold text-lg text-white mb-1">{p.title}</div>
              <div className="text-sm text-white/80 mb-2">{p.description}</div>
              <div className="text-xs text-white/50">
                Автор (TG ID): {p.user_id} | Создано: {new Date(p.created_at).toLocaleString()}
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleModerateDao(p.id, 'approve')}
                className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-black font-bold hover:bg-[#b0f242] transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
              >
                ✅
              </button>
              <button
                onClick={() => handleModerateDao(p.id, 'reject')}
                className="px-4 py-2 rounded-lg border border-red-500 bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors"
              >
                ❌
              </button>
            </div>
          </div>
        ))}
        {pendingProposals.length === 0 && (
          <p className="text-white/50 text-center py-4">Нет новых предложений.</p>
        )}
      </div>
    </div>
  );
};

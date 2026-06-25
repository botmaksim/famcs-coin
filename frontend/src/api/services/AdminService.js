import apiClient from '../client';

export const AdminService = {
  // Settings
  getSettings: () => apiClient.get('/admin/settings'),
  updateSetting: (key, value) => apiClient.put('/admin/settings', { key, value: String(value) }),
  
  // Tasks
  getTasks: () => apiClient.get('/admin/tasks'),
  createTask: (data) => apiClient.post('/admin/tasks', data),
  updateTask: (id, data) => apiClient.put(`/admin/tasks/${id}`, data),
  deleteTask: (id) => apiClient.delete(`/admin/tasks/${id}`),

  // DAO
  getPendingProposals: () => apiClient.get('/admin/dao/pending'),
  moderateProposal: (proposalId, decision) => apiClient.post('/admin/dao/moderate', { proposal_id: proposalId, decision }),

  // Actions
  giveBonus: (tgId, amount) => apiClient.post('/admin/bonus', { tg_id: parseInt(tgId), amount: parseFloat(amount) }),
  resolveBet: (eventId, winningOption) => apiClient.post('/admin/bets/resolve', { event_id: eventId, winning_option: winningOption }),
  banUser: (tgId, reason, isBanned) => apiClient.post('/admin/users/ban', { tg_id: parseInt(tgId), reason, is_banned: isBanned }),
  
  // Staff
  setRole: (tgId, role, permissions) => apiClient.post('/admin/role', { tg_id: parseInt(tgId), role, permissions }),
  generateInvite: (role) => apiClient.post('/admin/generate_invite', { role }),
  acceptInvite: (token, tgId) => apiClient.post('/admin/accept_invite', { token: token, tg_id: parseInt(tgId) }),
};

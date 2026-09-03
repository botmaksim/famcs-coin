import apiClient from '../client';

export const AdminService = {
  // Bets
  createBet: (data) => apiClient.post('/admin/bets', data),
  closeBet: (eventId, winningOptionIndex) => apiClient.post('/admin/bets/close', { event_id: parseInt(eventId), winning_option_index: parseInt(winningOptionIndex) }),

  // Shop
  createShopItem: (data) => apiClient.post('/admin/shop', data),
  deleteShopItem: (upgradeId) => apiClient.delete('/admin/shop', { data: { upgrade_id: parseInt(upgradeId) } }),

  // Feedback
  updateFeedbackStatus: (feedbackId, status) => apiClient.post('/admin/feedback/status', { feedback_id: parseInt(feedbackId), status }),
  deleteFeedback: (feedbackId) => apiClient.post('/admin/feedback/delete', { feedback_id: parseInt(feedbackId) }),

  // Roles & Users
  getUsers: (query = '') => apiClient.get(`/admin/users?q=${encodeURIComponent(query)}`),
  updateRole: (tgId, role) => apiClient.post('/admin/role', { tg_id: parseInt(tgId), role }),
};

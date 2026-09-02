import apiClient from '../client';

export const LeaderboardService = {
  getLeaderboard: (sortBy = 'balance', period = 'all') => apiClient.get(`/leaderboard?sort=${sortBy}&period=${period}`),
  getWebLeaderboard: (sortBy = 'balance', period = 'all') => apiClient.get(`/web/leaderboard?sort=${sortBy}&period=${period}`),
};

import apiClient from '../client';

export const LeaderboardService = {
  getLeaderboard: (sortBy = 'balance') => apiClient.get(`/leaderboard?sort=${sortBy}`),
  getWebLeaderboard: () => apiClient.get('/web/leaderboard'),
};

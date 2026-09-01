import apiClient from '../client';

export const LeaderboardService = {
  getLeaderboard: () => apiClient.get('/leaderboard'),
  getWebLeaderboard: () => apiClient.get('/web/leaderboard'),
};

import apiClient from '../client';

export const LeaderboardService = {
  getUsers: () => apiClient.get('/leaderboard/users'),
  getTippers: () => apiClient.get('/leaderboard/tippers'),
  getWebPlayers: () => apiClient.get('/web/leaderboard/players'),
  getWebSquads: () => apiClient.get('/web/leaderboard/squads'),
  getWebTippers: () => apiClient.get('/web/leaderboard/tippers'),
};

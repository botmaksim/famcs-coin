import apiClient from '../client';

export const WebService = {
  getHallOfFame: () => apiClient.get('/web/hall_of_fame'),
  auth: (user) => apiClient.post('/web/auth', user),
};

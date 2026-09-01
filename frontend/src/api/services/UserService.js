import apiClient from '../client';

export const UserService = {
  getProfile: () => apiClient.get('/user/profile'),
  click: (count) => apiClient.post('/user/click', { count }),
  updateSettings: (settings) => apiClient.post('/user/settings', settings),
};

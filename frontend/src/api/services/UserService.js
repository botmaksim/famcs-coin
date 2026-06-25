import apiClient from '../client';

export const UserService = {
  getProfile: (payload) => apiClient.post('/user/profile', payload),
  click: (count) => apiClient.post('/user/click', { count }),
  sleep: () => apiClient.post('/user/sleep'),
};

import apiClient from '../client';

export const SquadService = {
  getSquads: () => apiClient.get('/squads'),
  createSquad: (name) => apiClient.post('/squads/create', { name }),
  joinSquad: (squadId) => apiClient.post('/squads/join', { squad_id: squadId }),
  donate: (amount) => apiClient.post('/squads/donate', { amount }),
  boost: () => apiClient.post('/squads/boost'),
};

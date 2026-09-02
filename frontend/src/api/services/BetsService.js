import apiClient from '../client';

export const BetsService = {
  getActiveBets: () => apiClient.get('/bets'),
  placeBet: (eventId, optionIndex, amount) => apiClient.post('/bets/place', { event_id: parseInt(eventId), option_index: parseInt(optionIndex), amount: parseFloat(amount) }),
};

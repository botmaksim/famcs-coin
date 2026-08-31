import apiClient from '../client';

export const BetsService = {
  getActiveBets: () => apiClient.get('/bets/active'),
  placeBet: (eventId, chosenOption, amount) => apiClient.post('/bets/place', { event_id: eventId, chosen_option: chosenOption, amount }),
};

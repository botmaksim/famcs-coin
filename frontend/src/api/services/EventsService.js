import apiClient from '../client';

export const EventsService = {
  getQuizToday: () => apiClient.get('/quiz/today'),
  submitQuiz: (answer) => apiClient.post('/quiz/submit', { answer }),
  getActiveBets: () => apiClient.get('/bets/active'),
  placeBet: (eventId, chosenOption, amount) => apiClient.post('/bets/place', { event_id: eventId, chosen_option: chosenOption, amount }),
};

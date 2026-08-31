import apiClient from '../client';

export const FeedbackService = {
  submitFeedback: (message) => apiClient.post('/feedback', { message }),
  getFeedback: () => apiClient.get('/feedback'),
};

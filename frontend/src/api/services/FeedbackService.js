import apiClient from '../client';

export const FeedbackService = {
  submitFeedback: (text) => apiClient.post('/feedbacks', { text }),
  getFeedback: () => apiClient.get('/feedbacks'),
};

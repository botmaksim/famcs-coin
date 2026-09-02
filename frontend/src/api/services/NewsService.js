import apiClient from '../client';

const getVoterId = () => {
  let voterId = localStorage.getItem('famcs_voter_id');
  if (!voterId) {
    voterId = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem('famcs_voter_id', voterId);
  }
  return voterId;
};

export const NewsService = {
  getNews: () => {
    const voterId = getVoterId();
    return apiClient.get(`/news?voter_id=${voterId}`);
  },
  voteNews: (newsId, voteType) => {
    const voterId = getVoterId();
    return apiClient.post('/news/vote', {
      news_id: newsId,
      vote_type: voteType,
      voter_id: voterId
    });
  },
  createNews: (data) => apiClient.post('/admin/news', data),
  deleteNews: (id) => apiClient.delete(`/admin/news?id=${id}`),
};

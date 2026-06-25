import apiClient from '../client';

export const DaoService = {
  getProposals: () => apiClient.get('/dao/proposals'),
  vote: (proposalId, voteType) => apiClient.post('/dao/vote', { proposal_id: proposalId, vote_type: voteType }),
};

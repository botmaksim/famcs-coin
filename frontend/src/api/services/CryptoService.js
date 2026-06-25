import apiClient from '../client';

export const CryptoService = {
  getHistory: () => apiClient.get('/crypto/history'),
  bindWallet: (walletAddress) => apiClient.post('/crypto/wallet', { wallet_address: walletAddress }),
  withdraw: (amount) => apiClient.post('/crypto/withdraw', { amount }),
};

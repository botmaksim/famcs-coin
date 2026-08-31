import apiClient from '../client';

export const ShopService = {
  getItems: () => apiClient.get('/shop/items'),
  buyItem: (upgradeId) => apiClient.post('/shop/buy', { upgrade_id: upgradeId }),
  sellItem: (upgradeId, quantity = 1) => apiClient.post('/shop/sell', { upgrade_id: upgradeId, quantity }),
};

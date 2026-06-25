import apiClient from '../client';

export const ShopService = {
  getItems: () => apiClient.get('/shop/items'),
  buyItem: (upgradeId) => apiClient.post('/shop/buy', { upgrade_id: upgradeId }),
  getSkins: () => apiClient.get('/shop/skins'),
  buySkin: (skinId) => apiClient.post('/shop/skins/buy', { skin_id: skinId }),
  activateSkin: (skinId) => apiClient.post('/shop/skins/active', { skin_id: skinId }),
};

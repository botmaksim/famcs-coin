import axios from 'axios';

// Get API URL from env, or fallback to relative/absolute path
const API_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor to attach Telegram initData
apiClient.interceptors.request.use(
  (config) => {
    // Priority 1: Web Admin auth token
    if (localStorage.getItem('web_admin_auth')) {
      config.headers.Authorization = `Bearer ${localStorage.getItem('web_admin_auth')}`;
    } 
    // Priority 2: Web User JWT token
    else if (localStorage.getItem('web_user_token')) {
      config.headers.Authorization = `Bearer ${localStorage.getItem('web_user_token')}`;
    } 
    // Priority 3: TMA initData
    else if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      config.headers.Authorization = `tma ${window.Telegram.WebApp.initData}`;
    } 
    // Priority 4: Dev Mock
    else if (import.meta.env.DEV) {
      config.headers.Authorization = `tma ${import.meta.env.VITE_MOCK_INIT_DATA || 'test_dev_token'}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && (error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (window.Telegram && window.Telegram.WebApp) {
          // If we are in TMA, we just wait a bit or try to refresh initData/fallback (though Telegram handles initData updates externally usually).
          // You could fire a request to refresh a JWT token here if applicable.
          console.log('Session expired, triggering refresh rotation...');
          // Since it's a TMA, we'd normally just rely on Telegram's initData being valid or call an API to rotate JWT tokens if we're using them on the web side.
          
          if (localStorage.getItem('web_admin_auth') || localStorage.getItem('web_user_token')) {
             // Example refresh token rotation (to be implemented with actual endpoint)
             // const refreshRes = await axios.post(`${API_URL}/auth/refresh`);
             // localStorage.setItem('web_user_token', refreshRes.data.token);
             // originalRequest.headers.Authorization = `Bearer ${refreshRes.data.token}`;
             // return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
         console.error('Refresh token failed', refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

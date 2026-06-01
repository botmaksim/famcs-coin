import axios from 'axios';

// Get API URL from env, or fallback to relative/absolute path
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8083/api';

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

export default apiClient;

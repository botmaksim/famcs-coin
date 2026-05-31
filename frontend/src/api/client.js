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
    let initData = '';

    // Check if we are running inside Telegram Web App
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
      initData = window.Telegram.WebApp.initData;
    } else if (import.meta.env.DEV) {
      // Локальная разработка: используем мок-данные из .env
      initData = import.meta.env.VITE_MOCK_INIT_DATA || 'test_dev_token';
    }

    if (initData) {
      config.headers.Authorization = `Bearer ${initData}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

import '@testing-library/jest-dom';

// Mock Telegram WebApp
global.window.Telegram = {
  WebApp: {
    ready: vi.fn(),
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'Test',
        username: 'testuser'
      }
    },
    themeParams: {
      bg_color: '#ffffff',
      text_color: '#000000',
    }
  }
};

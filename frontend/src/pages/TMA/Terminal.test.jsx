import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Terminal from './Terminal';

// Mock the services and stores
vi.mock('../../api/services/UserService', () => ({
  UserService: {
    click: vi.fn().mockResolvedValue({}),
  },
  default: {
    click: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../api/services/ShopService', () => ({
  ShopService: {
    getItems: vi.fn().mockResolvedValue({ data: [] }),
    buyItem: vi.fn(),
  },
  default: {
    getItems: vi.fn().mockResolvedValue({ data: [] }),
    buyItem: vi.fn(),
  }
}));

vi.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: { balance: 100, energy: 50, max_energy: 1000 },
    updateLocalUser: vi.fn(),
  }),
}));

const queryClient = new QueryClient();

describe('Terminal Component', () => {
  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Terminal />
        </BrowserRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText(/Магазин улучшений/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Bets from './Bets';

vi.mock('../../api/services/BetsService', () => {
  return {
    default: {
      getBets: vi.fn().mockResolvedValue([]),
      placeBet: vi.fn(),
    }
  };
});

vi.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: { balance: 100, energy: 50, max_energy: 100 },
    updateLocalUser: vi.fn(),
  }),
}));

const queryClient = new QueryClient();

describe('Bets Component', () => {
  it('renders without crashing and shows title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Bets />
        </BrowserRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText(/Тотализатор/i)).toBeInTheDocument();
  });
});

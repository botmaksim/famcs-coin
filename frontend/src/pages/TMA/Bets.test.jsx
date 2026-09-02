import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Bets from './Bets';

vi.mock('../../api/services/BetsService', () => ({
  BetsService: {
    getBets: vi.fn().mockResolvedValue({ data: [] }),
    getActiveBets: vi.fn().mockResolvedValue({ data: [] }),
    placeBet: vi.fn(),
  }
}));

vi.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: { balance: 100, energy: 50, max_energy: 100 },
    updateLocalUser: vi.fn(),
    fetchProfile: vi.fn(),
  }),
}));

const queryClient = new QueryClient();

describe('Bets Component', () => {
  it('renders without crashing and shows title', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Bets />
        </BrowserRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Тотализатор/i)).toBeInTheDocument();
    });
  });
});

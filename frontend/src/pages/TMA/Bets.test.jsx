import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Bets from './Bets';
import { BetsService } from '../../api/services/BetsService';

let mockUser = { balance: 1500, energy: 50, max_energy: 100 };

vi.mock('../../api/services/BetsService', () => ({
  BetsService: {
    getBets: vi.fn(),
    getActiveBets: vi.fn(),
    placeBet: vi.fn(),
  }
}));

vi.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    updateLocalUser: vi.fn(),
    fetchProfile: vi.fn(),
  }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('Bets Component', () => {
  it('renders without crashing and shows title', async () => {
    vi.mocked(BetsService.getActiveBets).mockResolvedValueOnce({ data: [] });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <BrowserRouter>
          <Bets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Тотализатор/i)).toBeInTheDocument();
    });
  });

  it('filters out quick bet amounts greater than user balance (does not offer 2500 when balance is 1500)', async () => {
    mockUser = { balance: 1500, energy: 50, max_energy: 100 };

    const mockEvent = {
      id: 1,
      title: 'Экзамен по Матанализу',
      description: 'Кто сдаст на 10?',
      options: ['Иванов', 'Петров'],
      status: 'open',
      closes_at: new Date(Date.now() + 86400000).toISOString(),
      pools: [1000, 2000],
      user_bet_amount: 0,
      user_bet_option_index: null,
    };

    vi.mocked(BetsService.getActiveBets).mockResolvedValueOnce({ data: [mockEvent] });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <BrowserRouter>
          <Bets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Экзамен по Матанализу')).toBeInTheDocument();
    });

    // 100, 500, 1000 should be offered
    expect(screen.getByRole('button', { name: '100' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '500' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: (1000).toLocaleString() })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(`Все \\(${ (1500).toLocaleString() }\\)`, 'i') })).toBeInTheDocument();

    // 2500 should NOT be offered because user balance is 1500
    expect(screen.queryByRole('button', { name: (2500).toLocaleString() })).not.toBeInTheDocument();
  });

  it('displays personal bet amount and won outcome when event is resolved with win', async () => {
    mockUser = { balance: 3000, energy: 50, max_energy: 100 };

    const mockEvent = {
      id: 2,
      title: 'Матч по футболу ФПМИ',
      description: 'Финал кубка',
      options: ['1 курс', '2 курс'],
      status: 'resolved',
      closes_at: new Date(Date.now() - 86400000).toISOString(),
      winning_option_index: 0,
      pools: [500, 1000],
      user_bet_amount: 500,
      user_bet_option_index: 0,
      user_bet_payout: 1500,
    };

    vi.mocked(BetsService.getActiveBets).mockResolvedValueOnce({ data: [mockEvent] });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <BrowserRouter>
          <Bets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Матч по футболу ФПМИ')).toBeInTheDocument();
    });

    // Should indicate win, calculated profit (+1000) and personal bet
    expect(screen.getByText(/Ставка сыграла! Вы выиграли/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\+1[,\s]000 FC/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1[,\s]500 FC/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Поставили лично: 500 FC/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/\+-/)).not.toBeInTheDocument();
  });

  it('displays personal bet amount and lost outcome when event is resolved with loss', async () => {
    mockUser = { balance: 2000, energy: 50, max_energy: 100 };

    const mockEvent = {
      id: 3,
      title: 'Шахматный турнир',
      description: 'Кто победит?',
      options: ['Алиса', 'Боб'],
      status: 'resolved',
      closes_at: new Date(Date.now() - 86400000).toISOString(),
      winning_option_index: 1, // Bob won
      pools: [500, 500],
      user_bet_amount: 500,
      user_bet_option_index: 0, // User bet on Alice
      user_bet_payout: 0,
    };

    vi.mocked(BetsService.getActiveBets).mockResolvedValueOnce({ data: [mockEvent] });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <BrowserRouter>
          <Bets />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Шахматный турнир')).toBeInTheDocument();
    });

    // Should indicate loss and personal bet
    expect(screen.getByText(/Ставка не сыграла/i)).toBeInTheDocument();
    expect(screen.getAllByText(/-500 FC/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Поставили лично: 500 FC/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/\+-/)).not.toBeInTheDocument();
  });
});

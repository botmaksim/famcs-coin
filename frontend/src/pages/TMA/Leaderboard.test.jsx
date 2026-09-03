import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Leaderboard from './Leaderboard';
import { LeaderboardService } from '../../api/services/LeaderboardService';

vi.mock('../../api/services/LeaderboardService', () => ({
  LeaderboardService: {
    getLeaderboard: vi.fn(),
  },
}));

vi.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: { tg_id: 111, username: 'tester' },
  }),
}));

describe('Leaderboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders negative profit as minus and never as +-', async () => {
    const mockUsers = [
      { tg_id: 1, username: 'winner_guy', bets_profit: 2500, balance: 10000, passive_income: 100 },
      { tg_id: 2, username: 'loser_guy', bets_profit: -1500, balance: 5000, passive_income: 50 },
      { tg_id: 3, username: 'zero_guy', bets_profit: 0, balance: 2000, passive_income: 20 },
    ];

    vi.mocked(LeaderboardService.getLeaderboard).mockResolvedValue({ data: mockUsers });

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('winner_guy')).toBeInTheDocument();
    });

    // Switch to 'Профит со ставок' tab
    const profitTab = screen.getByText('Профит со ставок');
    fireEvent.click(profitTab);

    await waitFor(() => {
      // Must not contain "+-" anywhere on the page
      expect(screen.queryByText(/\+-/)).not.toBeInTheDocument();
      // Negative profit should be formatted with minus
      expect(screen.getAllByText(/-1[,\s]500/i).length).toBeGreaterThan(0);
      // Positive profit formatted with plus
      expect(screen.getAllByText(/\+2[,\s]500/i).length).toBeGreaterThan(0);
    });
  });
});

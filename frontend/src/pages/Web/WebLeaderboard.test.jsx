import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import WebLeaderboard from './WebLeaderboard';
import { LeaderboardService } from '../../api/services/LeaderboardService';

vi.mock('../../api/services/LeaderboardService', () => ({
  LeaderboardService: {
    getWebLeaderboard: vi.fn(),
  },
}));

describe('WebLeaderboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders usernames without @ and formats negative profit with minus and not +-', async () => {
    const mockPlayers = [
      { tg_id: 1, username: 'pavel_durov', bets_profit: 3000, balance: 10000 },
      { tg_id: 2, username: 'nikolai_durov', bets_profit: -1200, balance: 8000 },
      { tg_id: 3, username: 'alice', bets_profit: 0, balance: 6000 },
      { tg_id: 4, username: 'bob_loser', bets_profit: -750, balance: 4000 },
    ];

    vi.mocked(LeaderboardService.getWebLeaderboard).mockResolvedValue({ data: mockPlayers });

    render(<WebLeaderboard />);

    await waitFor(() => {
      expect(screen.getByText('pavel_durov')).toBeInTheDocument();
    });

    // Check no '@' prefix in rendered usernames
    expect(screen.queryByText('@pavel_durov')).not.toBeInTheDocument();
    expect(screen.queryByText('@nikolai_durov')).not.toBeInTheDocument();

    // Switch to bets_profit sort
    const profitTab = screen.getByRole('button', { name: /профит со ставок/i });
    fireEvent.click(profitTab);

    await waitFor(() => {
      // Must not contain "+-" anywhere
      expect(screen.queryByText(/\+-/)).not.toBeInTheDocument();
      // Negative numbers should have minus
      expect(screen.getAllByText(/-1[,\s]200/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/-750/i).length).toBeGreaterThan(0);
      // Positive numbers should have plus
      expect(screen.getAllByText(/\+3[,\s]000/i).length).toBeGreaterThan(0);
    });
  });
});

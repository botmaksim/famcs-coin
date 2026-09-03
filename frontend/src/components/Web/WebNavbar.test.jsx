import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WebNavbar from './WebNavbar';

let mockUser = null;
let mockIsDark = false;

vi.mock('../../context/UserContext', () => ({
  useUser: () => ({
    user: mockUser,
    fetchProfile: vi.fn(),
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: mockIsDark,
    toggleTheme: vi.fn(),
  }),
}));

describe('WebNavbar Component', () => {
  it('does NOT render a login button anywhere', () => {
    mockUser = null;
    render(
      <BrowserRouter>
        <WebNavbar />
      </BrowserRouter>
    );

    expect(screen.queryByRole('button', { name: /войти/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/войти/i)).not.toBeInTheDocument();
  });

  it('renders brand and navigation links', () => {
    mockUser = null;
    render(
      <BrowserRouter>
        <WebNavbar />
      </BrowserRouter>
    );

    expect(screen.getByText('FAMCS')).toBeInTheDocument();
    expect(screen.getByText('Информация')).toBeInTheDocument();
    expect(screen.getByText('Рейтинг')).toBeInTheDocument();
    expect(screen.getByText('Новости')).toBeInTheDocument();
  });

  it('renders authenticated username without @ symbol', () => {
    mockUser = { username: 'botmaksimmon', tg_id: 123456 };
    render(
      <BrowserRouter>
        <WebNavbar />
      </BrowserRouter>
    );

    expect(screen.getByText('botmaksimmon')).toBeInTheDocument();
    expect(screen.queryByText('@botmaksimmon')).not.toBeInTheDocument();
  });

  it('toggles mobile menu dropdown when mobile button is clicked', () => {
    mockUser = null;
    const { container } = render(
      <BrowserRouter>
        <WebNavbar />
      </BrowserRouter>
    );

    // Click hamburger button
    const menuBtn = container.querySelector('button.md\\:hidden');
    expect(menuBtn).toBeInTheDocument();

    fireEvent.click(menuBtn);

    // In mobile menu dropdown, links should be rendered
    const links = screen.getAllByRole('link', { name: /информация/i });
    expect(links.length).toBeGreaterThanOrEqual(2); // One desktop, one mobile
  });
});

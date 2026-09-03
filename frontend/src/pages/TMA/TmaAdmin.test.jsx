import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TmaAdmin from './TmaAdmin';
import { useUser } from '../../context/UserContext';
import { AdminService } from '../../api/services/AdminService';
import { BetsService } from '../../api/services/BetsService';
import { ShopService } from '../../api/services/ShopService';
import { FeedbackService } from '../../api/services/FeedbackService';
import { NewsService } from '../../api/services/NewsService';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../context/UserContext');
vi.mock('../../api/services/AdminService');
vi.mock('../../api/services/BetsService');
vi.mock('../../api/services/ShopService');
vi.mock('../../api/services/FeedbackService');
vi.mock('../../api/services/NewsService');

describe('TmaAdmin Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    BetsService.getActiveBets.mockResolvedValue({ data: [] });
    ShopService.getItems.mockResolvedValue({ data: [] });
    FeedbackService.getFeedback.mockResolvedValue({ data: [] });
    NewsService.getNews.mockResolvedValue({ data: [] });
    NewsService.getNewsHeader.mockResolvedValue({ data: { title: 'News', subtitle: '', banner: '' } });
    AdminService.getUsers.mockResolvedValue({
      data: [
        { tg_id: 111, username: 'superboss', role: 'superadmin' },
        { tg_id: 222, username: 'modguy', role: 'admin' },
        { tg_id: 333, username: 'student1', role: 'user' },
      ],
    });
  });

  it('renders for admin without Roles tab', async () => {
    useUser.mockReturnValue({
      user: { tg_id: 222, username: 'modguy', role: 'admin' },
      fetchProfile: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ToastProvider>
          <TmaAdmin />
        </ToastProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Администратор')).toBeInTheDocument();
    expect(screen.getByText('Ставки')).toBeInTheDocument();
    expect(screen.getByText('Магазин')).toBeInTheDocument();
    expect(screen.getByText('Отзывы')).toBeInTheDocument();
    expect(screen.getByText('Новости')).toBeInTheDocument();

    // Roles tab should not be visible for regular admin
    expect(screen.queryByText('Роли')).not.toBeInTheDocument();
  });

  it('renders for superadmin with Roles tab and allows opening roles management', async () => {
    useUser.mockReturnValue({
      user: { tg_id: 111, username: 'superboss', role: 'superadmin' },
      fetchProfile: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ToastProvider>
          <TmaAdmin />
        </ToastProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Суперадминистратор')).toBeInTheDocument();

    // Roles tab should be present for superadmin
    const rolesTab = screen.getByText('Роли');
    expect(rolesTab).toBeInTheDocument();

    // Click roles tab
    rolesTab.click();

    await waitFor(() => {
      expect(screen.getByText('Управление доступом и ролями')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Поиск по нику, @username или Telegram ID...')).toBeInTheDocument();
      expect(screen.getByText('@superboss')).toBeInTheDocument();
      expect(screen.getByText('@modguy')).toBeInTheDocument();
      expect(screen.getByText('@student1')).toBeInTheDocument();
    });

    // Check that current user has "Вы" badge
    expect(screen.getByText('Вы')).toBeInTheDocument();
  });
});

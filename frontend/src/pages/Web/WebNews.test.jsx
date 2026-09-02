import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import WebNews from './WebNews';
import { NewsService } from '../../api/services/NewsService';
import { useUser } from '../../context/UserContext';

vi.mock('../../api/services/NewsService', () => ({
  NewsService: {
    getNews: vi.fn(),
    getNewsHeader: vi.fn(),
    voteNews: vi.fn(),
    createNews: vi.fn(),
    updateNews: vi.fn(),
    closePoll: vi.fn(),
    deleteNews: vi.fn(),
    updateNewsHeader: vi.fn(),
  },
}));

vi.mock('../../context/UserContext', () => ({
  useUser: vi.fn(),
}));

describe('WebNews Component', () => {
  const mockNews = [
    {
      id: 1,
      title: 'Клановые битвы',
      content: 'Добавим кланы и соревнования между курсами',
      status: 'open',
      likes_count: 10,
      dislikes_count: 2,
      user_vote: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Новые карточки в магазине',
      content: 'Добавление уникальных скинов монет',
      status: 'in_progress',
      verdict: 'Принято в спринт #2',
      verdict_note: 'Релиз на следующей неделе',
      likes_count: 25,
      dislikes_count: 1,
      user_vote: 'like',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Старый опрос',
      content: 'Уже закрытая тема',
      status: 'closed',
      likes_count: 5,
      dislikes_count: 15,
      user_vote: null,
      created_at: new Date().toISOString(),
    }
  ];

  const mockHeader = {
    title: 'Новости и Планы FAMCS',
    subtitle: 'Голосуйте за лучшие идеи для игры',
    banner: 'Внимание: скоро большой апдейт!'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useUser.mockReturnValue({ user: { id: 123, role: 'user' } });
    NewsService.getNews.mockResolvedValue({ data: mockNews });
    NewsService.getNewsHeader.mockResolvedValue({ data: mockHeader });
    NewsService.voteNews.mockResolvedValue({
      data: {
        status: 'ok',
        news_id: 1,
        likes_count: 11,
        dislikes_count: 2,
        user_vote: 'like',
      }
    });
  });

  it('renders dynamic header title, subtitle and announcement banner', async () => {
    render(<WebNews />);

    await waitFor(() => {
      expect(screen.getByText('Новости и Планы FAMCS')).toBeInTheDocument();
    });

    expect(screen.getByText('Голосуйте за лучшие идеи для игры')).toBeInTheDocument();
    expect(screen.getByText(/Внимание: скоро большой апдейт!/i)).toBeInTheDocument();
  });

  it('renders news cards with status badges and admin verdict notes', async () => {
    render(<WebNews />);

    await waitFor(() => {
      expect(screen.getByText('Клановые битвы')).toBeInTheDocument();
    });

    expect(screen.getByText('Открытое голосование')).toBeInTheDocument();
    expect(screen.getByText('В разработке')).toBeInTheDocument();
    expect(screen.getByText('Опрос завершён')).toBeInTheDocument();

    // Verdict callout
    expect(screen.getByText(/Принято в спринт #2/i)).toBeInTheDocument();
    expect(screen.getByText(/Релиз на следующей неделе/i)).toBeInTheDocument();
  });

  it('allows voting on open polls', async () => {
    render(<WebNews />);

    await waitFor(() => {
      expect(screen.getByText('Клановые битвы')).toBeInTheDocument();
    });

    const likeButtons = screen.getAllByRole('button', { name: /Нравится/i });
    fireEvent.click(likeButtons[0]);

    await waitFor(() => {
      expect(NewsService.voteNews).toHaveBeenCalledWith(1, 'like');
    });
  });

  it('disables voting on closed polls', async () => {
    render(<WebNews />);

    await waitFor(() => {
      expect(screen.getByText('Старый опрос')).toBeInTheDocument();
    });

    const closedBadges = screen.getAllByText('Опрос закрыт');
    expect(closedBadges.length).toBeGreaterThan(0);
  });

  it('displays admin buttons when user is admin', async () => {
    useUser.mockReturnValue({ user: { id: 1, role: 'admin' } });
    render(<WebNews />);

    await waitFor(() => {
      expect(screen.getByText('Создать новость / опрос')).toBeInTheDocument();
    });

    expect(screen.getByText('Изменить текст в начале')).toBeInTheDocument();
    expect(screen.getAllByTitle('Подвести итоги или закрыть голосование').length).toBeGreaterThan(0);
  });
});

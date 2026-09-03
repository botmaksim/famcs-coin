import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { useAutoRefresh, triggerGlobalRefresh } from './useAutoRefresh';

const TestComponent = ({ onRefresh }) => {
  useAutoRefresh(onRefresh);
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate('/other')}>Go to other</button>
    </div>
  );
};

describe('useAutoRefresh hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls refresh callback on initial mount', () => {
    const onRefresh = vi.fn();
    render(
      <BrowserRouter>
        <TestComponent onRefresh={onRefresh} />
      </BrowserRouter>
    );

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls refresh callback when route changes', () => {
    const onRefresh = vi.fn();
    const { getByText } = render(
      <BrowserRouter>
        <TestComponent onRefresh={onRefresh} />
      </BrowserRouter>
    );

    expect(onRefresh).toHaveBeenCalledTimes(1);

    act(() => {
      getByText('Go to other').click();
    });

    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it('calls refresh callback on app:refresh custom event', () => {
    const onRefresh = vi.fn();
    render(
      <BrowserRouter>
        <TestComponent onRefresh={onRefresh} />
      </BrowserRouter>
    );

    expect(onRefresh).toHaveBeenCalledTimes(1);

    act(() => {
      triggerGlobalRefresh();
    });

    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it('calls refresh callback on focus and visibilitychange when visible', () => {
    const onRefresh = vi.fn();
    render(
      <BrowserRouter>
        <TestComponent onRefresh={onRefresh} />
      </BrowserRouter>
    );

    expect(onRefresh).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(onRefresh).toHaveBeenCalledTimes(2);

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(onRefresh).toHaveBeenCalledTimes(3);
  });
});

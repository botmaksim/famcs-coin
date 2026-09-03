import { useEffect } from 'react';
import { useLocation, useInRouterContext } from 'react-router-dom';

/**
 * Hook to automatically invoke a refresh function when:
 * 1. The route/location changes (tab transition)
 * 2. Window gains focus or document becomes visible (user returns to app)
 * 3. A global 'app:refresh' event is fired (e.g. from nav click or WebSocket update)
 */
export const useAutoRefresh = (refreshFn) => {
  const inRouter = useInRouterContext();
  const location = inRouter ? useLocation() : null;

  useEffect(() => {
    if (typeof refreshFn === 'function') {
      refreshFn();
    }
  }, [location?.pathname, location?.key, refreshFn]);

  useEffect(() => {
    const handleRefresh = () => {
      if (document.visibilityState === 'visible' && typeof refreshFn === 'function') {
        refreshFn();
      }
    };

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);
    window.addEventListener('app:refresh', handleRefresh);

    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
      window.removeEventListener('app:refresh', handleRefresh);
    };
  }, [refreshFn]);
};

export const triggerGlobalRefresh = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:refresh'));
  }
};

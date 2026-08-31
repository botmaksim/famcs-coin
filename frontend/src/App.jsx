import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Context & Hooks
import { UserProvider, useUser } from './context/UserContext';
import { useAppWebSocket } from './hooks/useAppWebSocket';

// Layouts
import { WebLayout } from './components/Web/WebLayout';
import { TmaLayout } from './components/TMA/TmaLayout';

// Direct Imports (TMA Core)
import Terminal from './pages/TMA/Terminal';
import Bets from './pages/TMA/Bets';
import Profile from './pages/TMA/Profile';
import Feedback from './pages/TMA/Feedback';

// Direct Imports (Web Core)
import WebLanding from './pages/Web/WebLanding';

// Lazy Loaded Components
const WebInfo = lazy(() => import('./pages/Web/WebInfo'));
const WebAdmin = lazy(() => import('./pages/Web/WebAdmin'));
const WebLeaderboard = lazy(() => import('./pages/Web/WebLeaderboard'));
const WebFeedback = lazy(() => import('./pages/Web/WebFeedback'));

const FallbackComponent = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center bg-slate-50 dark:bg-slate-900 font-sans">
    <h2 className="text-red-500 mb-2">Что-то пошло не так</h2>
    <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">{error.message}</p>
    <button 
      onClick={resetErrorBoundary}
      className="bg-orange-500 text-white px-4 py-2 rounded-lg"
    >
      Попробовать снова
    </button>
  </div>
);

const TmaGuard = ({ children }) => {
  const isTelegram = window.Telegram?.WebApp?.initData?.length > 0;
  const isLocalDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;
  return (isTelegram || isLocalDev) ? children : <Navigate to="/" replace />;
};

const AdminGuard = ({ children }) => {
  const { user } = useUser();
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const WebSocketProvider = ({ children }) => {
  useAppWebSocket();
  return <>{children}</>;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Theme setup
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const tg = window.Telegram?.WebApp;
    
    if (tg?.colorScheme === 'dark' || isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const isTelegram = tg && tg.initData && tg.initData.length > 0;

    if (isTelegram) {
      tg.ready();
      tg.expand();
      
      // Auto update theme on change in TG
      tg.onEvent('themeChanged', () => {
        if (tg.colorScheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      });
      
      if (location.pathname === '/') {
        navigate('/app/terminal', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <Suspense fallback={<div className="text-slate-500 p-5 text-center">Загрузка...</div>}>
        <UserProvider>
          <WebSocketProvider>
            <Routes>
              <Route path="/" element={<WebLayout><WebLanding /></WebLayout>} />
              <Route path="/info" element={<WebLayout><WebInfo /></WebLayout>} />
              <Route path="/leaderboard" element={<WebLayout><WebLeaderboard /></WebLayout>} />
              <Route path="/feedback" element={<WebLayout><WebFeedback /></WebLayout>} />
              <Route path="/admin-panel" element={<WebLayout><WebAdmin /></WebLayout>} />
              
              <Route path="/app/*" element={
                <TmaGuard>
                  <ErrorBoundary FallbackComponent={FallbackComponent}>
                    <Routes>
                      <Route path="terminal" element={<TmaLayout><Terminal /></TmaLayout>} />
                      <Route path="bets" element={<TmaLayout><Bets /></TmaLayout>} />
                      <Route path="profile" element={<TmaLayout><Profile /></TmaLayout>} />
                      <Route path="feedback" element={<TmaLayout><Feedback /></TmaLayout>} />
                      <Route path="*" element={<Navigate to="terminal" replace />} />
                    </Routes>
                  </ErrorBoundary>
                </TmaGuard>
              } />
            </Routes>
          </WebSocketProvider>
        </UserProvider>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
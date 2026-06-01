import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Terminal from './pages/TMA/Terminal';
import College from './pages/TMA/College';
import Leaderboard from './pages/TMA/Leaderboard';
import DAO from './pages/TMA/DAO';
import Tasks from './pages/TMA/Tasks';
import Events from './pages/TMA/Events';
import AcceptInvite from './pages/Web/AcceptInvite';
import WebDAO from './pages/Web/WebDAO';
import { WebLayout } from './components/Web/WebLayout';
import { TmaLayout } from './components/TMA/TmaLayout';

const Wallet = lazy(() => import('./pages/TMA/Wallet'));
const WebInfo = lazy(() => import('./pages/Web/WebInfo'));
const WebAdmin = lazy(() => import('./pages/Web/WebAdmin'));
const WebLeaderboard = lazy(() => import('./pages/Web/WebLeaderboard'));
const WebHallOfFame = lazy(() => import('./pages/Web/WebHallOfFame'));

const TmaGuard = ({ children }) => {
  const isTelegram = window.Telegram?.WebApp?.initData?.length > 0;
  // Fallback for local development if initData is mocked
  const isLocalDev = process.env.NODE_ENV === 'development';
  return (isTelegram || isLocalDev) ? children : <Navigate to="/info" replace />;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Инициализация Telegram Web App
    const tg = window.Telegram?.WebApp;
    
    // Check if we are inside Telegram by checking initData
    const isTelegram = tg && tg.initData && tg.initData.length > 0;

    if (isTelegram) {
      tg.ready();
      tg.expand(); // Открываем приложение на весь экран
      
      // Redirect to /app/terminal if we are at root
      if (location.pathname === '/') {
        navigate('/app/terminal', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return (
    <Suspense fallback={<div style={{color: 'white', padding: '20px', textAlign: 'center'}}>Загрузка приложения...</div>}>
      <UserProvider>
        <Routes>
          <Route path="/" element={<WebLayout><WebInfo /></WebLayout>} />
          <Route path="/info" element={<WebLayout><WebInfo /></WebLayout>} />
          <Route path="/docs" element={<WebLayout><WebInfo /></WebLayout>} />
          <Route path="/leaderboard" element={<WebLayout><WebLeaderboard /></WebLayout>} />
          <Route path="/hall-of-fame" element={<WebLayout><WebHallOfFame /></WebLayout>} />
          <Route path="/dao" element={<WebLayout><WebDAO /></WebLayout>} />
          <Route path="/admin-panel" element={<WebLayout><WebAdmin /></WebLayout>} />
          <Route path="/invite" element={<WebLayout><AcceptInvite /></WebLayout>} />
          
          <Route path="/app/*" element={
            <TmaGuard>
              <Routes>
                <Route path="terminal" element={<TmaLayout><Terminal /></TmaLayout>} />
                <Route path="tasks" element={<TmaLayout><Tasks /></TmaLayout>} />
                <Route path="events" element={<TmaLayout><Events /></TmaLayout>} />
                <Route path="college" element={<TmaLayout><College /></TmaLayout>} />
                <Route path="leaderboard" element={<TmaLayout><Leaderboard /></TmaLayout>} />
                <Route path="dao" element={<TmaLayout><DAO /></TmaLayout>} />
                <Route path="wallet" element={<TmaLayout><Wallet /></TmaLayout>} />
                <Route path="*" element={<Navigate to="terminal" replace />} />
              </Routes>
            </TmaGuard>
          } />
        </Routes>
      </UserProvider>
    </Suspense>
  );
}

export default App;
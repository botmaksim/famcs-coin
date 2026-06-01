import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
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
import WebLanding from './pages/Web/WebLanding';

const Wallet = lazy(() => import('./pages/TMA/Wallet'));
const WebInfo = lazy(() => import('./pages/Web/WebInfo'));
const WebAdmin = lazy(() => import('./pages/Web/WebAdmin'));
const WebLeaderboard = lazy(() => import('./pages/Web/WebLeaderboard'));
const WebHallOfFame = lazy(() => import('./pages/Web/WebHallOfFame'));

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

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const isTelegram = tg && tg.initData && tg.initData.length > 0;

    if (isTelegram) {
      tg.ready();
      tg.expand();
      
      if (location.pathname === '/') {
        navigate('/app/terminal', { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return (
    <Suspense fallback={<div className="text-slate-500 p-5 text-center">Загрузка...</div>}>
      <UserProvider>
        <Routes>
          <Route path="/" element={<WebLayout><WebLanding /></WebLayout>} />
          <Route path="/info" element={<WebLayout><WebInfo /></WebLayout>} />
          <Route path="/leaderboard" element={<WebLayout><WebLeaderboard /></WebLayout>} />
          <Route path="/hall-of-fame" element={<WebLayout><WebHallOfFame /></WebLayout>} />
          <Route path="/dao" element={<WebLayout><WebDAO /></WebLayout>} />
          <Route path="/admin-panel" element={<AdminGuard><WebLayout><WebAdmin /></WebLayout></AdminGuard>} />
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
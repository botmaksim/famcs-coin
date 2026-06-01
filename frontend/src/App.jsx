import { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Terminal from './pages/TMA/Terminal';
import College from './pages/TMA/College';
import Leaderboard from './pages/TMA/Leaderboard';
import DAO from './pages/TMA/DAO';
import Tasks from './pages/TMA/Tasks';
import Events from './pages/TMA/Events';
import { useUser } from './context/UserContext';
import AcceptInvite from './pages/Web/AcceptInvite';
import WebDAO from './pages/Web/WebDAO';

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

function TMA_Layout() {
  const [currentPage, setCurrentPage] = useState('terminal');
  const { user } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const renderPage = () => {
    switch (currentPage) {
      case 'terminal': return <Terminal />;
      case 'tasks': return <Tasks />;
      case 'events': return <Events />;
      case 'college': return <College />;
      case 'leaderboard': return <Leaderboard />;
      case 'dao': return <DAO />;
      case 'wallet': return <Wallet />;
      default: return <Terminal />;
    }
  };

  return (
    <div className="app-container" style={{ 
      maxWidth: '480px', 
      margin: '0 auto', 
      minHeight: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      backgroundColor: 'var(--bg-color)',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      paddingBottom: '70px',
      borderLeft: '1px solid var(--glass-border)',
      borderRight: '1px solid var(--glass-border)',
    }}>
      <Suspense fallback={<div style={{color: 'white', padding: '20px', textAlign: 'center'}}>Загрузка...</div>}>
        {renderPage()}
      </Suspense>
      
      {/* Bottom Navigation */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65px',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div 
          onClick={() => setCurrentPage('terminal')}
          style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', fontWeight: currentPage === 'terminal' ? 'bold' : 'normal', color: currentPage === 'terminal' ? 'var(--accent-color)' : '#94a3b8' }}>
          Тап
        </div>
        <div 
          onClick={() => setCurrentPage('tasks')}
          style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', fontWeight: currentPage === 'tasks' ? 'bold' : 'normal', color: currentPage === 'tasks' ? 'var(--accent-color)' : '#94a3b8' }}>
          Earn
        </div>
        <div 
          onClick={() => setCurrentPage('events')}
          style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', fontWeight: currentPage === 'events' ? 'bold' : 'normal', color: currentPage === 'events' ? 'var(--accent-color)' : '#94a3b8' }}>
          Ивенты
        </div>
        <div 
          onClick={() => setCurrentPage('college')}
          style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', fontWeight: currentPage === 'college' ? 'bold' : 'normal', color: currentPage === 'college' ? 'var(--accent-color)' : '#94a3b8' }}>
          Универ
        </div>
        <div 
          onClick={() => setCurrentPage('leaderboard')}
          style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', fontWeight: currentPage === 'leaderboard' ? 'bold' : 'normal', color: currentPage === 'leaderboard' ? 'var(--accent-color)' : '#94a3b8' }}>
          Топ
        </div>
        <div 
          onClick={() => setCurrentPage('dao')}
          style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', fontWeight: currentPage === 'dao' ? 'bold' : 'normal', color: currentPage === 'dao' ? 'var(--accent-color)' : '#94a3b8' }}>
          DAO
        </div>
        <div 
          onClick={() => setCurrentPage('wallet')}
          style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', fontWeight: currentPage === 'wallet' ? 'bold' : 'normal', color: currentPage === 'wallet' ? 'var(--accent-color)' : '#94a3b8' }}>
          💳
        </div>
      </div>
    </div>
  );
}

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
      
      // Redirect to /app if we are at root
      if (location.pathname === '/') {
        navigate('/app', { replace: true });
      }
    } else {
      // If NOT in Telegram, ensure we are not in /app routes accidentally unless explicitly testing
      // Actually we just let them view / if they are not in Telegram
    }
  }, [navigate, location.pathname]);

  return (
    <Suspense fallback={<div style={{color: 'white', padding: '20px', textAlign: 'center'}}>Загрузка приложения...</div>}>
      <Routes>
        <Route path="/" element={<WebInfo />} />
        <Route path="/info" element={<WebInfo />} />
        <Route path="/docs" element={<WebInfo />} />
        <Route path="/leaderboard" element={<WebLeaderboard />} />
        <Route path="/hall-of-fame" element={<WebHallOfFame />} />
        <Route path="/dao" element={<WebDAO />} />
        <Route path="/admin-panel" element={
          <UserProvider>
            <WebAdmin />
          </UserProvider>
        } />
        <Route path="/invite" element={<AcceptInvite />} />
        <Route path="/app/*" element={
          <TmaGuard>
            <UserProvider>
              <TMA_Layout />
            </UserProvider>
          </TmaGuard>
        } />
      </Routes>
    </Suspense>
  );
}

export default App;
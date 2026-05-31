import { useEffect, useState } from 'react';
import { UserProvider } from './context/UserContext';
import Terminal from './pages/TMA/Terminal';
import College from './pages/TMA/College';
import Leaderboard from './pages/TMA/Leaderboard';
import DAO from './pages/TMA/DAO';
import Tasks from './pages/TMA/Tasks';
import Events from './pages/TMA/Events';

import Admin from './pages/TMA/Admin';
import { useUser } from './context/UserContext';

function AppContent({ currentPage, setCurrentPage, renderPage }) {
  const { user } = useUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

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
      {renderPage()}
      
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
        {isAdmin && (
          <div 
            onClick={() => setCurrentPage('admin')}
            style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', fontWeight: currentPage === 'admin' ? 'bold' : 'normal', color: currentPage === 'admin' ? '#ef4444' : '#94a3b8' }}>
            👑
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [tgTheme, setTgTheme] = useState({});
  const [currentPage, setCurrentPage] = useState('terminal');

  useEffect(() => {
    // Инициализация Telegram Web App
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand(); // Открываем приложение на весь экран

      // Сохраняем тему для стилизации, если необходимо (например, передать в CSS Variables)
      if (tg.themeParams) {
        setTgTheme(tg.themeParams);
        // Применяем цвета к document.body
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
        document.body.style.color = tg.themeParams.text_color || '#000000';
      }
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'terminal': return <Terminal />;
      case 'tasks': return <Tasks />;
      case 'events': return <Events />;
      case 'college': return <College />;
      case 'leaderboard': return <Leaderboard />;
      case 'dao': return <DAO />;
      case 'admin': return <Admin />;
      default: return <Terminal />;
    }
  };

  return (
    <UserProvider>
      <AppContent currentPage={currentPage} setCurrentPage={setCurrentPage} renderPage={renderPage} />
    </UserProvider>
  );
}

export default App;
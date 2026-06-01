import React from 'react';
import TmaHeader from './TmaHeader';
import TmaBottomNav from './TmaBottomNav';

export const TmaLayout = ({ children }) => (
  <div className="tma-container" style={{
    maxWidth: '480px', 
    margin: '0 auto', 
    minHeight: '100vh', 
    position: 'relative', 
    backgroundColor: 'var(--bg-color)',
    borderLeft: '1px solid var(--glass-border)',
    borderRight: '1px solid var(--glass-border)',
  }}>
    <TmaHeader />
    <div className="tma-scrollable-content" style={{ paddingBottom: '80px', height: 'calc(100vh - 130px)', overflowY: 'auto' }}>
      {children}
    </div>
    <TmaBottomNav />
  </div>
);

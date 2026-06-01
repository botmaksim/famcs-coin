import React from 'react';
import WebNavbar from './WebNavbar';
import WebFooter from './WebFooter';

export const WebLayout = ({ children }) => (
  <div className="web-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
    <WebNavbar />
    <main className="web-content" style={{ flex: 1, padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {children}
    </main>
    <WebFooter />
  </div>
);

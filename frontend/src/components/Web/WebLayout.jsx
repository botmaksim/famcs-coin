import React from 'react';
import WebNavbar from './WebNavbar';
import WebFooter from './WebFooter';

export const WebLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <WebNavbar />
    <main className="flex-1 p-5 max-w-[1200px] mx-auto w-full">
      {children}
    </main>
    <WebFooter />
  </div>
);

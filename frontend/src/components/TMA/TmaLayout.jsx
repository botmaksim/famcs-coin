import React from 'react';
import TmaHeader from './TmaHeader';
import TmaBottomNav from './TmaBottomNav';
import { OnboardingTour } from './OnboardingTour';
import { SplashScreen } from './SplashScreen';
import { useUser } from '../../context/UserContext';

export const TmaLayout = ({ children }) => {
  const { loading } = useUser();
  
  return (
    <div className="tma-container max-w-[480px] mx-auto h-screen flex flex-col relative bg-[var(--bg-color)] border-x border-[var(--glass-border)] overflow-hidden">
      <SplashScreen isLoading={loading} />
      <OnboardingTour />
      <TmaHeader />
      <div className="tma-scrollable-content flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        {children}
      </div>
      <TmaBottomNav />
    </div>
  );
};

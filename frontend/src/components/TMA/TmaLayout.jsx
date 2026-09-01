import React from 'react';
import TmaHeader from './TmaHeader';
import TmaBottomNav from './TmaBottomNav';
import { OnboardingTour } from './OnboardingTour';
import { SplashScreen } from './SplashScreen';
import { useUser } from '../../context/UserContext';

export const TmaLayout = ({ children }) => {
  const { loading } = useUser();
  
  return (
    <div className="tma-container max-w-[480px] mx-auto min-h-screen relative bg-[var(--bg-color)] border-x border-[var(--glass-border)]">
      <SplashScreen isLoading={loading} />
      <OnboardingTour />
      <TmaHeader />
      <div className="tma-scrollable-content pb-[80px] h-[calc(100vh-130px)] overflow-y-auto">
        {children}
      </div>
      <TmaBottomNav />
    </div>
  );
};

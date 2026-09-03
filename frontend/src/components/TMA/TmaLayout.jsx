import React, { useState, useEffect } from 'react';
import TmaHeader from './TmaHeader';
import TmaBottomNav from './TmaBottomNav';
import { OnboardingTour } from './OnboardingTour';
import { SplashScreen } from './SplashScreen';
import { TermsModal } from './TermsModal';
import { useUser } from '../../context/UserContext';

export const TmaLayout = ({ children }) => {
  const { loading } = useUser();
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    if (!loading) {
      const accepted = localStorage.getItem('famcs_terms_accepted');
      if (!accepted) {
        setShowTerms(true);
      }
    }
  }, [loading]);

  const handleAcceptTerms = () => {
    localStorage.setItem('famcs_terms_accepted', 'true');
    setShowTerms(false);
  };
  
  return (
    <div className="tma-container max-w-[480px] mx-auto h-screen flex flex-col relative bg-[var(--bg-color)] border-x border-[var(--glass-border)] overflow-hidden">
      <SplashScreen isLoading={loading} />
      <TermsModal isOpen={showTerms} onAccept={handleAcceptTerms} />
      {!showTerms && <OnboardingTour />}
      <TmaHeader />
      <div className="tma-scrollable-content flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        {children}
      </div>
      <TmaBottomNav />
    </div>
  );
};

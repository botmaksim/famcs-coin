import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';

export const OnboardingTour = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setRun(true);
      localStorage.setItem('hasSeenTour', 'true');
    }
  }, []);

  const steps = [
    {
      target: '.tma-container',
      content: 'Добро пожаловать в FAMCS Coin! Наш веб-сайт: coin.mybsu.online. Давай пройдем короткое обучение.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tap-button',
      content: 'Это твой главный инструмент. Тапай сюда, чтобы фармить коины вручную!',
    },
    {
      target: '.tour-energy',
      content: 'Твоя энергия. Каждый тап расходует 1 ед. энергии, но она быстро восстанавливается.',
    },
    {
      target: '.tour-shop',
      content: 'Здесь можно покупать улучшения, которые будут приносить пассивный доход каждую минуту, даже когда ты спишь!',
    },
    {
      target: '.nav-bets',
      content: 'Тут можно делать ставки на факультетские события и приумножать баланс.',
    },
    {
      target: '.nav-feedback',
      content: 'Оставляй свои идеи и отзывы разработчикам напрямую.',
    },
    {
      target: '.tma-header-profile',
      content: 'Кликай по своему имени или аватарке, чтобы открыть настройки профиля (скрыть себя из лидерборда или сменить имя).',
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={steps.map(s => ({ ...s, disableBeacon: true }))}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#f97316',
          textColor: '#333',
          zIndex: 1000,
        },
      }}
      locale={{
        back: 'Назад',
        close: 'Закрыть',
        last: 'Готово',
        next: 'Далее',
        skip: 'Пропустить',
      }}
    />
  );
};

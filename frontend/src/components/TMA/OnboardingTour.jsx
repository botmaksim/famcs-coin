import React, { useState, useEffect } from 'react';
import * as ReactJoyride from 'react-joyride';

const Joyride = ReactJoyride.default || ReactJoyride.Joyride || ReactJoyride;
const STATUS = ReactJoyride.STATUS || {};

export const OnboardingTour = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setRun(true);
    }
  }, []);

  const steps = [
    {
      target: '.tma-container',
      content: 'Добро пожаловать в FAMCS Coin! Давай пройдем короткое обучение.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.nav-terminal',
      content: 'Здесь ты можешь тапать и майнить монеты! У тебя есть энергия, которая тратится при тапах.',
    },
    {
      target: '.nav-tasks',
      content: 'В разделе "Задания" выполняй квесты и приглашай друзей, чтобы получать большие бонусы.',
    },
    {
      target: '.nav-events',
      content: 'Участвуй в тотализаторе и решай задачи дня, чтобы приумножить свой баланс.',
    },
    {
      target: '.nav-college',
      content: 'Покупай уникальные скины, которые дают пассивный доход.',
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

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb',
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

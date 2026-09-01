export const i18n = {
  ru: {
    tasks: {
      title: "Задания",
      subtitle: "Выполняй простые квесты и получай монеты!",
      inviteFriend: "Пригласи друга",
      inviteReward: "Получи {reward} за каждого друга!",
      copyLink: "Скопировать ссылку",
      copied: "Скопировано!",
      completed: "Выполнено",
      claimReward: "Выполнить (+{reward})",
      emptyTasks: "Заданий пока нет",
      errorLoading: "Не удалось загрузить задания",
    },
    shop: {
      buySuccess: "Скин успешно куплен!",
      buyError: "Ошибка при покупке скина",
      selectSuccess: "Скин выбран!",
      selectError: "Ошибка при выборе скина",
      active: "Активно",
      select: "Выбрать",
      buy: "Купить",
    }
  }
};

export const useTranslation = () => {
  // In a real app, you would determine language from a store or context
  const lang = 'ru'; 
  
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = i18n[lang];
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    
    if (typeof value === 'string') {
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(`{${k}}`, v),
        value
      );
    }
    return value || key;
  };
  
  return { t };
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export const TermsModal = ({ isOpen, onAccept, onClose, isReadonly = false }) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0">
                <ScrollText size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight truncate">
                  Публичная оферта и правила
                </h3>
                <p className="text-xs text-slate-400">
                  Пользовательское соглашение FAMCS Coin
                </p>
              </div>
            </div>
            {isReadonly && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                title="Закрыть"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Scrollable Terms Content */}
          <div className="p-4 sm:p-5 overflow-y-auto text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-3.5 leading-relaxed">
            {/* Warning Callout */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
              <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong>Образовательно-развлекательный проект:</strong> FAMCS Coin является студенческим симулятором. Внутриигровые коины не являются криптовалютой, ценной бумагой или платёжным средством.
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                  1. Статус виртуальных активов и отсутствие ликвидности
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  У проекта нет и не будет пула ликвидности. Внутриигровую валюту (FAMCS Coin / FC) невозможно вывести, обменять на реальные денежные средства (фиат) или продать за другие криптовалюты. Все операции производятся исключительно в рамках симулятора.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                  2. Изолированная среда
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Все механики кликера, магазина улучшений, тотализатора и рейтингов функционируют внутри изолированной базы данных проекта. Внешние блокчейны или финансовые расчётные центры не используются.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                  3. Отказ от ответственности (As is)
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Приложение предоставляется по принципу «как есть». Создатели и администрация факультета не несут финансовой, юридической или иной ответственности за потраченное время, виртуальные показатели, балансы или сбои в работе сервиса.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                  4. Честная игра и модерация
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  Запрещается использование вредоносных эксплойтов, скриптов нарушающих лимиты API, а также оскорбительное поведение в никнеймах и обратной связи. Модераторы вправе аннулировать результаты нарушителей.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {!isReadonly ? (
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-left">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-orange-500 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Я ознакомился с публичной офертой, понимаю игровой статус монет и согласен с правилами проекта.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!agreed}
                  onClick={onAccept}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-2xl shadow-xs text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Принять и продолжить</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Закрыть
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TermsModal;

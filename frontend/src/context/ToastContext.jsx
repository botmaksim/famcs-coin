import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showConfirm: () => Promise.resolve(false),
});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const triggerHaptic = (type = 'success') => {
    try {
      const haptic = window.Telegram?.WebApp?.HapticFeedback;
      if (haptic) {
        if (type === 'success') haptic.notificationOccurred('success');
        else if (type === 'error') haptic.notificationOccurred('error');
        else haptic.impactOccurred('light');
      }
    } catch (e) {}
  };

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    triggerHaptic(type);
    
    setToasts(prev => [...prev.slice(-3), { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message, duration = 3500) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration = 4000) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration = 3500) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const showConfirm = useCallback(({
    title = 'Подтверждение',
    message = 'Вы уверены?',
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    isDanger = false,
  }) => {
    triggerHaptic('info');
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        onConfirm: () => {
          triggerHaptic('success');
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  // Safe global fallback for window.alert so no raw browser popups appear
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      if (typeof msg === 'string') {
        const lower = msg.toLowerCase();
        if (lower.includes('успешно') || lower.includes('принята') || lower.includes('сохранен')) {
          showSuccess(msg);
        } else if (lower.includes('ошибка') || lower.includes('не удалось') || lower.includes('некоррект')) {
          showError(msg);
        } else {
          showInfo(msg);
        }
      } else {
        showInfo(String(msg));
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showSuccess, showError, showInfo]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showConfirm }}>
      {children}

      {/* Floating Toasts Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -25, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.92 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`pointer-events-auto flex items-center justify-between gap-3 w-full py-3 px-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all ${
                  isSuccess
                    ? 'bg-white/95 dark:bg-slate-800/95 border-emerald-500/40 text-slate-800 dark:text-white shadow-emerald-500/10'
                    : isError
                    ? 'bg-white/95 dark:bg-slate-800/95 border-rose-500/40 text-slate-800 dark:text-white shadow-rose-500/10'
                    : 'bg-white/95 dark:bg-slate-800/95 border-orange-500/40 text-slate-800 dark:text-white shadow-orange-500/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-xl shrink-0 ${
                    isSuccess
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : isError
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
                  }`}>
                    {isSuccess && <CheckCircle2 size={18} />}
                    {isError && <AlertCircle size={18} />}
                    {!isSuccess && !isError && <Info size={18} />}
                  </div>
                  <span className="text-xs font-bold leading-tight break-words">
                    {toast.message}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Themed Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-700/80 flex flex-col gap-4"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-2xl shrink-0 ${
                  confirmDialog.isDanger 
                    ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-500' 
                    : 'bg-orange-100 dark:bg-orange-950/50 text-orange-500'
                }`}>
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={confirmDialog.onCancel}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer ${
                    confirmDialog.isDanger
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                      : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                  }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

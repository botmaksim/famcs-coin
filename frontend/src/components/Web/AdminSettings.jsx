import React from 'react';
import { AdminService } from '../../api/services/AdminService';

export const AdminSettings = ({ settings, editingSetting, setEditingSetting, settingValue, setSettingValue, fetchSettings }) => {
  const handleUpdateSetting = async (key) => {
    try {
      await AdminService.updateSetting(key, settingValue);
      setEditingSetting(null);
      fetchSettings();
      alert(`Настройка ${key} успешно обновлена!`);
    } catch (err) {
      alert(`Ошибка обновления: ${err.response?.data || err.message}`);
    }
  };

  return (
    <div className="bg-[var(--card-bg)] p-5 rounded-xl mb-5 border border-[var(--glass-border)]">
      <h3 className="mt-0 text-[var(--text-color)] text-xl font-bold mb-5">⚙️ Системные настройки</h3>
      
      <div className="flex flex-col gap-3">
        {Object.entries(settings).map(([key, val]) => (
          <div
            key={key}
            className="p-4 bg-white/5 rounded-lg flex justify-between items-center flex-wrap gap-4"
          >
            <div>
              <div className="font-bold text-slate-200 mb-1">{key}</div>
              <div className="text-[var(--accent-color)] font-mono text-sm">
                {editingSetting === key ? (
                  <input
                    type="text"
                    value={settingValue}
                    onChange={(e) => setSettingValue(e.target.value)}
                    className="p-1.5 rounded bg-black/50 text-white border border-[var(--glass-border)] outline-none focus:border-[var(--accent-color)]"
                  />
                ) : (
                  String(val)
                )}
              </div>
            </div>
            
            <div className="shrink-0">
              {editingSetting === key ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateSetting(key)}
                    className="px-3 py-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-semibold border border-green-500/30"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingSetting(null)}
                    className="px-3 py-1.5 rounded bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 transition-colors text-sm border border-slate-500/30"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingSetting(key);
                    setSettingValue(String(val));
                  }}
                  className="px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-sm border border-white/20"
                >
                  Изменить
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

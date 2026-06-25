import React, { useState } from 'react';
import { AdminService } from '../../api/services/AdminService';

export const AdminStaff = () => {
  const [roleTgId, setRoleTgId] = useState('');
  const [roleName, setRoleName] = useState('admin');
  
  const [permBonusDrop, setPermBonusDrop] = useState(false);
  const [permModerateDao, setPermModerateDao] = useState(false);
  const [permManageBets, setPermManageBets] = useState(false);
  const [permManageTasks, setPermManageTasks] = useState(false);
  const [permBanUsers, setPermBanUsers] = useState(false);

  const [inviteRole, setInviteRole] = useState('admin');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');

  const handleRoleUpdate = async (e) => {
    e.preventDefault();
    if (!roleTgId || !roleName) return;

    try {
      const permissions = [];
      if (permBonusDrop) permissions.push('bonus_drop');
      if (permModerateDao) permissions.push('moderate_dao');
      if (permManageBets) permissions.push('manage_bets');
      if (permManageTasks) permissions.push('manage_tasks');
      if (permBanUsers) permissions.push('ban_users');

      await AdminService.setRole(roleTgId, roleName, permissions);
      alert('Роль успешно изменена!');
      setRoleTgId('');
      setPermBonusDrop(false);
      setPermModerateDao(false);
      setPermManageBets(false);
      setPermManageTasks(false);
      setPermBanUsers(false);
    } catch (err) {
      alert(err.response?.data || 'Ошибка при изменении роли');
    }
  };

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await AdminService.generateInvite(inviteRole);
      if (res.data.success) {
        const link = `${window.location.origin}/invite?token=${res.data.token}`;
        setGeneratedInviteLink(link);
      }
    } catch (err) {
      alert(err.response?.data || 'Ошибка при генерации ссылки');
    }
  };

  return (
    <div className="bg-[var(--card-bg)] p-5 rounded-xl mb-5 border border-[var(--glass-border)]">
      <h3 className="mt-0 text-[var(--text-color)] text-xl font-bold mb-4">🛡 Управление персоналом</h3>
      
      <form onSubmit={handleRoleUpdate} className="flex flex-col gap-3 mb-6">
        <input
          type="number"
          placeholder="TG ID студента"
          value={roleTgId}
          onChange={(e) => setRoleTgId(e.target.value)}
          className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <select
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500 [&>option]:text-black"
        >
          <option value="user">Студент (user)</option>
          <option value="admin">Модератор (admin)</option>
          <option value="superadmin">Суперадмин (superadmin)</option>
        </select>

        {roleName === 'admin' && (
          <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/10 mt-2">
            <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-200 hover:text-white transition-colors">
              <input type="checkbox" checked={permBonusDrop} onChange={(e) => setPermBonusDrop(e.target.checked)} className="w-4 h-4 accent-[var(--accent-color)]" />
              Выдача бонусов (bonus_drop)
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-200 hover:text-white transition-colors">
              <input type="checkbox" checked={permModerateDao} onChange={(e) => setPermModerateDao(e.target.checked)} className="w-4 h-4 accent-[var(--accent-color)]" />
              Модерация DAO (moderate_dao)
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-200 hover:text-white transition-colors">
              <input type="checkbox" checked={permManageBets} onChange={(e) => setPermManageBets(e.target.checked)} className="w-4 h-4 accent-[var(--accent-color)]" />
              Управление ставками (manage_bets)
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-200 hover:text-white transition-colors">
              <input type="checkbox" checked={permManageTasks} onChange={(e) => setPermManageTasks(e.target.checked)} className="w-4 h-4 accent-[var(--accent-color)]" />
              Создание заданий (manage_tasks)
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-sm text-slate-200 hover:text-white transition-colors">
              <input type="checkbox" checked={permBanUsers} onChange={(e) => setPermBanUsers(e.target.checked)} className="w-4 h-4 accent-[var(--accent-color)]" />
              Блокировка пользователей (ban_users)
            </label>
          </div>
        )}

        <button
          type="submit"
          className="p-3 rounded-lg border border-red-500 bg-red-500/20 text-red-500 font-bold cursor-pointer hover:bg-red-500/30 transition-colors mt-2"
        >
          Изменить роль
        </button>
      </form>

      <hr className="border-white/10 my-6" />

      <h4 className="mt-0 mb-4 text-lg font-semibold text-slate-200">Создать инвайт-ссылку</h4>
      <form onSubmit={handleGenerateInvite} className="flex gap-3 items-center">
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          className="flex-1 p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500 [&>option]:text-black"
        >
          <option value="admin">Модератор (admin)</option>
          <option value="superadmin">Суперадмин (superadmin)</option>
        </select>
        <button
          type="submit"
          className="px-6 py-3 rounded-lg border-none bg-[var(--accent-color)] text-black font-bold cursor-pointer hover:bg-[#b0f242] transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
        >
          Сгенерировать
        </button>
      </form>

      {generatedInviteLink && (
        <div className="mt-4 p-4 bg-emerald-500/20 rounded-lg break-all border border-emerald-500/30">
          <strong className="text-emerald-400">Ссылка:</strong>{' '}
          <a href={generatedInviteLink} target="_blank" rel="noreferrer" className="text-[var(--accent-color)] hover:underline">
            {generatedInviteLink}
          </a>
          <p className="mt-2 text-sm text-emerald-200/70">
            Эта ссылка одноразовая. Отправьте ее новому администратору.
          </p>
        </div>
      )}
    </div>
  );
};

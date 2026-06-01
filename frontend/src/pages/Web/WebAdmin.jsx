import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

const WebAdmin = () => {
  const { user, fetchProfile } = useUser();
  const navigate = useNavigate();

  const [authTgId, setAuthTgId] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [bonusTgId, setBonusTgId] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  
  const [roleTgId, setRoleTgId] = useState('');
  const [roleName, setRoleName] = useState('admin');

  // Permission states
  const [permBonusDrop, setPermBonusDrop] = useState(false);
  const [permModerateDao, setPermModerateDao] = useState(false);
  const [permManageBets, setPermManageBets] = useState(false);
  const [permManageTasks, setPermManageTasks] = useState(false);
  const [permBanUsers, setPermBanUsers] = useState(false);

  const [resolveEventId, setResolveEventId] = useState('');
  const [resolveOption, setResolveOption] = useState('A');

  const [inviteRole, setInviteRole] = useState('admin');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');

  // Tasks states
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskReward, setTaskReward] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);

  // DAO Moderation states
  const [pendingProposals, setPendingProposals] = useState([]);

  // Ban states
  const [banTgId, setBanTgId] = useState('');
  const [banReason, setBanReason] = useState('');
  const [isBannedToggle, setIsBannedToggle] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    if (localStorage.getItem('web_admin_auth')) {
      setIsAuthenticated(true);
      fetchProfile();
      fetchTasks();
      fetchPendingDao();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/admin/tasks');
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  const fetchPendingDao = async () => {
    try {
      const res = await apiClient.get('/admin/dao/pending');
      setPendingProposals(res.data.proposals || []);
    } catch (err) {
      console.error('Failed to fetch pending DAO proposals', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authTgId || !authPassword) return;

    const authToken = `web:${authTgId}:${authPassword}`;
    localStorage.setItem('web_admin_auth', authToken);
    setIsAuthenticated(true);
    fetchProfile();
  };

  const handleLogout = () => {
    localStorage.removeItem('web_admin_auth');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleBonusDrop = async (e) => {
    e.preventDefault();
    if (!bonusTgId || !bonusAmount) return;

    try {
      await apiClient.post('/admin/bonus', {
        tg_id: parseInt(bonusTgId),
        amount: parseFloat(bonusAmount)
      });
      alert('Бонус успешно начислен!');
      setBonusTgId('');
      setBonusAmount('');
      fetchProfile();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при начислении бонуса');
    }
  };

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

      await apiClient.post('/admin/role', {
        tg_id: parseInt(roleTgId),
        role: roleName,
        permissions: permissions
      });
      alert('Роль успешно изменена!');
      setRoleTgId('');
      setPermBonusDrop(false);
      setPermModerateDao(false);
      setPermManageBets(false);
      setPermManageTasks(false);
    } catch (err) {
      alert(err.response?.data || 'Ошибка при изменении роли');
    }
  };

  const handleResolveBet = async (e) => {
    e.preventDefault();
    if (!resolveEventId || !resolveOption) return;

    try {
      await apiClient.post('/admin/bets/resolve', {
        event_id: parseInt(resolveEventId),
        winning_option: resolveOption
      });
      alert('Событие успешно завершено!');
      setResolveEventId('');
    } catch (err) {
      alert(err.response?.data || 'Ошибка при завершении события');
    }
  };

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/admin/generate_invite', { role: inviteRole });
      if (res.data.success) {
        const link = `${window.location.origin}/invite?token=${res.data.token}`;
        setGeneratedInviteLink(link);
      }
    } catch (err) {
      alert(err.response?.data || 'Ошибка при генерации ссылки');
    }
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTaskId) {
        await apiClient.put(`/admin/tasks/${editingTaskId}`, {
          title: taskTitle,
          description: taskDescription,
          reward_coins: parseInt(taskReward),
          link_url: taskLink
        });
        alert('Задание успешно обновлено!');
      } else {
        await apiClient.post('/admin/tasks', {
          title: taskTitle,
          description: taskDescription,
          reward_coins: parseInt(taskReward),
          link_url: taskLink
        });
        alert('Задание успешно создано!');
      }
      setTaskTitle('');
      setTaskDescription('');
      setTaskReward('');
      setTaskLink('');
      setEditingTaskId(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при сохранении задания');
    }
  };

  const handleEditClick = (t) => {
    setTaskTitle(t.title);
    setTaskDescription(t.description);
    setTaskReward(t.reward_coins);
    setTaskLink(t.link_url);
    setEditingTaskId(t.id);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это задание?')) return;
    try {
      await apiClient.delete(`/admin/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при удалении задания');
    }
  };

  const handleModerateDao = async (proposalId, decision) => {
    try {
      await apiClient.post('/admin/dao/moderate', {
        proposal_id: proposalId,
        decision: decision
      });
      fetchPendingDao();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при модерации DAO');
    }
  };

  const handleBanUser = async (e) => {
    e.preventDefault();
    if (!banTgId) return;

    try {
      await apiClient.post('/admin/users/ban', {
        tg_id: parseInt(banTgId),
        reason: banReason,
        is_banned: isBannedToggle
      });
      alert(`Пользователь успешно ${isBannedToggle ? 'забанен' : 'разбанен'}!`);
      setBanTgId('');
      setBanReason('');
    } catch (err) {
      alert(err.response?.data || 'Ошибка при изменении статуса блокировки');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '50px 20px', fontFamily: 'sans-serif', textAlign: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
        <h2>Вход в панель управления</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto', marginTop: '30px' }}>
          <input
            type="number"
            placeholder="Ваш TG ID"
            value={authTgId}
            onChange={(e) => setAuthTgId(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            required
          />
          <input
            type="password"
            placeholder="Мастер-пароль"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            required
          />
          <button type="submit" style={{
            padding: '12px', borderRadius: '8px', border: 'none',
            backgroundColor: 'var(--accent-color)', color: '#fff',
            fontWeight: 'bold', cursor: 'pointer'
          }}>
            Войти
          </button>
        </form>
      </div>
    );
  }

  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', color: '#ef4444', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
        <h2>Доступ запрещен</h2>
        <p>Ваша роль: {user.role}. Требуется admin или superadmin.</p>
        <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Выйти</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>👑 Панель Управления</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
          Выйти ({user?.username})
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
      }}>
        <h3 style={{ marginTop: 0 }}>🎁 Bonus Drop</h3>
        <form onSubmit={handleBonusDrop} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="number"
            placeholder="TG ID студента"
            value={bonusTgId}
            onChange={(e) => setBonusTgId(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            required
          />
          <input
            type="number"
            placeholder="Сумма коинов"
            value={bonusAmount}
            onChange={(e) => setBonusAmount(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            required
          />
          <button type="submit" style={{
            padding: '12px', borderRadius: '8px', border: 'none',
            backgroundColor: 'var(--accent-color)', color: '#fff',
            fontWeight: 'bold', cursor: 'pointer'
          }}>
            Начислить
          </button>
        </form>
      </div>

      {(user?.role === 'superadmin' || user?.permissions?.includes('manage_tasks')) && (
        <div style={{
          backgroundColor: 'var(--card-bg)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <h3 style={{ marginTop: 0 }}>📋 Управление Заданиями (Earn)</h3>
          <form onSubmit={handleCreateOrUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Название (Например: Подписаться на ФПМИ)"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              required
            />
            <input
              type="text"
              placeholder="Описание"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              required
            />
            <input
              type="number"
              placeholder="Награда (коины)"
              value={taskReward}
              onChange={(e) => setTaskReward(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              required
            />
            <input
              type="url"
              placeholder="Ссылка (URL)"
              value={taskLink}
              onChange={(e) => setTaskLink(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              required
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                backgroundColor: editingTaskId ? '#10b981' : '#3b82f6', color: '#fff',
                fontWeight: 'bold', cursor: 'pointer'
              }}>
                {editingTaskId ? 'Сохранить изменения' : 'Создать задание'}
              </button>
              {editingTaskId && (
                <button type="button" onClick={() => {
                  setEditingTaskId(null);
                  setTaskTitle('');
                  setTaskDescription('');
                  setTaskReward('');
                  setTaskLink('');
                }} style={{
                  padding: '12px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#64748b', color: '#fff',
                  fontWeight: 'bold', cursor: 'pointer'
                }}>Отмена</button>
              )}
            </div>
          </form>

          <h4 style={{ marginTop: '20px' }}>Текущие задания</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{t.title}</div>
                  <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.7)' }}>{t.reward_coins} коинов | <a href={t.link_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Ссылка</a></div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEditClick(t)} style={{
                    padding: '8px 12px', borderRadius: '6px', border: 'none',
                    backgroundColor: '#f59e0b', color: '#fff', cursor: 'pointer'
                  }}>Редактировать ✏️</button>
                  <button onClick={() => handleDeleteTask(t.id)} style={{
                    padding: '8px 12px', borderRadius: '6px', border: 'none',
                    backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer'
                  }}>Удалить 🗑️</button>
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>Нет активных заданий.</p>}
          </div>
        </div>
      )}

      {(user?.role === 'superadmin' || user?.permissions?.includes('moderate_dao')) && (
        <div style={{
          backgroundColor: 'var(--card-bg)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <h3 style={{ marginTop: 0 }}>⚖️ Очередь DAO (Премодерация)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingProposals.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '5px' }}>{p.title}</div>
                  <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.8)' }}>{p.description}</div>
                  <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>
                    Автор (TG ID): {p.user_id} | Создано: {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleModerateDao(p.id, 'approve')} style={{
                    padding: '10px 15px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 'bold'
                  }}>Одобрить ✅</button>
                  <button onClick={() => handleModerateDao(p.id, 'reject')} style={{
                    padding: '10px 15px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 'bold'
                  }}>Отклонить ❌</button>
                </div>
              </div>
            ))}
            {pendingProposals.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>Нет новых предложений.</p>}
          </div>
        </div>
      )}

      {(user?.role === 'superadmin' || user?.permissions?.includes('ban_users')) && (
        <div style={{
          backgroundColor: 'var(--card-bg)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <h3 style={{ marginTop: 0 }}>🚫 Модерация Пользователей</h3>
          <form onSubmit={handleBanUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="number"
              placeholder="TG ID пользователя"
              value={banTgId}
              onChange={(e) => setBanTgId(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              required
            />
            <input
              type="text"
              placeholder="Причина (опционально, увидят при входе)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            />
            <select
              value={isBannedToggle}
              onChange={(e) => setIsBannedToggle(e.target.value === 'true')}
              style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            >
              <option value="true" style={{ color: '#000' }}>Забанить 🚫</option>
              <option value="false" style={{ color: '#000' }}>Разбанить 🟢</option>
            </select>
            <button type="submit" style={{
              padding: '12px', borderRadius: '8px', border: 'none',
              backgroundColor: isBannedToggle ? '#ef4444' : '#10b981', color: '#fff',
              fontWeight: 'bold', cursor: 'pointer'
            }}>
              Применить статус
            </button>
          </form>
        </div>
      )}

      {user?.role === 'superadmin' && (
        <>
          <div style={{
            backgroundColor: 'var(--card-bg)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}>
            <h3 style={{ marginTop: 0 }}>🛡 Управление персоналом</h3>
            <form onSubmit={handleRoleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="number"
                placeholder="TG ID студента"
                value={roleTgId}
                onChange={(e) => setRoleTgId(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                required
              />
              <select
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                <option value="user" style={{ color: '#000' }}>Студент (user)</option>
                <option value="admin" style={{ color: '#000' }}>Модератор (admin)</option>
                <option value="superadmin" style={{ color: '#000' }}>Суперадмин (superadmin)</option>
              </select>
              
              {roleName === 'admin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={permBonusDrop} onChange={(e) => setPermBonusDrop(e.target.checked)} />
                    Выдача бонусов (bonus_drop)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={permModerateDao} onChange={(e) => setPermModerateDao(e.target.checked)} />
                    Модерация DAO (moderate_dao)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={permManageBets} onChange={(e) => setPermManageBets(e.target.checked)} />
                    Управление ставками (manage_bets)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={permManageTasks} onChange={(e) => setPermManageTasks(e.target.checked)} />
                    Создание заданий Earn (manage_tasks)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={permBanUsers} onChange={(e) => setPermBanUsers(e.target.checked)} />
                    Блокировка пользователей (ban_users)
                  </label>
                </div>
              )}

              <button type="submit" style={{
                padding: '12px', borderRadius: '8px', border: 'none',
                backgroundColor: '#ef4444', color: '#fff',
                fontWeight: 'bold', cursor: 'pointer'
              }}>
                Изменить роль (прямо)
              </button>
            </form>

            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

            <h4 style={{ marginTop: 0 }}>Создать инвайт-ссылку</h4>
            <form onSubmit={handleGenerateInvite} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                <option value="admin" style={{ color: '#000' }}>Модератор (admin)</option>
                <option value="superadmin" style={{ color: '#000' }}>Суперадмин (superadmin)</option>
              </select>
              <button type="submit" style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                backgroundColor: '#10b981', color: '#fff',
                fontWeight: 'bold', cursor: 'pointer'
              }}>
                Сгенерировать
              </button>
            </form>
            {generatedInviteLink && (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', wordBreak: 'break-all' }}>
                <strong>Ссылка:</strong> <a href={generatedInviteLink} target="_blank" rel="noreferrer" style={{ color: '#34d399' }}>{generatedInviteLink}</a>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', opacity: 0.8 }}>Эта ссылка одноразовая. Отправьте ее новому администратору.</p>
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: 'var(--card-bg)',
            padding: '20px',
            borderRadius: '12px',
          }}>
            <h3 style={{ marginTop: 0 }}>🎲 Завершить Тотализатор</h3>
            <form onSubmit={handleResolveBet} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="number"
                placeholder="Event ID"
                value={resolveEventId}
                onChange={(e) => setResolveEventId(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                required
              />
              <select
                value={resolveOption}
                onChange={(e) => setResolveOption(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                <option value="A" style={{ color: '#000' }}>Исход A (Победа первого)</option>
                <option value="B" style={{ color: '#000' }}>Исход B (Победа второго)</option>
                <option value="cancel" style={{ color: '#000' }}>Отменить (Возврат пула)</option>
              </select>
              <button type="submit" style={{
                padding: '12px', borderRadius: '8px', border: 'none',
                backgroundColor: '#f59e0b', color: '#fff',
                fontWeight: 'bold', cursor: 'pointer'
              }}>
                Завершить событие
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default WebAdmin;

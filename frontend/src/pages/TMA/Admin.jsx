import { useState } from 'react';
import apiClient from '../../api/client';
import { useUser } from '../../context/UserContext';

const Admin = () => {
  const { user, fetchProfile } = useUser();
  const [bonusTgId, setBonusTgId] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  
  const [roleTgId, setRoleTgId] = useState('');
  const [roleName, setRoleName] = useState('admin');

  const [resolveEventId, setResolveEventId] = useState('');
  const [resolveOption, setResolveOption] = useState('A');

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Доступ запрещен</div>;
  }

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
      await apiClient.post('/admin/role', {
        tg_id: parseInt(roleTgId),
        role: roleName
      });
      alert('Роль успешно изменена!');
      setRoleTgId('');
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

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', paddingBottom: '80px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>👑 Панель Управления</h2>

      <div style={{
        backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0 }}>🎁 Bonus Drop</h3>
        <form onSubmit={handleBonusDrop} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="number"
            placeholder="TG ID студента"
            value={bonusTgId}
            onChange={(e) => setBonusTgId(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            required
          />
          <input
            type="number"
            placeholder="Сумма коинов"
            value={bonusAmount}
            onChange={(e) => setBonusAmount(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            required
          />
          <button type="submit" style={{
            padding: '12px', borderRadius: '8px', border: 'none',
            backgroundColor: 'var(--tg-theme-button-color, #2481cc)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            fontWeight: 'bold', cursor: 'pointer'
          }}>
            Начислить
          </button>
        </form>
      </div>

      {user?.role === 'superadmin' && (
        <div style={{
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>🛡 Управление персоналом</h3>
          <form onSubmit={handleRoleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="number"
              placeholder="TG ID студента"
              value={roleTgId}
              onChange={(e) => setRoleTgId(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              required
            />
            <select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="user">Студент (user)</option>
              <option value="admin">Модератор (admin)</option>
              <option value="superadmin">Суперадмин (superadmin)</option>
            </select>
            <button type="submit" style={{
              padding: '12px', borderRadius: '8px', border: 'none',
              backgroundColor: '#ef4444',
              color: '#fff',
              fontWeight: 'bold', cursor: 'pointer'
            }}>
              Изменить роль
            </button>
          </form>
        </div>
      )}

      {user?.role === 'superadmin' && (
        <div style={{
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          marginTop: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>🎲 Завершить Тотализатор</h3>
          <form onSubmit={handleResolveBet} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="number"
              placeholder="Event ID"
              value={resolveEventId}
              onChange={(e) => setResolveEventId(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              required
            />
            <select
              value={resolveOption}
              onChange={(e) => setResolveOption(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="A">Исход A (Победа первого)</option>
              <option value="B">Исход B (Победа второго)</option>
              <option value="cancel">Отменить (Возврат пула)</option>
            </select>
            <button type="submit" style={{
              padding: '12px', borderRadius: '8px', border: 'none',
              backgroundColor: '#f59e0b',
              color: '#fff',
              fontWeight: 'bold', cursor: 'pointer'
            }}>
              Разрешить ставки
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin;

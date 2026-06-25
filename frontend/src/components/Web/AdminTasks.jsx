import React from 'react';
import { AdminService } from '../../api/services/AdminService';

export const AdminTasks = ({ tasks, fetchTasks }) => {
  const [taskTitle, setTaskTitle] = React.useState('');
  const [taskDescription, setTaskDescription] = React.useState('');
  const [taskReward, setTaskReward] = React.useState('');
  const [taskLink, setTaskLink] = React.useState('');
  const [editingTaskId, setEditingTaskId] = React.useState(null);

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTaskId) {
        await AdminService.updateTask(editingTaskId, {
          title: taskTitle,
          description: taskDescription,
          reward_coins: parseInt(taskReward),
          link_url: taskLink,
        });
        alert('Задание успешно обновлено!');
      } else {
        await AdminService.createTask({
          title: taskTitle,
          description: taskDescription,
          reward_coins: parseInt(taskReward),
          link_url: taskLink,
        });
        alert('Задание успешно создано!');
      }
      resetForm();
      fetchTasks();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при сохранении задания');
    }
  };

  const resetForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskReward('');
    setTaskLink('');
    setEditingTaskId(null);
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
      await AdminService.deleteTask(taskId);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data || 'Ошибка при удалении задания');
    }
  };

  return (
    <div className="bg-[var(--card-bg)] p-5 rounded-xl mb-5 border border-[var(--glass-border)]">
      <h3 className="mt-0 text-[var(--text-color)] text-xl font-bold mb-4">📋 Управление Заданиями</h3>
      
      <form onSubmit={handleCreateOrUpdateTask} className="flex flex-col gap-3 mb-6">
        <input
          type="text"
          placeholder="Название (Например: Подписаться на ФПМИ)"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="text"
          placeholder="Описание"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="number"
          placeholder="Награда (коины)"
          value={taskReward}
          onChange={(e) => setTaskReward(e.target.value)}
          className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="url"
          placeholder="Ссылка (URL)"
          value={taskLink}
          onChange={(e) => setTaskLink(e.target.value)}
          className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            className="flex-1 p-3 rounded-lg border-none bg-[var(--accent-color)] text-black font-bold cursor-pointer hover:bg-[#b0f242] transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
          >
            {editingTaskId ? 'Сохранить изменения' : 'Создать задание'}
          </button>
          {editingTaskId && (
            <button
              type="button"
              onClick={resetForm}
              className="p-3 rounded-lg border border-slate-500 bg-transparent text-white font-bold cursor-pointer hover:bg-slate-800 transition-colors"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <h4 className="mt-5 mb-3 text-lg font-semibold text-slate-200">Текущие задания</h4>
      <div className="flex flex-col gap-3">
        {tasks.map((t) => (
          <div key={t.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
            <div>
              <div className="font-bold text-white">{t.title}</div>
              <div className="text-sm text-white/70 mt-1">
                {t.reward_coins} коинов |{' '}
                <a href={t.link_url} target="_blank" rel="noreferrer" className="text-[var(--accent-color)] hover:underline">
                  Ссылка
                </a>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditClick(t)}
                className="px-3 py-2 rounded-md border border-[var(--accent-color)] bg-[rgba(163,230,53,0.1)] text-[var(--accent-color)] hover:bg-[rgba(163,230,53,0.2)] transition-colors"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDeleteTask(t.id)}
                className="px-3 py-2 rounded-md border border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-white/50 text-center py-4">Нет активных заданий.</p>
        )}
      </div>
    </div>
  );
};

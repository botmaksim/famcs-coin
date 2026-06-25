import apiClient from '../client';

export const TasksService = {
  getTasks: () => apiClient.get('/tasks'),
  claimTask: (taskId) => apiClient.post('/tasks/claim', { task_id: taskId }),
  getWebConfig: () => apiClient.get('/web/config'), // Maybe moved here or in WebService
};

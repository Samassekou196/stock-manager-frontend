import api from './api';

const DashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export default DashboardService;
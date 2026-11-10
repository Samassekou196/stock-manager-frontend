import api from './api';

const PurchaseOrderService = {
  getAll: () => api.get('/purchases'),
  create: (data) => api.post('/purchases', data),
  receive: (id, data) => api.post(`/purchases/${id}/receipts`, data),
};

export default PurchaseOrderService;

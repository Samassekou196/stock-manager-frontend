import api from './api';

const CustomerService = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  search: (name) => api.get(`/customers/search?name=${name}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export default CustomerService;
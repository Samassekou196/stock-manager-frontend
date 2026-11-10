import api from './api';

const SaleService = {
  getAll: () => api.get('/sales'),
  getById: (id) => api.get(`/sales/${id}`),
  getToday: () => api.get('/sales/today'),
  getThisMonth: () => api.get('/sales/this-month'),
  getByCustomer: (customerId) => api.get(`/sales/customer/${customerId}`),
  create: (customerId, items, payment = {}) => {
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    if (payment.paymentMethod) params.set('paymentMethod', payment.paymentMethod);
    if (payment.amountReceived != null) params.set('amountReceived', payment.amountReceived);
    const query = params.toString();
    return api.post(query ? `/sales?${query}` : '/sales', items);
  },
};

export default SaleService;

import api from './api';

const ProductService = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  search: (name) => api.get(`/products/search?name=${name}`),
  getLowStock: () => api.get('/products/low-stock'),
  getOutOfStock: () => api.get('/products/out-of-stock'),
  create: (data, categoryId, supplierId) =>
    api.post(`/products?categoryId=${categoryId}&supplierId=${supplierId}`, data),
  update: (id, data, categoryId, supplierId) =>
    api.put(`/products/${id}?categoryId=${categoryId}&supplierId=${supplierId}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export default ProductService;
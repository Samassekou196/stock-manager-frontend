import api from './api';

const AuthService = {
  async login(credentials) {
    await api.get('/auth/csrf');
    const response = await api.post('/auth/login', credentials);
    await api.get('/auth/csrf');
    return response;
  },
  getSession: async () => (await api.get('/auth/me')).data,
  async logout() {
    await api.get('/auth/csrf');
    return api.post('/auth/logout');
  },
};

export default AuthService;

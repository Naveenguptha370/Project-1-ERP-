import api from './api';

export const authService = {
  async login(username_or_email, password) {
    const response = await api.post('/auth/login', {
      username_or_email,
      password,
    });
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('smarterp_token');
      localStorage.removeItem('smarterp_user');
    }
  },
};

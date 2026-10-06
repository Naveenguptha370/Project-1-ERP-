import apiRequest from './client';

export const authApi = {
  login: async (username_or_email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email, password }),
    });
  },

  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },
};

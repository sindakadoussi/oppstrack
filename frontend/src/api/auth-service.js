import { apiClient } from './http-client.js';
import { API_ROUTES } from './constants.js';

export const authService = {
  async login(email, password) {
    const data = await apiClient.post(API_ROUTES.auth.login, { email, password });
    if (data.token) {
      apiClient.setToken(data.token);
    }
    return data;
  },

  async register(userData) {
    const data = await apiClient.post(API_ROUTES.auth.register, userData);
    if (data.token) {
      apiClient.setToken(data.token);
    }
    return data;
  },

  async magicLogin(email) {
    return apiClient.post(API_ROUTES.auth.magicLogin, { email });
  },

  async getMe() {
    return apiClient.get(API_ROUTES.auth.me);
  },

  logout() {
    apiClient.setToken(null);
  },

  setToken(token) {
    apiClient.setToken(token);
  },

  getToken() {
    return apiClient.getToken();
  },
};
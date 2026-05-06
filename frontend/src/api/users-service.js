import { apiClient } from './http-client.js';
import { API_ROUTES } from './constants.js';

export const usersService = {
  async getById(id) {
    return apiClient.get(API_ROUTES.users.byId(id));
  },

  async update(id, userData) {
    return apiClient.put(API_ROUTES.users.byId(id), userData);
  },

  async delete(id) {
    return apiClient.delete(API_ROUTES.users.byId(id));
  },
};
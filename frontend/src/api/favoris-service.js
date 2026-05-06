import { apiClient } from './http-client.js';
import { API_ROUTES } from './constants.js';

export const favorisService = {
  async getByUser(userId) {
    return apiClient.get(API_ROUTES.favoris.byUser(userId));
  },

  async create(favorisData) {
    return apiClient.post(API_ROUTES.favoris.create, favorisData);
  },

  async delete(id) {
    return apiClient.delete(`/api/favoris/${id}`);
  },

  async addToFavoris(bourseId, userId) {
    return this.create({
      user: userId,
      bourse: bourseId,
    });
  },
};
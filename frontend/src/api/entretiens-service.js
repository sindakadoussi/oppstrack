import { apiClient } from './http-client.js';
import { API_ROUTES } from './constants.js';

export const entretiensService = {
  async list(filters = {}) {
    let url = API_ROUTES.entretiens.list;
    
    if (Object.keys(filters).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url += `?${queryParams.toString()}`;
    }
    
    return apiClient.get(url);
  },

  async create(entretiensData) {
    return apiClient.post(API_ROUTES.entretiens.list, entretiensData);
  },
};
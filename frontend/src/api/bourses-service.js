import { apiClient } from './http-client.js';
import { API_ROUTES } from './constants.js';

export const boursesService = {
  async list(filters = {}) {
    let url = API_ROUTES.bourses.list;
    
    if (Object.keys(filters).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url += `?${queryParams.toString()}`;
    }
    
    return apiClient.get(url);
  },

  async getById(id) {
    return apiClient.get(API_ROUTES.bourses.byId(id));
  },

  async search(query) {
    return this.list({ search: query });
  },
};
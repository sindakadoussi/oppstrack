import { apiClient } from './http-client.js';
import { API_ROUTES } from './constants.js';

export const feedbacksService = {
  async list(filters = {}) {
    let url = API_ROUTES.feedbacks.list;
    
    if (Object.keys(filters).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url += `?${queryParams.toString()}`;
    }
    
    return apiClient.get(url);
  },

  async create(feedbackData) {
    return apiClient.post(API_ROUTES.feedbacks.create, feedbackData);
  },
};
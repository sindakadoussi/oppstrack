import { apiClient } from './http-client.js';
import { API_ROUTES, WEBHOOK_ROUTES } from './constants.js';

export const roadmapService = {
  async list(filters = {}) {
    let url = API_ROUTES.roadmap.list;
    
    if (Object.keys(filters).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url += `?${queryParams.toString()}`;
    }
    
    return apiClient.get(url);
  },

  async getByUser(userId) {
    return apiClient.get(API_ROUTES.roadmap.byUser(userId));
  },

  async getById(id) {
    return apiClient.get(API_ROUTES.roadmap.byId(id));
  },

  async create(roadmapData) {
    return apiClient.post(API_ROUTES.roadmap.create, roadmapData);
  },

  async update(id, data) {
    return apiClient.put(API_ROUTES.roadmap.update(id), data);
  },

  async delete(id) {
    return apiClient.delete(API_ROUTES.roadmap.delete(id));
  },

  async generateWithWebhook(roadmapData) {
    try {
      const response = await fetch(WEBHOOK_ROUTES.generateRoadmap, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roadmapData),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Roadmap webhook error:', error);
      throw error;
    }
  },
};
import { apiClient } from './http-client.js';
import { API_ROUTES, WEBHOOK_ROUTES } from './constants.js';

export const messagesService = {
  async list(filters = {}) {
    let url = API_ROUTES.messages.list;
    
    if (Object.keys(filters).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url += `?${queryParams.toString()}`;
    }
    
    return apiClient.get(url);
  },

  async create(messageData) {
    return apiClient.post(API_ROUTES.messages.create, messageData);
  },

  async sendToWebhook(webhookType, data) {
    const url = WEBHOOK_ROUTES[webhookType];
    if (!url) {
      throw new Error(`Unknown webhook type: ${webhookType}`);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  },
};
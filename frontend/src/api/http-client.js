import axios from 'axios';
import { API_BASE } from './constants.js';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor pour gérer les erreurs
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class APIClient {
  constructor(instance = axiosInstance) {
    this.instance = instance;
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('auth_token', token);
      this.instance.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem('auth_token');
      delete this.instance.defaults.headers.Authorization;
    }
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  async get(endpoint, config) {
    try {
      const response = await this.instance.get(endpoint, config);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async post(endpoint, data, config) {
    try {
      const response = await this.instance.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async put(endpoint, data, config) {
    try {
      const response = await this.instance.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async patch(endpoint, data, config) {
    try {
      const response = await this.instance.patch(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  async delete(endpoint, config) {
    try {
      const response = await this.instance.delete(endpoint, config);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  _handleError(error) {
    const message = error.response?.data?.message || error.message || 'Unknown error';
    const status = error.response?.status;
    const err = new Error(message);
    err.status = status;
    err.data = error.response?.data;
    return err;
  }
}

export const apiClient = new APIClient(axiosInstance);
export { axiosInstance };
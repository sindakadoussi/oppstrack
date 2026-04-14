const WEBHOOK = import.meta.env.VITE_WEBHOOK_URL ?? 'http://localhost:5678';

export const API_ROUTES = {
  auth: {
    login:      '/api/users/login',
    register:   '/api/users',
    me:         '/api/users/me',
    magicLogin: '/api/users/magic-login',
  },
  bourses: {
    list:  '/api/bourses',
    byId:  (id) => `/api/bourses/${id}`,
  },
  roadmap: {
    list:   '/api/roadmap',
    byUser: (userId) => `/api/roadmap?where[userId][equals]=${userId}&limit=200&depth=0`,
    create: '/api/roadmap',
      byId:   (id) => `/api/roadmap/${id}`,   // ← ajouter cette ligne
    update: (id) => `/api/roadmap/${id}`,
    delete: (id) => `/api/roadmap/${id}`,
  },
  messages: {
    list:   '/api/messages',
    create: '/api/messages',
  },
  entretiens: {
    list: '/api/entretiens',
  },
  users: {
    byId: (id) => `/api/users/${id}`,
  },
  favoris: {
    byUser: (userId) => `/api/favoris?where[user][equals]=${userId}&limit=1&depth=0`,
    create: '/api/favoris',
  },
};

export const WEBHOOK_ROUTES = {
  cv:        `${WEBHOOK}/webhook/cv`,
  entretien: `${WEBHOOK}/webhook/webhook`,
  chat:      `${WEBHOOK}/webhook/chat`,
  generateRoadmap: `${WEBHOOK}/webhook/generate-roadmap-steps`,
};
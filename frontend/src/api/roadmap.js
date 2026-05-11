export const roadmapRoutes = {
  list: '/api/roadmap',

  byUser: (userId) =>
    `/api/roadmap?where[userId][equals]=${userId}&limit=200&depth=0`,

  create: '/api/roadmap',

  byId: (id) => `/api/roadmap/${id}`,

  update: (id) => `/api/roadmap/${id}`,

  delete: (id) => `/api/roadmap/${id}`,
};
export const favorisRoutes = {
  byUser: (userId) =>
    `/api/favoris?where[user][equals]=${userId}&limit=1&depth=0`,

  create: '/api/favoris',
};
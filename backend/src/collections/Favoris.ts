import type { CollectionConfig } from 'payload'

export const Favoris: CollectionConfig = {
  slug: 'favoris',
  admin: {
    useAsTitle: 'userEmail',
    description: 'Bourses favorites par étudiant',
  },
  access: { read: () => true, create: () => true, update: () => true, delete: () => true },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      admin: { description: 'Un seul document de favoris par utilisateur' },
    },
    {
      name: 'userEmail',
      type: 'email',
      admin: { readOnly: true },
    },
    {
      name: 'bourses',
      type: 'array',
      label: 'Bourses favorites',
      fields: [
        { name: 'nom',          type: 'text', required: true },
        { name: 'pays',         type: 'text' },
        { name: 'lienOfficiel', type: 'text' },
        { name: 'financement',  type: 'text' },
        { name: 'dateLimite',   type: 'date' },
        { name: 'ajouteLe',     type: 'date' },
      ],
    },
  ],
}

export default Favoris
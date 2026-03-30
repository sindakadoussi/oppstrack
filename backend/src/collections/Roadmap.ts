import { CollectionConfig } from 'payload';

const Roadmap: CollectionConfig = {
  slug: 'roadmap',
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'pays', 'userId', 'statut', 'etapeCourante', 'dateLimite'],
  },
  access: {
    read:   () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'userEmail',
      type: 'email',
    },
    {
      name: 'nom',
      type: 'text',
      required: true,
    },
    {
      name: 'pays',
      type: 'text',
    },
    {
      name: 'lienOfficiel',
      type: 'text',
    },
    {
      name: 'financement',
      type: 'text',
    },
    {
      name: 'dateLimite',
      type: 'date',
    },
    {
      name: 'ajouteLe',
      type: 'text',
    },
    {
      name: 'statut',
      type: 'select',
      options: ['en_cours', 'soumis', 'accepte', 'refuse'],
      defaultValue: 'en_cours',
    },
    {
      name: 'etapeCourante',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
};

export default Roadmap;
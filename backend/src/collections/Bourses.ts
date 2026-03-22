import { CollectionConfig } from 'payload';

const Bourses: CollectionConfig = {
  slug: 'bourses',
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'pays', 'niveau', 'financement', 'dateLimite'],
  },
  access: {
    read:   () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'nom',
      type: 'text',
      required: true,
    },
    {
      // ← TEXT au lieu de SELECT — accepte n'importe quel pays
      name: 'pays',
      type: 'text',
      required: true,
    },
    {
      // ← TEXT au lieu de SELECT — accepte Master, Doctorat, Licence, etc.
      name: 'niveau',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'montant',
      type: 'text',
      admin: { placeholder: 'Ex: 1200€ / mois' },
    },
    {
      // ← TEXT au lieu de SELECT — 100% financée, Partielle, etc.
      name: 'financement',
      type: 'text',
      defaultValue: '100% financée',
    },
    {
      name: 'dateLimite',
      type: 'date',
    },
    {
      name: 'lienOfficiel',
      type: 'text',
    },
    {
      name: 'domaine',
      type: 'text',
    },
  ],
};

export default Bourses;
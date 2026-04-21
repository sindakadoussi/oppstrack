// backend/src/collections/Feedbacks.ts
import { CollectionConfig } from 'payload';

const Feedbacks: CollectionConfig = {
  slug: 'feedbacks',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'rating', 'createdAt'],
  },
  access: {
    read: () => true,      // tout le monde peut lire (si tu veux afficher les témoignages)
    create: () => true,    // accessible sans authentification (avis public)
    update: () => false,   // personne ne peut modifier un avis
    delete: () => false,   // seulement toi via admin
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nom complet',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      label: 'Email',
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      label: 'Note (1 à 5)',
    },
    {
      name: 'comment',
      type: 'textarea',
      required: true,
      label: 'Commentaire',
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: true,
      label: 'Approuvé (visible sur le site)',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true, // ajoute createdAt et updatedAt automatiquement
};

export default Feedbacks;
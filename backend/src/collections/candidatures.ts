import { CollectionConfig } from 'payload';

const Candidatures: CollectionConfig = {
  slug: 'candidatures',
  admin: {
    useAsTitle: 'id', // Affiche l'ID dans l'admin
  },
  access: {
    read: () => true, // On pourra affiner plus tard pour que l'user ne voie que les siennes
    create: () => true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users', // Relie la candidature à un utilisateur
      required: false,
      
    },
    {
      name: 'bourse_name',
      type: 'text',
      label: 'Nom de la Bourse',
      required: true,
    },
    {
      name: 'statut',
      type: 'select',
      defaultValue: 'en_attente',
      required: true,
      options: [
        { label: 'En attente', value: 'en_attente' },
        { label: 'En cours d\'examen', value: 'examen' },
        { label: 'Acceptée', value: 'acceptee' },
        { label: 'Refusée', value: 'refusee' },
      ],
    },
    {
      name: 'date_depot',
      type: 'date',
      defaultValue: () => new Date(),
    },
  ],
};

export default Candidatures;
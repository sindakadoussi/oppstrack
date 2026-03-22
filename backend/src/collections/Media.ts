import { CollectionConfig } from 'payload';

const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Texte alternatif pour l\'accessibilité',
      },
    },
  ],
  upload: {
    staticDir: 'media', // Dossier où les fichiers seront stockés
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 800,
        height: 600,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail', // Miniature dans l'admin
    mimeTypes: ['image/*'], // Accepter uniquement les images
  },
};

export default Media;
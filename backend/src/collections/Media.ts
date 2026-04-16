import { flushAllTraces } from 'next/dist/trace';
import { CollectionConfig } from 'payload';

const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: () => true,   // ← ajoute cette ligne
    update: () => true,   // ← ajoute cette ligne
    delete: () => true, 
  },
  fields: [
     {
      name: 'alt',
      type: 'text',
      required: false,
      admin: {
        description: 'Texte alternatif pour l\'accessibilité',
      },
    },
  ],
  upload: {
    staticDir: 'media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 600, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
};


export default Media;
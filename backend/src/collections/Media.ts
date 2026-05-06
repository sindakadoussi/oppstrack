import { CollectionConfig } from 'payload'

const Media: CollectionConfig = {
  slug: 'media',
  upload: {
  staticDir: 'media',
  mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
},
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}

export default Media
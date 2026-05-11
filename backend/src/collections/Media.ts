import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { CollectionConfig } from 'payload'

const Media: CollectionConfig = {
  slug: 'media',
  upload: {
  staticDir: 'media',
  mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
},
   access: {
      read:   anyone,
      update: authenticated,
      create: authenticated,
      delete: authenticated,
    },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}

export default Media
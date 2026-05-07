import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'
const Entretiens: CollectionConfig = {
  slug: 'entretiens',
   access: {
    read:   anyone,
    update: authenticated,
    create: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'user',           type: 'relationship', relationTo: 'users', required: true },
    { name: 'score',          type: 'textarea' },
    { name: 'conversationId', type: 'text' },
    { name: 'context',        type: 'text' },
  ],
}

export default Entretiens
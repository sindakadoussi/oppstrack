import type { CollectionConfig } from 'payload'

const Entretiens: CollectionConfig = {
  slug: 'entretiens',
  access: {
    read:   () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    { name: 'user',           type: 'relationship', relationTo: 'users', required: true },
    { name: 'score',          type: 'textarea' },
    { name: 'conversationId', type: 'text' },
    { name: 'context',        type: 'text' },
  ],
}

export default Entretiens
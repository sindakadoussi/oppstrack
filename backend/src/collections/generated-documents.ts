import { CollectionConfig, PayloadRequest } from 'payload';

export const GeneratedDocuments: CollectionConfig = {
  slug: 'generated-documents',
  auth: false,
  admin: { useAsTitle: 'title' },
  access: {
    read: ({ req }: { req: PayloadRequest }) => !!req.user,
    create: ({ req }: { req: PayloadRequest }) => !!req.user,
    delete: ({ req }: { req: PayloadRequest }) => {
      const user = req.user as any; // ← Cast temporaire
      return user?.role === 'admin';}
    
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true
    },
    {
      name: 'bourse',
      type: 'relationship',
      relationTo: 'bourses',
      required: true
    },
    {
      name: 'type',
      type: 'select',
      options: ['cv', 'lm', 'statement'],
      required: true
    },
    {
      name: 'content',
      type: 'richText',
      required: true
    },
    {
      name: 'alignmentScore',
      type: 'number',
      min: 0,
      max: 100
    },
    {
      name: 'metadata',
      type: 'json'
    },
    {
      name: 'generatedAt',
      type: 'date',
      defaultValue: () => new Date()
    }
  ]
};
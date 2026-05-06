// Payload CMS collection config
export const GeneratedDocuments = {
  slug: 'generated-documents',
  auth: false,
  admin: { useAsTitle: 'title' },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === 'admin'
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
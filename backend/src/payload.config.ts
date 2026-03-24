import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import Messages from './collections/Messages'; // Importe ton nouveau fichier
import { Users } from './collections/Users'
import  Media  from './collections/Media'
import Bourses from './collections/Bourses';
import candidature from './collections/candidatures';
import nodemailer from 'nodemailer';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import Entretiens from './collections/Entretiens'


const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  cors: ['http://localhost:5173'], // Autorise ton frontend
  csrf: ['http://localhost:5173'],
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  email: nodemailerAdapter({
  defaultFromName: 'OppTrack',
  defaultFromAddress: 'opportunitylink32@gmail.com',
  transportOptions: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'opportunitylink32@gmail.com',
      pass: 'jebazrauhwdzswbg',
    },
  },
}),
  collections: [Users, Media, Messages, Bourses, candidature, Entretiens],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
})

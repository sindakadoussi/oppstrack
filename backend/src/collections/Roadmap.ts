import { CollectionConfig } from 'payload';
import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'
const Roadmap: CollectionConfig = {
  slug: 'roadmap',
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'pays', 'userId', 'statut', 'etapeCourante', 'dateLimite'],
  },

   access: {
  read:   () => true,
  create: () => true,
  update: () => true,
  delete: () => true,

  },

  // collections/roadmap.ts

hooks: {
  afterChange: [
    async ({ doc, operation, req }) => {
      // Déclencher SEULEMENT si on modifie la dateLimite
      if (operation === 'update' && doc.dateLimite) {
        try {
          // 🎯 Déclenchez le workflow par son URL d'exécution
          const workflowUrl = 'http://localhost:5678/webhook/deadline';
          
          await fetch(workflowUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: doc.userId,
              userEmail: doc.userEmail,
              dateLimite: doc.dateLimite,
              nom: doc.nom,
            }),
          });
          
          console.log('✅ Workflow déclenché pour:', doc.nom);
        } catch (error) {
          console.error('❌ Erreur:', error);
          // Ne pas bloquer si erreur
        }
      }
    },
  ],
},
  fields: [
    {
      name: 'userId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'userEmail',
      type: 'email',
    },
    {
      name: 'nom',
      type: 'text',
      required: true,
    },
    {
      name: 'pays',
      type: 'text',
    },
    {
      name: 'lienOfficiel',
      type: 'text',
    },
    {
      name: 'financement',
      type: 'text',
    },
    {
      name: 'dateLimite',
      type: 'date',
    },
    {
      name: 'ajouteLe',
      type: 'text',
    },
    {
      name: 'statut',
      type: 'select',
      options: ['en_cours', 'soumis', 'accepte', 'refuse'],
      defaultValue: 'en_cours',
    },
    {
      name: 'etapeCourante',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
  name: 'etapes',
  type: 'json',   // stocke le tableau d'étapes généré par l'IA
},
{
  name: 'conseilGlobal',
  type: 'textarea',
},
{
  name: 'langue',
  type: 'text',
},
{
  name: 'deadlineFinale',
  type: 'text',
},
  ],
};




export default Roadmap;
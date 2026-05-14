import { CollectionConfig } from 'payload';
import { authenticated } from '@/access/authenticated'
import { anyone } from '@/access/anyone'

const Bourses: CollectionConfig = {
  
  slug: 'bourses',
  admin: {
    useAsTitle: 'nom',
    defaultColumns: [
      'nom', 'pays', 'niveau', 'financement',
      'dateOuverture', 'dateLimite', 'statut',
      'tunisienEligible', 'domaine', 'langue',
      'description', 'eligibilite', 'documentsRequis','embedding','image'
    ],
  },
  access: {
  read:   () => true,
  update: () => true,
  create: () => true,  // ← Temporaire!
  delete: authenticated,
},
  fields: [
    {
      name: 'nom',
      type: 'text',
      required: true,
    },
    {
      name: 'pays',
      type: 'text',
      required: true,
    },

    // ✅ CHANGÉ : 'select' → 'text' pour accepter du texte libre enrichi par Claude
    {
      name: 'domaine',
      type: 'text',
      label: 'Domaine(s) d\'études',
      admin: {
        description: 'Domaines d\'études couverts par la bourse (rempli automatiquement par le workflow)',
      },
    },



    {
      name: 'langue',
      type: 'select',
      options: ['Anglais', 'Français', 'Arabe', 'Autre'],
    },
    {
      name: 'tunisienEligible',
      type: 'select',
      options: ['oui', 'non', 'inconnu'],
      defaultValue: 'inconnu',
    },
    {
      name: 'statut',
      type: 'select',
      options: ['active', 'expiree', 'a_venir'],
      defaultValue: 'active',
    },
    {
      name: 'niveau',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'eligibilite',
      type: 'group',
      label: 'Critères d\'éligibilité',
      fields: [
        { name: 'nationalitesEligibles', type: 'textarea', label: 'Nationalités éligibles' },
        { name: 'niveauRequis',          type: 'text',     label: 'Niveau requis' },
        { name: 'ageMax',                type: 'number',   label: 'Âge maximum' },
        { name: 'conditionsSpeciales',   type: 'textarea', label: 'Conditions spéciales' },
      ],
    },
    {
      name: 'documentsRequis',
      type: 'array',
      label: 'Documents requis',
      fields: [
        { name: 'nom',         type: 'text',     required: true },
        { name: 'obligatoire', type: 'checkbox', defaultValue: true },
        { name: 'description', type: 'text' },
      ],
    },
    {
      name: 'financement',
      type: 'text',
      defaultValue: '100% financée',
    },
    {
      name: 'dateLimite',
      type: 'date',
    },
    {
      name: 'dateOuverture',
      type: 'date',
    },
    {
      name: 'lienOfficiel',
      type: 'text',
      required: true,
    },
    {
  name: 'image',
  type: 'upload',
  relationTo: 'media',
  label: 'Image / Logo de la bourse',
  admin: {
    description: 'Logo ou image représentative de la bourse',
  },
},


{
  name: 'embedding',
  type: 'json', 
  admin: {
    readOnly: true,
    hidden: true, // Pas besoin de polluer l'interface admin avec des listes de nombres
  },
},
  ],
 
};

export default Bourses;
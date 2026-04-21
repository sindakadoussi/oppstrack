import { CollectionConfig } from 'payload';

const Bourses: CollectionConfig = {
  slug: 'bourses',
  admin: {
    useAsTitle: 'nom',
    defaultColumns: [
      'nom', 'pays', 'niveau', 'financement',
      'dateOuverture', 'dateLimite', 'statut',
      'tunisienEligible', 'domaine', 'langue',
      'description', 'eligibilite', 'documentsRequis','image'
    ],
  },
  access: {
    read:   () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
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

    // ✅ NOUVEAU : champ lienPostuler
    {
      name: 'lienPostuler',
      type: 'text',
      label: 'Lien pour postuler',
      admin: {
        description: 'URL directe vers la page de candidature officielle',
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
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (operation !== 'create') return;
        try {
          await fetch('http://localhost:5678/webhook/nouvelle-bourse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nom:          doc.nom          || '',
              pays:         doc.pays         || '',
              financement:  doc.financement  || '',
              dateLimite:   doc.dateLimite   || '',
              lienOfficiel: doc.lienOfficiel || '',
              niveau:       doc.niveau       || '',
              description:  doc.description  || '',
            }),
          });
        } catch (e) {
          console.warn('Hook nouvelle bourse:', (e as Error).message);
        }
      },
    ],
  },
};

export default Bourses;
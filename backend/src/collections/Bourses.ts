import { CollectionConfig } from 'payload';

const Bourses: CollectionConfig = {
  slug: 'bourses',
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'pays', 'niveau', 'financement', 'dateOuverture', 'dateLimite', 'statut','tunisienEligible','domaine', 'langue','description'],
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
      // ← TEXT au lieu de SELECT — accepte n'importe quel pays
      name: 'pays',
      type: 'text',
      required: true,
    },
    {
  name: 'domaine',
  type: 'select',
  options: ['Sciences', 'Ingénierie', 'Médecine', 'Droit', 'Économie', 'Arts', 'Informatique', 'Agriculture', 'Tous domaines'],
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
      // ← TEXT au lieu de SELECT — accepte Master, Doctorat, Licence, etc.
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
      // ← TEXT au lieu de SELECT — 100% financée, Partielle, etc.
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
   

  ],
};

export default Bourses;
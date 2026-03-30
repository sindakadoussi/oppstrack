import { CollectionConfig } from 'payload';

const Bourses: CollectionConfig = {
  slug: 'bourses',
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'pays', 'niveau', 'financement', 'dateOuverture', 'dateLimite', 'statut','tunisienEligible','domaine', 'langue','description', 'eligibilite', 'documentsRequis'],
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
import { CollectionConfig } from 'payload';

const Match: CollectionConfig = {
  slug: 'match',
  admin: {
    useAsTitle: 'id',
    description: 'Scores de compatibilité entre étudiants et bourses avec analyse détaillée',
  },
  access: {
  create: () => true,
  read: () => true,
  update: () => true,
  delete: ({ req }) => !!req.user,
},
  fields: [
    // ==========================================
    // RELATIONS
    // ==========================================
    {
      name: 'userId',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'Étudiant',
      },
    },
    {
      name: 'bourseId',
      type: 'relationship',
      relationTo: 'bourses',
      required: true,
      admin: {
        description: 'Bourse évaluée',
      },
    },

    // ==========================================
    // SCORE PRINCIPAL
    // ==========================================
    {
      name: 'matchScore',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      admin: {
        description: 'Score global de compatibilité (0-100)',
        step: 1,
      },
    },

    // ==========================================
    // DÉTAIL DU BREAKDOWN
    // ==========================================
    {
      name: 'matchBreakdown',
      type: 'group',
      fields: [
        {
          name: 'eligibility',
          type: 'number',
          required: true,
          min: 0,
          max: 35,
          admin: {
            description: 'Score d\'éligibilité (35% du total)',
          },
        },
        {
          name: 'experience',
          type: 'number',
          required: true,
          min: 0,
          max: 35,
          admin: {
            description: 'Score d\'expérience académique & pro (35% du total)',
          },
        },
        {
          name: 'certifications',
          type: 'number',
          required: true,
          min: 0,
          max: 25,
          admin: {
            description: 'Score de certifications & tests (25% du total)',
          },
        },
        {
          name: 'bonus',
          type: 'number',
          required: true,
          min: -20,
          max: 20,
          admin: {
            description: 'Bonus ou malus additif',
          },
        },
      ],
    },

    // ==========================================
    // DÉTAILS DU TEST DE LANGUE
    // ==========================================
    {
      name: 'hasLanguageTest',
      type: 'checkbox',
      admin: {
        description: 'L\'étudiant dispose-t-il d\'une certification de langue internationale ?',
      },
    },

    {
      name: 'languageTestDetails',
      type: 'group',
      admin: {
        description: 'Détails du test de langue si disponible',
        condition: (data) => data?.hasLanguageTest === true,
      },
      fields: [
        {
          name: 'testType',
          type: 'select',
          options: ['IELTS', 'TOEFL', 'DELF', 'DALF', 'TEF', 'TCF'],
          admin: {
            description: 'Type de test',
          },
        },
        {
          name: 'score',
          type: 'number',
          admin: {
            description: 'Score obtenu',
          },
        },
        {
          name: 'level',
          type: 'text',
          admin: {
            description: 'Niveau (B1, B2, C1, C2, etc)',
          },
        },
        {
          name: 'expiryDate',
          type: 'date',
          admin: {
            description: 'Date d\'expiration du test',
          },
        },
      ],
    },

    // ==========================================
    // RAISONS DE MATCH
    // ==========================================
{
  name: 'matchReasons',
  type: 'textarea',
  admin: {
    description: 'Raisons du match',
  },
},

    // ==========================================
    // RECOMMANDATIONS PERSONNALISÉES
    // ==========================================
    {
      name: 'recommendations',
      type: 'array',
      admin: {
        description: 'Conseils pour améliorer le score',
      },
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          options: [
            { label: '🌍 Langue', value: 'language' },
            { label: '💼 Expérience Professionnelle', value: 'experience' },
            { label: '🏆 Certification', value: 'certification' },
            { label: '📚 Académique', value: 'academic' },
            { label: '📊 GPA', value: 'gpa' },
            { label: '🔬 Recherche', value: 'research' },
          ],
        },
        {
          name: 'text',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Conseil détaillé',
          },
        },
        {
          name: 'impact',
          type: 'select',
          required: true,
          options: [
            { label: '+5 points', value: '5' },
            { label: '+10 points', value: '10' },
            { label: '+15 points', value: '15' },
            { label: '+20 points', value: '20' },
          ],
          admin: {
            description: 'Points potentiels à gagner',
          },
        },
        {
          name: 'priority',
          type: 'select',
          required: true,
          options: [
            { label: '🔴 Critique', value: 'high' },
            { label: '🟡 Important', value: 'medium' },
            { label: '🟢 Souhaitable', value: 'low' },
          ],
        },
      ],
    },

    // ==========================================
    // STATUT ET DATES
    // ==========================================
    {
      name: 'statut',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: '✅ Actif', value: 'active' },
        { label: '📌 Archivé', value: 'archived' },
        { label: '⏳ En attente', value: 'pending' },
      ],
      admin: {
        description: 'Statut du score',
      },
    },

    {
      name: 'dateLimite',
      type: 'date',
      required: true,
      admin: {
        description: 'Deadline de la bourse (copie depuis Bourses)',
        readOnly: true,
      },
    },

    {
      name: 'jourcRestants',
      type: 'number',
      admin: {
        description: 'Jours restants pour postuler (calculé)',
        readOnly: true,
      },
    },

    // ==========================================
    // DÉTAILS ACADÉMIQUES CAPTURÉS
    // ==========================================
    {
      name: 'academicDetails',
      type: 'group',
      admin: {
        description: 'Détails académiques de l\'étudiant au moment du scoring',
      },
      fields: [
        {
          name: 'gpa',
          type: 'number',
          admin: {
            description: 'GPA/Moyenne au moment du scoring',
            step: 0.01,
          },
        },
        {
          name: 'projectCount',
          type: 'number',
          admin: {
            description: 'Nombre de projets académiques',
          },
        },
        {
          name: 'publicationCount',
          type: 'number',
          admin: {
            description: 'Nombre de publications',
          },
        },
        {
          name: 'hasResearchExperience',
          type: 'checkbox',
          admin: {
            description: 'A participé à la recherche',
          },
        },
      ],
    },

    // ==========================================
    // DÉTAILS PROFESSIONNELS CAPTURÉS
    // ==========================================
    {
      name: 'professionalDetails',
      type: 'group',
      admin: {
        description: 'Détails professionnels au moment du scoring',
      },
      fields: [
        {
          name: 'workExperienceMonths',
          type: 'number',
          admin: {
            description: 'Mois d\'expérience professionnelle',
          },
        },
        {
          name: 'hasInternship',
          type: 'checkbox',
          admin: {
            description: 'A complété un stage',
          },
        },
        {
          name: 'hasLeadershipRole',
          type: 'checkbox',
          admin: {
            description: 'A une responsabilité de leadership',
          },
        },
        {
          name: 'certificationCount',
          type: 'number',
          admin: {
            description: 'Nombre de certifications professionnelles',
          },
        },
      ],
    },

    // ==========================================
    // INFORMATIONS BOURSE CAPTURÉES
    // ==========================================
    {
      name: 'scholarshipDetails',
      type: 'group',
      admin: {
        description: 'Détails de la bourse au moment du scoring (snapshot)',
      },
      fields: [
        {
          name: 'bourseNom',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'boursePays',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'bourseDomaine',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'bourseNiveau',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'bourseStatut',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'tunisienEligible',
          type: 'text',
          admin: {
            readOnly: true,
          },
        },
      ],
    },

    // ==========================================
    // ALGORITHME VERSION
    // ==========================================
    {
      name: 'algorithmVersion',
      type: 'text',
      defaultValue: 'v2.0',
      admin: {
        description: 'Version de l\'algorithme utilisé',
        readOnly: true,
      },
    },

    // ==========================================
    // TIMESTAMPS
    // ==========================================
    {
      name: 'calculatedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        description: 'Quand le score a été calculé',
        readOnly: true,
      },
    },

    // ==========================================
    // NOTES INTERNES
    // ==========================================
    {
      name: 'internalNotes',
      type: 'textarea',
      admin: {
        description: 'Notes internes (non visibles à l\'étudiant)',
      },
    },
  ],

  // ==========================================
  // INDEX POUR PERFORMANCE (Payload v3 syntax)
  // ==========================================



  // ==========================================
  // TIMESTAMPS AUTOMATIQUES
  // ==========================================
  timestamps: true,
};

export default Match;
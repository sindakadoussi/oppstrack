// src/utils/translateDB.js
// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRE DE TRADUCTION POUR LES DONNÉES DE LA BASE DE DONNÉES
// Toutes les valeurs stockées en FR sont traduites dynamiquement selon la langue UI
// ═══════════════════════════════════════════════════════════════════════════

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIGURATION DES LANGUES SUPPORTÉES
═══════════════════════════════════════════════════════════════════════════ */
export const SUPPORTED_LANGS = ['fr', 'en'];
export const DEFAULT_LANG = 'fr';

/* ═══════════════════════════════════════════════════════════════════════════
   DICTIONNAIRES DE TRADUCTION PAR CATÉGORIE
═══════════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════════════
// 📝 DESCRIPTIONS DE BOURSES (textes libres)
// ═══════════════════════════════════════════════════════════════════════════

export const SCHOLARSHIP_DESCRIPTIONS = {
  fr: {
    'Bourse internationale. Source : ScholarshipRoar. Consultez le lien officiel pour plus d\'informations.': 
      'Bourse internationale. Source : ScholarshipRoar. Consultez le lien officiel pour plus d\'informations.',
    'Bourse internationale. Source : ScholarshipsAds. Consultez le lien officiel pour plus d\'informations.': 
      'Bourse internationale. Source : ScholarshipsAds. Consultez le lien officiel pour plus d\'informations.',
    'Fondation politique allemande finançant des étudiants engagés pour l\'environnement et les droits humains.': 
      'Fondation politique allemande finançant des étudiants engagés pour l\'environnement et les droits humains.',
  },
  en: {
    'Bourse internationale. Source : ScholarshipRoar. Consultez le lien officiel pour plus d\'informations.': 
      'International scholarship. Source: ScholarshipRoar. Check the official link for more information.',
    'Bourse internationale. Source : ScholarshipsAds. Consultez le lien officiel pour plus d\'informations.': 
      'International scholarship. Source: ScholarshipsAds. Check the official link for more information.',
    'Fondation politique allemande finançant des étudiants engagés pour l\'environnement et les droits humains.': 
      'German political foundation funding students committed to environment and human rights.',
  }
};

// 🌍 Pays / Countries
export const COUNTRIES = {
  fr: {
    'France': 'France', 'Allemagne': 'Allemagne', 'Royaume-Uni': 'Royaume-Uni',
    'États-Unis': 'États-Unis', 'Canada': 'Canada', 'Australie': 'Australie',
    'Japon': 'Japon', 'Chine': 'Chine', 'Corée du Sud': 'Corée du Sud',
    'Suisse': 'Suisse', 'Pays-Bas': 'Pays-Bas', 'Belgique': 'Belgique',
    'Espagne': 'Espagne', 'Italie': 'Italie', 'Portugal': 'Portugal',
    'Suède': 'Suède', 'Norvège': 'Norvège', 'Danemark': 'Danemark',
    'Finlande': 'Finlande', 'Autriche': 'Autriche', 'Irlande': 'Irlande',
    'Pologne': 'Pologne', 'Tchéquie': 'Tchéquie', 'Hongrie': 'Hongrie',
    'Roumanie': 'Roumanie', 'Grèce': 'Grèce', 'Turquie': 'Turquie',
    'Maroc': 'Maroc', 'Tunisie': 'Tunisie', 'Algérie': 'Algérie',
    'Égypte': 'Égypte', 'Sénégal': 'Sénégal', 'Côte d\'Ivoire': 'Côte d\'Ivoire',
    'Cameroun': 'Cameroun', 'Afrique du Sud': 'Afrique du Sud',
    'Arabie Saoudite': 'Arabie Saoudite', 'Émirats arabes unis': 'Émirats arabes unis',
    'Qatar': 'Qatar', 'Inde': 'Inde', 'Pakistan': 'Pakistan',
    'Brésil': 'Brésil', 'Mexique': 'Mexique', 'Argentine': 'Argentine',
    'International': 'International', 'Mondial': 'International', 'Tous pays': 'International',
  },
  en: {
    'France': 'France', 'Allemagne': 'Germany', 'Royaume-Uni': 'United Kingdom',
    'États-Unis': 'United States', 'Canada': 'Canada', 'Australie': 'Australia',
    'Japon': 'Japan', 'Chine': 'China', 'Corée du Sud': 'South Korea',
    'Suisse': 'Switzerland', 'Pays-Bas': 'Netherlands', 'Belgique': 'Belgium',
    'Espagne': 'Spain', 'Italie': 'Italy', 'Portugal': 'Portugal',
    'Suède': 'Sweden', 'Norvège': 'Norway', 'Danemark': 'Denmark',
    'Finlande': 'Finland', 'Autriche': 'Austria', 'Irlande': 'Ireland',
    'Pologne': 'Poland', 'Tchéquie': 'Czech Republic', 'Hongrie': 'Hungary',
    'Roumanie': 'Romania', 'Grèce': 'Greece', 'Turquie': 'Turkey',
    'Maroc': 'Morocco', 'Tunisie': 'Tunisia', 'Algérie': 'Algeria',
    'Égypte': 'Egypt', 'Sénégal': 'Senegal', 'Côte d\'Ivoire': 'Ivory Coast',
    'Cameroun': 'Cameroon', 'Afrique du Sud': 'South Africa',
    'Arabie Saoudite': 'Saudi Arabia', 'Émirats arabes unis': 'United Arab Emirates',
    'Qatar': 'Qatar', 'Inde': 'India', 'Pakistan': 'Pakistan',
    'Brésil': 'Brazil', 'Mexique': 'Mexico', 'Argentine': 'Argentina',
    'International': 'International', 'Mondial': 'International', 'Tous pays': 'International',
  }
};

// 🎓 Niveaux d'études / Education Levels
export const EDUCATION_LEVELS = {
  fr: {
    'Licence': 'Licence', 'Bachelor': 'Licence', 'Undergraduate': 'Licence',
    'Master': 'Master', 'Postgraduate': 'Master',
    'Doctorat': 'Doctorat', 'PhD': 'Doctorat', 'Doctoral': 'Doctorat',
    'Ingénieur': 'Ingénieur', 'Engineering': 'Ingénieur',
    'Baccalauréat': 'Baccalauréat', 'High School': 'Baccalauréat',
    'Prépa': 'Classe préparatoire', 'Foundation': 'Année préparatoire',
    'Tous niveaux': 'Tous niveaux', 'Any level': 'Tous niveaux',
  },
  en: {
    'Licence': 'Bachelor', 'Bachelor': 'Bachelor', 'Undergraduate': 'Bachelor',
    'Master': 'Master', 'Postgraduate': 'Master',
    'Doctorat': 'PhD', 'PhD': 'PhD', 'Doctoral': 'PhD',
    'Ingénieur': 'Engineering Degree', 'Engineering': 'Engineering Degree',
    'Baccalauréat': 'High School Diploma', 'High School': 'High School Diploma',
    'Prépa': 'Preparatory Class', 'Foundation': 'Foundation Year',
    'Tous niveaux': 'All levels', 'Any level': 'All levels',
  }
};

// 💰 Types de financement / Funding Types
export const FUNDING_TYPES = {
  fr: {
    '100% financée': '100% financée', '100%': '100% financée',
    'Bourse complète': 'Bourse complète', 'Full scholarship': 'Bourse complète',
    'Partielle': 'Partielle', 'Partial': 'Partielle',
    '50%': 'Partielle', 'Financement partiel': 'Partielle',
    'Prêt étudiant': 'Prêt étudiant', 'Student loan': 'Prêt étudiant',
    'Bourse au mérite': 'Bourse au mérite', 'Merit-based': 'Bourse au mérite',
    'Bourse sociale': 'Bourse sociale', 'Need-based': 'Bourse sociale',
    'Non précisé': 'Non précisé', 'Not specified': 'Non précisé',
    '100% funded': '100% financée', 'Fully funded': '100% financée',
  },
  en: {
    '100% financée': '100% funded', '100%': '100% funded',
    'Bourse complète': 'Full scholarship', 'Full scholarship': 'Full scholarship',
    'Partielle': 'Partial funding', 'Partial': 'Partial funding',
    '50%': 'Partial funding', 'Financement partiel': 'Partial funding',
    'Prêt étudiant': 'Student loan', 'Student loan': 'Student loan',
    'Bourse au mérite': 'Merit-based scholarship', 'Merit-based': 'Merit-based scholarship',
    'Bourse sociale': 'Need-based scholarship', 'Need-based': 'Need-based scholarship',
    'Non précisé': 'Not specified', 'Not specified': 'Not specified',
    '100% funded': '100% funded', 'Fully funded': '100% funded',
  }
};

// 📚 Domaines d'études / Fields of Study
export const FIELDS_OF_STUDY = {
  fr: {
    'Informatique': 'Informatique', 'Computer Science': 'Informatique',
    'Génie logiciel': 'Génie logiciel', 'Software Engineering': 'Génie logiciel',
    'Intelligence Artificielle': 'IA', 'Artificial Intelligence': 'IA',
    'Data Science': 'Data Science', 'Cybersécurité': 'Cybersécurité',
    'Réseaux': 'Réseaux et Télécoms', 'Networks': 'Réseaux et Télécoms',
    'Gestion': 'Gestion', 'Management': 'Gestion',
    'Marketing': 'Marketing', 'Finance': 'Finance',
    'Droit': 'Droit', 'Law': 'Droit',
    'Médecine': 'Médecine', 'Medicine': 'Médecine',
    'Santé': 'Santé', 'Health': 'Santé',
    'Biologie': 'Biologie', 'Biology': 'Biologie',
    'Chimie': 'Chimie', 'Chemistry': 'Chimie',
    'Physique': 'Physique', 'Physics': 'Physique',
    'Mathématiques': 'Mathématiques', 'Mathematics': 'Mathématiques',
    'Architecture': 'Architecture', 'Génie civil': 'Génie civil',
    'Génie mécanique': 'Génie mécanique', 'Génie électrique': 'Génie électrique',
    'Design': 'Design', 'Arts': 'Arts',
    'Lettres': 'Lettres', 'Literature': 'Lettres',
    'Psychologie': 'Psychologie', 'Sociologie': 'Sociologie',
    'Tous domaines': 'Tous domaines', 'All fields': 'Tous domaines',
  },
  en: {
    'Informatique': 'Computer Science', 'Computer Science': 'Computer Science',
    'Génie logiciel': 'Software Engineering', 'Software Engineering': 'Software Engineering',
    'Intelligence Artificielle': 'Artificial Intelligence', 'Artificial Intelligence': 'Artificial Intelligence',
    'IA': 'AI', 'Data Science': 'Data Science', 'Cybersécurité': 'Cybersecurity',
    'Réseaux': 'Networks & Telecommunications', 'Networks': 'Networks & Telecommunications',
    'Gestion': 'Management', 'Management': 'Management',
    'Marketing': 'Marketing', 'Finance': 'Finance',
    'Droit': 'Law', 'Law': 'Law',
    'Médecine': 'Medicine', 'Medicine': 'Medicine',
    'Santé': 'Health Sciences', 'Health': 'Health Sciences',
    'Biologie': 'Biology', 'Biology': 'Biology',
    'Chimie': 'Chemistry', 'Chemistry': 'Chemistry',
    'Physique': 'Physics', 'Physics': 'Physics',
    'Mathématiques': 'Mathematics', 'Mathematics': 'Mathematics',
    'Architecture': 'Architecture', 'Génie civil': 'Civil Engineering',
    'Génie mécanique': 'Mechanical Engineering', 'Génie électrique': 'Electrical Engineering',
    'Design': 'Design', 'Arts': 'Arts',
    'Lettres': 'Literature', 'Literature': 'Literature',
    'Psychologie': 'Psychology', 'Sociologie': 'Sociology',
    'Tous domaines': 'All fields', 'All fields': 'All fields',
  }
};

// 📄 Types de documents / Document Types
export const DOCUMENT_TYPES = {
  fr: {
    'CV': 'CV', 'Curriculum Vitae': 'CV', 'Resume': 'CV',
    'Lettre de motivation': 'Lettre de motivation', 'Motivation letter': 'Lettre de motivation',
    'Recommandation': 'Lettre de recommandation', 'Recommendation': 'Lettre de recommandation',
    'Relevé de notes': 'Relevé de notes', 'Transcript': 'Relevé de notes',
    'Diplôme': 'Diplôme', 'Degree certificate': 'Diplôme',
    'Passeport': 'Passeport', 'Passport': 'Passeport',
    'Certificat de langue': 'Certificat de langue', 'Language certificate': 'Certificat de langue',
    'IELTS': 'IELTS', 'TOEFL': 'TOEFL', 'DELF': 'DELF', 'DALF': 'DALF',
    'Portfolio': 'Portfolio', 'Projet': 'Projet académique',
    'Autre': 'Autre', 'Other': 'Autre',
  },
  en: {
    'CV': 'CV', 'Curriculum Vitae': 'CV', 'Resume': 'CV',
    'Lettre de motivation': 'Motivation Letter', 'Motivation letter': 'Motivation Letter',
    'Recommandation': 'Recommendation Letter', 'Recommendation': 'Recommendation Letter',
    'Relevé de notes': 'Academic Transcript', 'Transcript': 'Academic Transcript',
    'Diplôme': 'Degree Certificate', 'Degree certificate': 'Degree Certificate',
    'Passeport': 'Passport', 'Passport': 'Passport',
    'Certificat de langue': 'Language Certificate', 'Language certificate': 'Language Certificate',
    'IELTS': 'IELTS', 'TOEFL': 'TOEFL', 'DELF': 'DELF', 'DALF': 'DALF',
    'Portfolio': 'Portfolio', 'Projet': 'Academic Project',
    'Autre': 'Other', 'Other': 'Other',
  }
};

// 📊 Statuts / Status Labels
export const STATUS_LABELS = {
  fr: {
    'en_cours': 'En cours', 'in_progress': 'En cours',
    'terminé': 'Terminé', 'completed': 'Terminé', 'done': 'Terminé',
    'expiree': 'Expirée', 'expired': 'Expirée',
    'brouillon': 'Brouillon', 'draft': 'Brouillon',
    'soumis': 'Soumis', 'submitted': 'Soumis',
    'en_attente': 'En attente', 'pending': 'En attente',
    'accepté': 'Accepté', 'accepted': 'Accepté',
    'refusé': 'Refusé', 'rejected': 'Refusé',
    'fort': 'Fort', 'strong': 'Fort',
    'moyen': 'Moyen', 'medium': 'Moyen',
    'faible': 'Faible', 'weak': 'Faible',
    'haute': 'Haute priorité', 'high': 'Haute priorité',
    'moyenne': 'Priorité moyenne', 'medium': 'Priorité moyenne',
    'basse': 'Basse priorité', 'low': 'Basse priorité',
  },
  en: {
    'en_cours': 'In progress', 'in_progress': 'In progress',
    'terminé': 'Completed', 'completed': 'Completed', 'done': 'Completed',
    'expiree': 'Expired', 'expired': 'Expired',
    'brouillon': 'Draft', 'draft': 'Draft',
    'soumis': 'Submitted', 'submitted': 'Submitted',
    'en_attente': 'Pending', 'pending': 'Pending',
    'accepté': 'Accepted', 'accepted': 'Accepted',
    'refusé': 'Rejected', 'rejected': 'Rejected',
    'fort': 'Strong', 'strong': 'Strong',
    'moyen': 'Medium', 'medium': 'Medium',
    'faible': 'Weak', 'weak': 'Weak',
    'haute': 'High priority', 'high': 'High priority',
    'moyenne': 'Medium priority', 'medium': 'Medium priority',
    'basse': 'Low priority', 'low': 'Low priority',
  }
};

// 🗣️ Langues / Languages (CECRL)
export const LANGUAGE_LEVELS = {
  fr: {
    'A1': 'A1 - Débutant', 'A2': 'A2 - Élémentaire',
    'B1': 'B1 - Intermédiaire', 'B2': 'B2 - Intermédiaire supérieur',
    'C1': 'C1 - Avancé', 'C2': 'C2 - Maîtrise',
    'Natif': 'Natif', 'Native': 'Natif',
    'Anglais': 'Anglais', 'English': 'Anglais',
    'Français': 'Français', 'French': 'Français',
    'Arabe': 'Arabe', 'Arabic': 'Arabe',
    'Espagnol': 'Espagnol', 'Spanish': 'Espagnol',
    'Allemand': 'Allemand', 'German': 'Allemand',
  },
  en: {
    'A1': 'A1 - Beginner', 'A2': 'A2 - Elementary',
    'B1': 'B1 - Intermediate', 'B2': 'B2 - Upper Intermediate',
    'C1': 'C1 - Advanced', 'C2': 'C2 - Mastery',
    'Natif': 'Native', 'Native': 'Native',
    'Anglais': 'English', 'English': 'English',
    'Français': 'French', 'French': 'French',
    'Arabe': 'Arabic', 'Arabic': 'Arabic',
    'Espagnol': 'Spanish', 'Spanish': 'Spanish',
    'Allemand': 'German', 'German': 'German',
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   SEGMENTS DE TRADUCTION POUR TEXTES LIBRES (FR → EN)
   Utilisés pour la traduction partielle quand aucune correspondance exacte n'est trouvée
═══════════════════════════════════════════════════════════════════════════ */

const DESCRIPTION_SEGMENTS_FR_EN = [
  // Phrases complètes (priorité haute - ordre décroissant par longueur)
  ['Bourse internationale', 'International scholarship'],
  ['Source :', 'Source:'],
  ['Consultez le lien officiel pour plus d\'informations', 'Check the official link for more information'],
  ['Consultez le lien officiel', 'Check the official link'],
  ['pour plus d\'informations', 'for more information'],
  
  // Termes courants dans les descriptions
  ['financée', 'funded'],
  ['financement', 'funding'],
  ['étudiants', 'students'],
  ['engagement', 'commitment'],
  ['environnement', 'environment'],
  ['droits humains', 'human rights'],
  ['politique', 'political'],
  ['fondation', 'foundation'],
  ['allemande', 'German'],
  ['française', 'French'],
  ['européenne', 'European'],
  
  // Verbes et structures
  ['finançant', 'funding'],
  ['soutenant', 'supporting'],
  ['visant', 'aiming'],
  ['destinée', 'destined'],
  ['ouverte', 'open'],
  ['accessible', 'accessible'],
];

const FUNDING_SEGMENTS_FR_EN = [
  // Montants et fréquences
  [/(\d+)\s*EUR\s*mensuels?/gi, '$1 EUR monthly'],
  [/(\d+)\s*USD\s*mensuels?/gi, '$1 USD monthly'],
  [/(\d+)\s*€\s*par\s*mois/gi, '$1 EUR per month'],
  [/par\s*mois/gi, 'per month'],
  [/par\s*an/gi, 'per year'],
  [/annuels?/gi, 'annual'],
  
  // Composants de financement
  [/frais\s*de\s*scolarité/gi, 'tuition fees'],
  [/assurance\s*sociale/gi, 'social insurance'],
  [/assurance\s*médicale/gi, 'health insurance'],
  [/frais\s*de\s*vie/gi, 'living expenses'],
  [/hébergement/gi, 'accommodation'],
  [/transport/gi, 'transportation'],
  [/couverts?/gi, 'covered'],
  [/inclus?/gi, 'included'],
  [/plus/gi, 'plus'],
  [/et/gi, 'and'],
  
  // Types
  [/bourse\s*complète/gi, 'full scholarship'],
  [/bourse\s*partielle/gi, 'partial scholarship'],
  [/aide\s*financière/gi, 'financial aid'],
  [/allocation/gi, 'allowance'],
  [/stipend/gi, 'stipend'],
];

const DOCUMENT_SEGMENTS_FR_EN = [
  // Documents principaux
  ['formulaire de candidature', 'Application form'],
  ['lettre de motivation', 'Motivation letter'],
  ['relevé de notes', 'Academic transcript'],
  ['relevé de notes académiques', 'Academic transcript'],
  ['références académiques', 'Academic references'],
  ['lettres de recommandation', 'Recommendation letters'],
  ['curriculum vitae', 'CV'],
  ['preuve de langue', 'Language certificate'],
  ['passeport', 'Passport'],
  ['diplôme', 'Degree certificate'],
  ['portfolio', 'Portfolio'],
  
  // Descripteurs
  ['officiel', 'official'],
  ['à remplir', 'to be filled'],
  ['expliquant', 'explaining'],
  ['motivation', 'motivation'],
  ['résultats', 'results'],
  ['recommandation', 'recommendation'],
  ['détaillé', 'detailed'],
  ['maîtrise de', 'proficiency in'],
  ['si nécessaire', 'if necessary'],
  ['optionnel', '(optional)'],
  ['obligatoire', '(required)'],
];

/* ═══════════════════════════════════════════════════════════════════════════
   FONCTION PRINCIPALE : translateDB()
═══════════════════════════════════════════════════════════════════════════ */

export const translateDB = (category, value, lang = DEFAULT_LANG, options = {}) => {
  if (!value || typeof value !== 'string') return value;
  if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
  if (lang === DEFAULT_LANG) return value;

  const {
    fallbackToOriginal = true,
    caseSensitive = false,
    partialMatch = true,
    trim = true,
  } = options;

  let searchValue = trim ? value.trim() : value;
  if (!caseSensitive) searchValue = searchValue.toLowerCase();

  const dictionaries = {
    country: COUNTRIES, pays: COUNTRIES,
    level: EDUCATION_LEVELS, niveau: EDUCATION_LEVELS, education: EDUCATION_LEVELS,
    funding: FUNDING_TYPES, financement: FUNDING_TYPES,
    field: FIELDS_OF_STUDY, domaine: FIELDS_OF_STUDY,
    document: DOCUMENT_TYPES,
    status: STATUS_LABELS, statut: STATUS_LABELS,
    language: LANGUAGE_LEVELS, langue: LANGUAGE_LEVELS,
  };

  const dict = dictionaries[category];
  if (!dict || !dict[lang]) return fallbackToOriginal ? value : null;

  const translations = dict[lang];

  // 1. Recherche exacte
  if (translations[searchValue]) return translations[searchValue];

  // 2. Recherche partielle
  if (partialMatch) {
    for (const [fr, translated] of Object.entries(translations)) {
      if (searchValue.includes(fr.toLowerCase()) || fr.toLowerCase().includes(searchValue)) {
        return translated;
      }
    }
  }

  return fallbackToOriginal ? value : null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   FONCTIONS SPÉCIALISÉES AVEC TRADUCTION SEGMENTÉE
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Traduit une description de bourse avec détection de patterns complets
 */
export const tDescription = (value, lang = DEFAULT_LANG) => {
  if (!value || typeof value !== 'string') return value;
  if (lang === DEFAULT_LANG) return value;
  
  // 1. Recherche exacte dans le dictionnaire principal
  const exactMatch = SCHOLARSHIP_DESCRIPTIONS[lang]?.[value];
  if (exactMatch) return exactMatch;
  
  // 2. Patterns complets FR → EN pour descriptions courantes
  const completeDescriptionPatterns = [
    {
      fr: /Bourse\s*internationale\.?\s*Source\s*:\s*([^\.]+)\.?\s*Consultez\s*le\s*lien\s*officiel\s*pour\s*plus\s*d'informations/i,
      en: (match) => `International scholarship. Source: ${match[1]}. Check the official link for more information.`
    },
    {
      fr: /Programme\s*de\s*bourses\s*de\s*([^ ]+)\s*University\s*pour\s*students\s*en\s*(master\/doctorat|doctorat\/master)\s*avec\s*leadership/i,
      en: (match) => `${match[1]} University scholarship program for master/PhD students with leadership potential.`
    },
    {
      fr: /L'une\s*des\s*plus\s*prestigieuses\s*bourses\s*au\s*monde\s*pour\s*études\s*postgraduées\s*à\s*l'Université\s*d'Oxford/i,
      en: 'One of the world\'s most prestigious scholarships for postgraduate studies at the University of Oxford.'
    },
    {
      fr: /Fondation\s*politique\s*allemande\s*finançant\s*des\s*étudiants\s*engagés\s*pour\s*l'environnement\s*et\s*les\s*droits\s*humains/i,
      en: 'German political foundation funding students committed to environment and human rights.'
    },
  ];
  
  for (const { fr, en } of completeDescriptionPatterns) {
    const match = value.match(fr);
    if (match) {
      return typeof en === 'function' ? en(match) : en;
    }
  }
  
  // 3. Recherche partielle dans le dictionnaire principal
  const lowerValue = value.toLowerCase().trim();
  for (const [fr, translated] of Object.entries(SCHOLARSHIP_DESCRIPTIONS[lang] || {})) {
    if (lowerValue.includes(fr.toLowerCase().trim())) {
      return value.replace(new RegExp(fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), translated);
    }
  }
  
  // 4. Traduction segmentée FR → EN (seulement en dernier recours)
  if (lang === 'en') {
    let result = value;
    
    // Segments prioritaires (phrases/expressions complètes d'abord)
    const prioritySegments = [
      ['Bourse internationale', 'International scholarship'],
      ['Source :', 'Source:'],
      ['Consultez le lien officiel pour plus d\'informations', 'Check the official link for more information'],
      ['Consultez le lien officiel', 'Check the official link'],
      ['pour plus d\'informations', 'for more information'],
      ['Programme de bourses', 'Scholarship program'],
      ['pour étudiants en', 'for students in'],
      ['avec leadership', 'with leadership potential'],
      ['études postgraduées', 'postgraduate studies'],
      ['Université d\'Oxford', 'University of Oxford'],
      ['Fondation politique', 'Political foundation'],
      ['étudiants engagés', 'committed students'],
      ['droits humains', 'human rights'],
    ];
    
    // Appliquer les segments prioritaires
    for (const [fr, en] of prioritySegments) {
      const escaped = fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      result = result.replace(regex, en);
    }
    
    // Segments génériques (mots individuels) - seulement si pas déjà traduit
    const genericSegments = [
      ['étudiants', 'students'], ['student', 'student'],
      ['engagement', 'commitment'], ['environnement', 'environment'],
      ['politique', 'political'], ['fondation', 'foundation'],
      ['allemande', 'German'], ['française', 'French'],
      ['finançant', 'funding'], ['soutenant', 'supporting'],
    ];
    
    // Traduire seulement les mots non encore traduits
    for (const [fr, en] of genericSegments) {
      const regex = new RegExp(`\\b${fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (!result.toLowerCase().includes(en.toLowerCase())) {
        result = result.replace(regex, en);
      }
    }
    
    // 5. Nettoyage post-traduction
    result = result.replace(/\b(\w+)\s+\1\b/gi, '$1');
    result = result.replace(/\s+([,.:])/g, '$1 ').replace(/([,.:])\s+/g, '$1 ');
    result = result.charAt(0).toUpperCase() + result.slice(1);
    
    return result.trim();
  }
  
  return value;
};


/**
 * Traduit un type de financement avec support des montants complexes
 */

export const tFunding = (value, lang = DEFAULT_LANG) => {
  if (!value || typeof value !== 'string') return value;
  if (lang === DEFAULT_LANG) return value;
  
  // 1. Essayer la traduction exacte via translateDB
  const exact = translateDB('funding', value, lang);
  if (exact !== value) return exact;
  
  // 2. Patterns complets FR → EN (priorité haute)
  const completePatterns = [
    {
      fr: /(\d+)\s*EUR\s*mensuels?\s*\+\s*frais\s*de\s*scolarité\s*et\s*assurance\s*sociale\s*couverts?/i,
      en: '$1 EUR monthly + tuition fees and social insurance covered'
    },
    {
      fr: /couverture\s*complète\s*des?\s*frais\s*de\s*scolarité,\s*allocations?\s*de\s*subsistance,\s*et\s*opportunités\s*de\s*développement\s*professionnel/i,
      en: 'Full coverage of tuition fees, living allowances, and professional development opportunities'
    },
    {
      fr: /tuition\s*fees\s*complands?\s*\+\s*allowance\s*annualle\s*\+\s*frais\s*de\s*subsistance\s*covered/i,
      en: 'Full tuition fees + annual allowance + living expenses covered'
    },
    {
      fr: /100%\s*financée/i,
      en: '100% funded'
    },
    {
      fr: /bourse\s*complète/i,
      en: 'Full scholarship'
    },
    {
      fr: /partielle/i,
      en: 'Partial funding'
    },
  ];
  
  for (const { fr, en } of completePatterns) {
    if (fr.test(value)) {
      return value.replace(fr, en);
    }
  }
  
  // 3. Traduction segmentée intelligente (seulement si pas de pattern complet)
  if (lang === 'en') {
    let result = value;
    
    // D'abord, normaliser les espaces et ponctuation
    result = result.replace(/\s+/g, ' ').trim();
    
    // Remplacements contextuels (ordre important)
    const contextualReplacements = [
      // Montants + fréquences
      [/(\d+)\s*(EUR|USD|€)\s*(mensuels?|par\s*mois)/gi, '$1 $2 monthly'],
      [/(\d+)\s*(EUR|USD|€)\s*(annuels?|par\s*an)/gi, '$1 $2 annually'],
      
      // Composants de financement (traduire les groupes cohérents)
      [/frais\s*de\s*scolarité/gi, 'tuition fees'],
      [/frais\s*de\s*subsistance/gi, 'living expenses'],
      [/allocations?\s*de\s*subsistance/gi, 'living allowances'],
      [/assurance\s*sociale/gi, 'social insurance'],
      [/assurance\s*médicale/gi, 'health insurance'],
      [/frais\s*de\s*vie/gi, 'living costs'],
      [/hébergement/gi, 'accommodation'],
      [/transport/gi, 'transportation'],
      
      // Verbes/adjectifs de couverture
      [/couverts?/gi, 'covered'],
      [/inclus(?:e|es)?/gi, 'included'],
      [/financé(?:e|es)?/gi, 'funded'],
      [/prise\s*en\s*charge/gi, 'covered'],
      
      // Connecteurs (à traduire en dernier pour éviter les conflits)
      [/\s*et\s*/gi, ' and '],
      [/\s*ou\s*/gi, ' or '],
      [/\s*\+\s*/g, ' + '],
    ];
    
    for (const [pattern, replacement] of contextualReplacements) {
      result = result.replace(pattern, replacement);
    }
    
    // 4. Nettoyage post-traduction
    // - Supprimer les doublons de mots (ex: "covered covered")
    result = result.replace(/\b(\w+)\s+\1\b/gi, '$1');
    // - Normaliser les espaces autour des signes de ponctuation
    result = result.replace(/\s+([,+.])/g, '$1 ').replace(/([,+.])\s+/g, '$1 ');
    // - Capitalize first letter
    result = result.charAt(0).toUpperCase() + result.slice(1);
    
    return result.trim();
  }
  
  return value;
};

/**
 * Traduit un nom de document avec contexte
 */
export const tDocument = (value, lang = DEFAULT_LANG) => {
  if (!value || typeof value !== 'string') return value;
  if (lang === DEFAULT_LANG) return value;
  
  // 1. Essayer la traduction exacte
  const exact = translateDB('document', value, lang);
  if (exact !== value) return exact;
  
  // 2. Patterns complets FR → EN pour documents
  const completeDocPatterns = [
    {
      fr: /Formulaire\s*de\s*candidature\s*[-–]\s*Formulaire\s*officiel\s*à\s*remplir/i,
      en: 'Application form - Official form to be completed'
    },
    {
      fr: /Relevés?\s*de\s*notes\s*[-–]?\s*Transcripts?\s*académiques?\s*officiels/i,
      en: 'Academic transcripts - Official records'
    },
    {
      fr: /Lettre\s*de\s*motivation\s*[-–]?\s*Essay\s*expliquant\s*les\s*objectifs\s*et\s*l'impact\s*souhaité/i,
      en: 'Motivation letter - Essay explaining goals and desired impact'
    },
    {
      fr: /Lettres?\s*de\s*recommandation\s*[-–]?\s*[\d-]+\s*lettres?\s*de\s*références?\s*(académiques?|professionnelles?)/i,
      en: 'Recommendation letters - 2-3 academic or professional references'
    },
    {
      fr: /Certificat\s*de\s*langue\s*anglaise\s*\(optional\)\s*[-–]?\s*TOEFL\/IELTS\s*si\s*applicable\s*selon\s*la\s*nationalité/i,
      en: 'English language certificate (optional) - TOEFL/IELTS if applicable based on nationality'
    },
    {
      fr: /CV\s*[-–]?\s*Curriculum\s*vitae\s*détaillé/i,
      en: 'CV - Detailed curriculum vitae'
    },
  ];
  
  for (const { fr, en } of completeDocPatterns) {
    if (fr.test(value)) {
      return value.replace(fr, en);
    }
  }
  
  // 3. Traduction segmentée intelligente FR → EN
  if (lang === 'en') {
    let result = value;
    
    // Traduire d'abord les expressions complètes
    const phraseReplacements = [
      ['Formulaire de candidature', 'Application form'],
      ['Relevé de notes', 'Academic transcript'],
      ['Relevés de notes', 'Academic transcripts'],
      ['Lettre de motivation', 'Motivation letter'],
      ['Lettres de recommandation', 'Recommendation letters'],
      ['Certificat de langue anglaise', 'English language certificate'],
      ['Curriculum vitae', 'CV'],
      ['Scores de tests standardisés', 'Standardized test scores'],
      ['Diplôme de Licence', 'Bachelor\'s degree'],
      ['Diplôme de premier cycle', 'Undergraduate degree'],
    ];
    
    for (const [fr, en] of phraseReplacements) {
      const escaped = fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      result = result.replace(regex, en);
    }
    
    // Puis les mots individuels (seulement si pas déjà dans une traduction)
    const wordReplacements = [
      ['officiel', 'official'], ['officielle', 'official'],
      ['à remplir', 'to be completed'], ['expliquant', 'explaining'],
      ['objectifs', 'goals'], ['impact', 'impact'],
      ['académiques', 'academic'], ['professionnelles', 'professional'],
      ['si applicable', 'if applicable'], ['selon la nationalité', 'based on nationality'],
      ['détaillé', 'detailed'], ['pré requis', 'prerequisite'],
      ['optionnel', '(optional)'], ['obligatoire', '(required)'],
    ];
    
    for (const [fr, en] of wordReplacements) {
      if (!result.toLowerCase().includes(en.toLowerCase().replace(/[()]/g, ''))) {
        const escaped = fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        result = result.replace(regex, en);
      }
    }
    
    // 4. Nettoyage et formatage
    result = result.charAt(0).toUpperCase() + result.slice(1);
    result = result.replace(/\s+/g, ' ').trim();
    
    return result;
  }
  
  return value;
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHORTCUTS PRATIQUES
═══════════════════════════════════════════════════════════════════════════ */

export const tCountry = (value, lang) => translateDB('country', value, lang);
export const tLevel = (value, lang) => translateDB('level', value, lang);
export const tField = (value, lang) => translateDB('field', value, lang);
export const tStatus = (value, lang) => translateDB('status', value, lang);
export const tLanguage = (value, lang) => translateDB('language', value, lang);

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITAIRES AVANCÉS
═══════════════════════════════════════════════════════════════════════════ */

/**
 * Traduit un objet complet selon un mapping de catégories
 */
export const translateObject = (obj, fieldMap, lang = DEFAULT_LANG) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (lang === DEFAULT_LANG) return { ...obj };

  const result = { ...obj };

  for (const [field, category] of Object.entries(fieldMap)) {
    const val = result[field];
    if (val && typeof val === 'string') {
      if (category === 'description') result[field] = tDescription(val, lang);
      else if (category === 'funding') result[field] = tFunding(val, lang);
      else if (category === 'document') result[field] = tDocument(val, lang);
      else result[field] = translateDB(category, val, lang);
    } else if (Array.isArray(val)) {
      result[field] = val.map(item => {
        if (typeof item === 'string') {
          if (category === 'description') return tDescription(item, lang);
          else if (category === 'funding') return tFunding(item, lang);
          else if (category === 'document') return tDocument(item, lang);
          else return translateDB(category, item, lang);
        }
        return item;
      }).filter(Boolean).join(', ');
    }
  }

  return result;
};

/**
 * Hook React pour traduction avec memoization
 */
import { useMemo } from 'react';

export const useTranslateDB = (category, value, lang) => {
  return useMemo(() => {
    if (!lang || lang === DEFAULT_LANG) return value;
    
    if (category === 'description') return tDescription(value, lang);
    if (category === 'funding') return tFunding(value, lang);
    if (category === 'document') return tDocument(value, lang);
    
    return translateDB(category, value, lang);
  }, [category, value, lang]);
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT PAR DÉFAUT
═══════════════════════════════════════════════════════════════════════════ */

export default {
  translateDB,
  tCountry, tLevel, tFunding, tField, tDocument, tStatus, tLanguage, tDescription,
  translateObject,
  useTranslateDB,
  SUPPORTED_LANGS,
  DEFAULT_LANG,
  // Dictionnaires pour extension
  COUNTRIES, EDUCATION_LEVELS, FUNDING_TYPES, FIELDS_OF_STUDY,
  DOCUMENT_TYPES, STATUS_LABELS, LANGUAGE_LEVELS,
  SCHOLARSHIP_DESCRIPTIONS,
  // Segments pour traduction partielle
  DESCRIPTION_SEGMENTS_FR_EN,
  FUNDING_SEGMENTS_FR_EN,
  DOCUMENT_SEGMENTS_FR_EN,
};
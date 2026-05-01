/**
 * ÉTAPE 1: CHARGEMENT & VALIDATION PROFIL UTILISATEUR
 * 
 * Ce module charge le profil complet de l'utilisateur depuis l'API
 * et valide que tous les champs obligatoires sont présents
 */

import axiosInstance from '@/config/axiosInstance';

// ═══════════════════════════════════════════════════════════════════════════
// 1. CHAMPS OBLIGATOIRES vs. OPTIONNELS
// ═══════════════════════════════════════════════════════════════════════════

const REQUIRED_FIELDS = {
  fr: ['name', 'email', 'pays', 'niveau', 'domaine'],
  en: ['name', 'email', 'country', 'study_level', 'field']
};

const OPTIONAL_FIELDS = [
  'experiences',
  'competences',
  'certifications',
  'langues',
  'universiteActuelle',
  'specialisation',
  'gpa',
  'anneeEtude',
  'achievements'
];

// ═══════════════════════════════════════════════════════════════════════════
// 2. CHARGER PROFIL COMPLET
// ═══════════════════════════════════════════════════════════════════════════

export async function loadUserProfile(userId, lang = 'fr') {
  if (!userId) {
    throw new Error('userId required');
  }

  try {
    console.log(`📥 Chargement profil utilisateur: ${userId}`);

    // Récupérer le profil complet avec depth=3 pour les relations
    const response = await axiosInstance.get(
      `/api/users/${userId}?depth=3`,
      { timeout: 10000 }
    );

    const user = response.data;

    // Normaliser et enrichir les données
    const normalizedProfile = normalizeUserProfile(user);

    // Valider les champs obligatoires
    const validation = validateProfile(normalizedProfile, lang);

    console.log('✅ Profil chargé:', {
      isComplete: validation.ok,
      completeness: normalizedProfile.completeness,
      missingFields: validation.missing
    });

    return {
      ...normalizedProfile,
      validation: validation,
      loadedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erreur chargement profil:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Utilisateur non trouvé');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentification requise');
    }
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. NORMALISER DONNÉES PROFIL
// ═══════════════════════════════════════════════════════════════════════════

function normalizeUserProfile(user) {
  // Données de base
  const profile = {
    // Identifiants
    id: user.id,
    name: (user.name || '').trim(),
    email: (user.email || '').toLowerCase().trim(),

    // Localisation
    pays: user.pays || user.country || '',

    // Académique
    niveau: normalizeStudyLevel(user.niveau || user.studyLevel),
    domaine: (user.domaine || user.field || '').trim(),
    specialisation: (user.specialisation || user.specialization || '').trim(),

    // Académique optionnel
    universiteActuelle: user.universiteActuelle || user.currentUniversity || '',
    gpa: parseFloat(user.gpa) || null,
    anneeEtude: parseInt(user.anneeEtude) || null,

    // Expériences
    experiences: normalizeExperiences(user.experiences || []),

    // Compétences
    competences: normalizeCompetences(user.competences || user.skills || []),

    // Certifications
    certifications: normalizeCertifications(user.certifications || []),

    // Langues
    langues: normalizeLanguages(user.langues || user.languages || []),

    // Réalisations
    achievements: user.achievements || [],

    // Métadonnées
    profilCompleteness: 0, // calculé ci-après
    updatedAt: user.updatedAt || new Date().toISOString()
  };

  // Calculer le % de complétude
  profile.profilCompleteness = calculateCompleteness(profile);

  return profile;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. NORMALISER NIVEAUX D'ÉTUDE
// ═══════════════════════════════════════════════════════════════════════════

function normalizeStudyLevel(level) {
  if (!level) return 'Master'; // par défaut

  const levelMap = {
    'licence': 'Licence',
    'bachelor': 'Licence',
    'l3': 'Licence',
    'master': 'Master',
    'master1': 'Master',
    'm1': 'Master',
    'master2': 'Master',
    'm2': 'Master',
    'doctorat': 'Doctorat',
    'doctorate': 'Doctorat',
    'phd': 'Doctorat',
    'bac+3': 'Licence',
    'bac+5': 'Master',
    'bac+8': 'Doctorat'
  };

  const normalized = level.toLowerCase().replace(/\s+/g, '');
  return levelMap[normalized] || 'Master';
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. NORMALISER EXPÉRIENCES
// ═══════════════════════════════════════════════════════════════════════════

function normalizeExperiences(experiences) {
  if (!Array.isArray(experiences)) return [];

  return experiences
    .filter(e => e && (e.titre || e.title || e.poste))
    .map(e => ({
      titre: (e.titre || e.title || e.poste || '').trim(),
      entreprise: (e.entreprise || e.company || e.organisation || '').trim(),
      lieu: (e.lieu || e.location || '').trim(),
      type: e.type || 'professionnel', // stage, cdd, cdi, etc.
      dateDebut: e.dateDebut || e.startDate,
      dateFin: e.dateFin || e.endDate,
      duree: calculateDuration(e.dateDebut, e.dateFin),
      description: (e.description || '').trim(),
      competencesUtilisees: Array.isArray(e.competencesUtilisees) 
        ? e.competencesUtilisees 
        : []
    }))
    .sort((a, b) => new Date(b.dateFin) - new Date(a.dateFin)); // plus récentes en premier
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. NORMALISER COMPÉTENCES
// ═══════════════════════════════════════════════════════════════════════════

function normalizeCompetences(competences) {
  if (!Array.isArray(competences)) return [];

  const normalized = competences
    .filter(c => c && (typeof c === 'string' || c.nom || c.name))
    .map(c => {
      if (typeof c === 'string') {
        return {
          nom: c.trim(),
          niveau: 'intermédiaire',
          categorie: categorizeSkill(c)
        };
      }

      return {
        nom: (c.nom || c.name || '').trim(),
        niveau: (c.niveau || c.level || 'intermédiaire').toLowerCase(),
        categorie: c.categorie || categorizeSkill(c.nom || c.name)
      };
    });

  // Déduplication
  const seen = new Set();
  return normalized.filter(c => {
    const key = c.nom.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. NORMALISER CERTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

function normalizeCertifications(certifications) {
  if (!Array.isArray(certifications)) return [];

  return certifications
    .filter(c => c && (c.nom || c.name))
    .map(c => ({
      nom: (c.nom || c.name || '').trim(),
      organisme: (c.organisme || c.issuer || '').trim(),
      annee: parseInt(c.annee || c.year) || new Date().getFullYear(),
      lien: c.lien || c.link || '',
      description: (c.description || '').trim()
    }))
    .sort((a, b) => b.annee - a.annee); // plus récentes en premier
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. NORMALISER LANGUES
// ═══════════════════════════════════════════════════════════════════════════

function normalizeLanguages(languages) {
  if (!Array.isArray(languages)) return [];

  const niveaux = ['débutant', 'intermédiaire', 'avancé', 'courant', 'langue maternelle'];

  return languages
    .filter(l => l && (typeof l === 'string' || l.langue || l.language))
    .map(l => {
      let langue, niveau;

      if (typeof l === 'string') {
        langue = l.trim();
        niveau = 'courant';
      } else {
        langue = (l.langue || l.language || '').trim();
        niveau = (l.niveau || l.level || 'courant').toLowerCase();
      }

      // Normaliser le niveau
      if (!niveaux.includes(niveau)) {
        if (niveau.includes('b2') || niveau.includes('c1') || niveau.includes('c2')) {
          niveau = 'avancé';
        } else if (niveau.includes('b1')) {
          niveau = 'intermédiaire';
        } else if (niveau.includes('a')) {
          niveau = 'débutant';
        }
      }

      return {
        langue: langue,
        niveau: niveau,
        cef: getNiveauCEF(niveau) // A1, A2, B1, B2, C1, C2
      };
    })
    .sort((a, b) => niveaux.indexOf(a.niveau) - niveaux.indexOf(b.niveau));
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. VALIDATIONS ET HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function validateProfile(profile, lang = 'fr') {
  const requiredFields = REQUIRED_FIELDS[lang] || REQUIRED_FIELDS.fr;
  
  const missing = [];
  const fieldValues = {
    name: profile.name,
    email: profile.email,
    pays: profile.pays,
    country: profile.pays,
    niveau: profile.niveau,
    study_level: profile.niveau,
    domaine: profile.domaine,
    field: profile.domaine
  };

  for (const field of requiredFields) {
    if (!fieldValues[field]) {
      missing.push(field);
    }
  }

  return {
    ok: missing.length === 0,
    missing: missing,
    warnings: generateWarnings(profile)
  };
}

function generateWarnings(profile) {
  const warnings = [];

  if (profile.experiences.length === 0) {
    warnings.push('Aucune expérience renseignée');
  }

  if (profile.competences.length < 3) {
    warnings.push('Peu de compétences renseignées');
  }

  if (profile.langues.length === 0) {
    warnings.push('Aucune langue renseignée');
  }

  if (!profile.gpa) {
    warnings.push('GPA non renseigné (peut affecter certaines bourses)');
  }

  return warnings;
}

function calculateCompleteness(profile) {
  const allFields = [
    ...REQUIRED_FIELDS.fr,
    ...OPTIONAL_FIELDS
  ];

  const filled = allFields.filter(field => {
    const value = profile[field];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return !!value;
  }).length;

  return Math.round((filled / allFields.length) * 100);
}

function calculateDuration(startDate, endDate) {
  if (!startDate) return 'N/A';

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const months = (end.getFullYear() - start.getFullYear()) * 12 +
                 (end.getMonth() - start.getMonth());

  if (months < 1) return 'Moins d\'un mois';
  if (months === 1) return '1 mois';
  if (months < 12) return `${months} mois`;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) return `${years} ans`;
  return `${years} ans ${remainingMonths} mois`;
}

function categorizeSkill(skillName) {
  const name = skillName.toLowerCase();

  const categories = {
    'technique': ['python', 'javascript', 'java', 'c++', 'react', 'node', 'sql', 'api', 'git', 'docker'],
    'gestion': ['management', 'leadership', 'gestion', 'management', 'projet', 'agile', 'scrum'],
    'langue': ['français', 'anglais', 'arabe', 'espagnol', 'allemand', 'chinois'],
    'soft': ['communication', 'créativité', 'collaboration', 'résolution', 'analyse', 'autonomie']
  };

  for (const [category, skills] of Object.entries(categories)) {
    if (skills.some(s => name.includes(s))) {
      return category;
    }
  }

  return 'autre';
}

function getNiveauCEF(level) {
  const mapping = {
    'débutant': 'A1-A2',
    'intermédiaire': 'B1',
    'avancé': 'B2-C1',
    'courant': 'C1',
    'langue maternelle': 'C2'
  };

  return mapping[level] || 'N/A';
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. HELPERS POUR AFFICHAGE
// ═══════════════════════════════════════════════════════════════════════════

export function getProfileCompletionStatus(profile) {
  const completeness = profile.profilCompleteness;

  if (completeness >= 80) {
    return { status: '✅ Profil complet', color: '#10b981' };
  }
  if (completeness >= 60) {
    return { status: '⚠️ Profil partiel', color: '#f59e0b' };
  }
  return { status: '❌ Profil incomplet', color: '#ef4444' };
}

export function getProfileSummary(profile) {
  return `
${profile.name} • ${profile.domaine} (${profile.niveau})
📍 ${profile.pays} | 🎓 ${profile.gpa ? `GPA: ${profile.gpa}` : 'GPA non renseigné'}
💼 ${profile.experiences.length} expérience(s) | 🛠️ ${profile.competences.length} compétence(s) | 🗣️ ${profile.langues.length} langue(s)
  `.trim();
}

export function getCompetencesByCategory(competences) {
  const grouped = {};

  competences.forEach(c => {
    if (!grouped[c.categorie]) {
      grouped[c.categorie] = [];
    }
    grouped[c.categorie].push(c);
  });

  return grouped;
}
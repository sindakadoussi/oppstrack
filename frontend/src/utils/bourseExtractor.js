/**
 * ÉTAPE 2: EXTRACTION & ANALYSE CRITÈRES BOURSE
 * 
 * Ce module charge les critères détaillés d'une bourse et les structure
 * pour créer un "profil d'exigences" utilisé dans la génération CV/LM
 */

import axiosInstance from '@/config/axiosInstance';

// ═══════════════════════════════════════════════════════════════════════════
// 1. CHARGER CRITÈRES BOURSE
// ═══════════════════════════════════════════════════════════════════════════

export async function extractBourseRequirements(roadmapId) {
  try {
    console.log('📥 Extraction critères bourse (roadmap):', roadmapId);
    
    // ✅ Récupérer le roadmap item directement
    const response = await axiosInstance.get(
      `/api/roadmap/${roadmapId}`,
      { timeout: 10000 }
    );

    const bourse = response.data;
    console.log('✅ Roadmap reçu:', bourse);

    // Normaliser les données
    const normalized = {
      id: bourse.id,
      nom: bourse.nom || 'Bourse sans nom',
      pays: bourse.pays || '',
      description: bourse.conseilGlobal || '',
      
      // Critères académiques (à extraire du texte ou par défaut)
      niveauxAcceptes: extractLevelsFromDescription(bourse.nom),
      domainesAcceptes: [],
      gpaMinimum: 0,
      languesmondatoires: [],
      
      // Financement
      financement: bourse.financement || '',
      montant: 0,
      
      // Deadlines
      dateLimite: bourse.dateLimite || null,
      jours_restants: calculateDaysRemaining(bourse.dateLimite),
      
      // Documents requis (du roadmap)
      documentsRequis: extractDocumentsFromEtapes(bourse.etapes || []),
      
      // Profil recherché
      profilRecherche: extractProfileMatch(bourse),
    };

    console.log('✅ Critères extraits:', normalized);
    return normalized;

  } catch (error) {
    console.error('❌ Erreur extraction critères:', error);
    throw new Error(`Roadmap non trouvé: ${error.message}`);
  }
}

// Helper pour extraire les documents des étapes
function extractDocumentsFromEtapes(etapes) {
  const docs = new Set();
  etapes.forEach(etape => {
    if (etape.documents && Array.isArray(etape.documents)) {
      etape.documents.forEach(doc => docs.add(doc));
    }
  });
  return Array.from(docs);
}

// Helper pour extraire les niveaux du nom/description
function extractLevelsFromDescription(text) {
  if (!text) return [];
  const text_lower = text.toLowerCase();
  const levels = [];
  if (text_lower.includes('master') || text_lower.includes('postdoctoral')) levels.push('Master');
  if (text_lower.includes('doctorat') || text_lower.includes('phd')) levels.push('Doctorat');
  return levels.length > 0 ? levels : ['Master'];
}

function calculateDaysRemaining(deadline) {
  if (!deadline) return null;
  try {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysRemaining = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  } catch {
    return null;
  }
}

function extractProfileMatch(bourse) {
  const desc = bourse.conseilGlobal || bourse.nom || '';
  return {
    valeurs: ['Excellence', 'Recherche', 'Innovation'],
    competencesClés: ['Recherche scientifique', 'Leadership académique', 'Communication'],
    motivationFocus: 'research',
    profilCandidatType: ['Chercheur', 'Scientifique'],
    styleRecommande: {
      tonalite: 'Professionnel',
      formalite: 'Formel',
      detailLevel: 'Détaillé'
    },
    motsClesCV: ['Excellence', 'Recherche', 'Innovation', 'Rigueur'],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. NORMALISER CRITÈRES BOURSE
// ═══════════════════════════════════════════════════════════════════════════

function normalizeBourseRequirements(bourse) {
  return {
    // Identifiants
    id: bourse.id,
    nom: (bourse.nom || bourse.name || '').trim(),
    description: (bourse.description || '').trim(),
    url: bourse.lienOfficiel || bourse.urlOfficial || bourse.url || '',

    // Localisation
    pays: (bourse.pays || bourse.country || '').trim(),
    ville: (bourse.ville || bourse.city || '').trim(),
    region: (bourse.region || '').trim(),

    // CRITÈRES ACADÉMIQUES
    niveauxAcceptes: normalizeStudyLevels(
      bourse.niveauxAcceptes || bourse.studyLevels || []
    ),

    domainesAcceptes: normalizeDomaines(
      bourse.domainesAcceptes || bourse.fields || []
    ),

    gpaMinimum: parseFloat(bourse.gpaMinimum || bourse.minimumGPA) || 2.0,

    languesmondatoires: normalizeLanguages(
      bourse.languesmondatoires || bourse.requiredLanguages || ['Français', 'Anglais']
    ),

    // CRITÈRES FINANCIERS
    financement: {
      couvreFrais: bourse.financeCouvreFrais === true,
      allocation: parseFloat(bourse.financeAllocMensuelle || bourse.monthlyAllowance) || 0,
      devise: bourse.devise || 'EUR',
      duree: (bourse.financeDuree || bourse.duration || '1 an').trim(),
      totalFinancement: calculateTotalFinancing(bourse)
    },

    // DATES CRITIQUES
    dateDebut: bourse.dateDebut || bourse.startDate,
    dateLimite: bourse.dateLimite || bourse.deadline,
    jours_restants: calculateDaysLeft(bourse.dateLimite || bourse.deadline),
    urgence: calculateUrgency(bourse.dateLimite || bourse.deadline),

    // DOCUMENTS DEMANDÉS
    documentsRequis: normalizeDocuments(
      bourse.documentsRequis || bourse.requiredDocuments || [
        'CV', 'Lettre de motivation', 'Diplômes', 'Relevés de notes'
      ]
    ),

    // CRITÈRES DE SÉLECTION DÉTAILLÉS
    criteresSelection: parseCritereSelection(
      bourse.criteresSelection || bourse.selectionCriteria || ''
    ),

    // RESTRICTIONS
    restrictions: extractRestrictions(bourse),

    // CONTACT
    contact: {
      email: (bourse.emailContact || bourse.contactEmail || '').trim(),
      telephone: (bourse.telephone || bourse.phone || '').trim(),
      nomContact: (bourse.nomContact || bourse.contactName || '').trim()
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. EXTRAIRE PROFIL RECHERCHÉ
// ═══════════════════════════════════════════════════════════════════════════

function extractProfileFromBourse(bourse) {
  const description = (bourse.description || '').toLowerCase();
  const nom = (bourse.nom || '').toLowerCase();
  const fullText = `${description} ${nom}`;

  return {
    // Valeurs institutionnelles
    valeurs: extractValeurs(fullText),

    // Compétences clés recherchées
    competencesClés: extractCompetencesClés(fullText),

    // Focus principal de la bourse
    motivationFocus: identifyMotivationFocus(fullText, bourse),

    // Type de candidat recherché
    profilCandidatType: identifyCandidateProfile(fullText),

    // Secteurs d'impact
    secteursImpact: extractSectorsOfImpact(fullText),

    // Mots-clés importants pour le CV/LM
    motsClesCV: extractKeywordsForCV(fullText),

    // Analyse de tonalité/style requis
    styleRecommande: analyzeRequiredStyle(fullText, bourse)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. EXTRACTION DES VALEURS
// ═══════════════════════════════════════════════════════════════════════════

function extractValeurs(text) {
  const valeurPatterns = {
    excellence: {
      pattern: /excellence|top-tier|meilleures universités|distinction|leadership académique/gi,
      valeur: 'Excellence académique'
    },
    innovation: {
      pattern: /innovation|recherche|développement|créativité|breakthrough/gi,
      valeur: 'Innovation & Recherche'
    },
    impact: {
      pattern: /impact|société|communauté|changement|transformation|sustainable|développement durable/gi,
      valeur: 'Impact social'
    },
    diversité: {
      pattern: /diversité|inclusion|égalité|underrepresented|women|minorities/gi,
      valeur: 'Diversité & Inclusion'
    },
    entrepreneurship: {
      pattern: /entrepreneurship|startup|création|business|entrepreunariat/gi,
      valeur: 'Esprit entrepreneurial'
    },
    international: {
      pattern: /international|multiculturel|global|exchange|cooperation/gi,
      valeur: 'Perspective internationale'
    }
  };

  const valeurs = [];
  const seen = new Set();

  for (const [key, { pattern, valeur }] of Object.entries(valeurPatterns)) {
    if (pattern.test(text) && !seen.has(valeur)) {
      valeurs.push(valeur);
      seen.add(valeur);
    }
  }

  return valeurs.length > 0 ? valeurs : ['Développement personnel'];
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. EXTRACTION COMPÉTENCES CLÉS
// ═══════════════════════════════════════════════════════════════════════════

function extractCompetencesClés(text) {
  const competencePatterns = [
    { regex: /leadership|leader|direction|gestion|management/gi, competence: 'Leadership' },
    { regex: /communication|presentation|oral|écrit|writing|speaking/gi, competence: 'Communication' },
    { regex: /analytical|analyse|research|problem.solving|résolution/gi, competence: 'Analyse' },
    { regex: /collaboration|teamwork|équipe|coopération|cooperation/gi, competence: 'Collaboration' },
    { regex: /créativité|creativity|innovation|original/gi, competence: 'Créativité' },
    { regex: /adaptabilité|adaptation|flexibility|flexible/gi, competence: 'Adaptabilité' },
    { regex: /technique|technical|coding|programming|développement/gi, competence: 'Compétences techniques' },
    { regex: /entrepreneurship|entreprenerial|initiative|proactive/gi, competence: 'Initiative' },
    { regex: /gestion.de.projet|project.management|gestion/gi, competence: 'Gestion de projet' }
  ];

  const competences = [];
  const seen = new Set();

  for (const { regex, competence } of competencePatterns) {
    if (regex.test(text) && !seen.has(competence)) {
      competences.push(competence);
      seen.add(competence);
    }
  }

  return competences.slice(0, 5); // Top 5
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. IDENTIFIER FOCUS PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

function identifyMotivationFocus(text, bourse) {
  // Ordre de priorité
  const focuses = [
    { type: 'research', pattern: /recherche|research|phd|doctorate/gi },
    { type: 'entrepreneurship', pattern: /entrepreneurship|startup|création|business/gi },
    { type: 'development', pattern: /développement|africa|afrique|emerging|développement.durable/gi },
    { type: 'cultural_exchange', pattern: /échange|exchange|international|intercultural/gi },
    { type: 'social_impact', pattern: /social|community|communauté|development|impact/gi },
    { type: 'professional_excellence', pattern: /excellence|professionnel|career/gi }
  ];

  for (const { type, pattern } of focuses) {
    if (pattern.test(text)) {
      return type;
    }
  }

  return 'general';
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. IDENTIFIER PROFIL CANDIDAT TYPE
// ═══════════════════════════════════════════════════════════════════════════

function identifyCandidateProfile(text) {
  const profiles = [];

  if (/femme|women|women in/gi.test(text)) profiles.push('Femmes');
  if (/african|afrique|subsaharan/gi.test(text)) profiles.push('Africains');
  if (/leader|leadership/gi.test(text)) profiles.push('Leaders');
  if (/entrepreneur/gi.test(text)) profiles.push('Entrepreneurs');
  if (/researcher|research|phd/gi.test(text)) profiles.push('Chercheurs');

  return profiles.length > 0 ? profiles : ['Tous les candidats'];
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. EXTRAIRE SECTEURS D'IMPACT
// ═══════════════════════════════════════════════════════════════════════════

function extractSectorsOfImpact(text) {
  const sectors = [
    { name: 'Santé', pattern: /santé|health|médecine|medicine/gi },
    { name: 'Environnement', pattern: /environnement|environment|climat|climate|sustainable/gi },
    { name: 'Éducation', pattern: /éducation|education|learning|école/gi },
    { name: 'Technologie', pattern: /technologie|technology|digital|ai|tech/gi },
    { name: 'Agriculture', pattern: /agriculture|farming|agronomy/gi },
    { name: 'Eau & Assainissement', pattern: /eau|water|sanitation/gi },
    { name: 'Énergie', pattern: /énergie|energy|renewable|renouvelable/gi }
  ];

  const matched = sectors
    .filter(({ pattern }) => pattern.test(text))
    .map(({ name }) => name);

  return matched.length > 0 ? matched : [];
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. EXTRAIRE MOTS-CLÉS POUR CV
// ═══════════════════════════════════════════════════════════════════════════

function extractKeywordsForCV(text) {
  const keywords = [];

  // Extraire mots en MAJUSCULES ou entre guillemets
  const majusculeRegex = /\b[A-Z]{2,}\b/g;
  const quoted = /"([^"]+)"/g;

  let match;

  while ((match = majusculeRegex.exec(text)) !== null) {
    keywords.push(match[0]);
  }

  majusculeRegex.lastIndex = 0;

  while ((match = quoted.exec(text)) !== null) {
    keywords.push(match[1]);
  }

  // Limiter et dédupliquer
  return Array.from(new Set(keywords)).slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. ANALYSER STYLE RECOMMANDÉ
// ═══════════════════════════════════════════════════════════════════════════

function analyzeRequiredStyle(text, bourse) {
  const style = {
    formalite: 'professionnel',
    tonalite: 'neutre',
    detailLevel: 'detaillé'
  };

  if (/créatif|innovative|unique|personnelité/gi.test(text)) {
    style.tonalite = 'personnel et créatif';
  }

  if (/leadership|vision|impact/gi.test(text)) {
    style.tonalite = 'ambitieux et visionnaire';
  }

  if (/entrepreneurship|risk|initiative/gi.test(text)) {
    style.tonalite = 'proactif et audacieux';
  }

  if (/detailed application|comprehensive/gi.test(text)) {
    style.detailLevel = 'très détaillé';
  }

  return style;
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. PARSERS ET HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function normalizeStudyLevels(levels) {
  if (!Array.isArray(levels)) {
    levels = typeof levels === 'string' ? [levels] : [];
  }

  const levelMap = {
    'licence': 'Licence',
    'bachelor': 'Licence',
    'l3': 'Licence',
    'master': 'Master',
    'm1': 'Master',
    'm2': 'Master',
    'doctorat': 'Doctorat',
    'phd': 'Doctorat',
    'bac+3': 'Licence',
    'bac+5': 'Master',
    'bac+8': 'Doctorat'
  };

  const normalized = new Set();

  levels.forEach(level => {
    const key = level.toLowerCase().replace(/\s+/g, '');
    if (levelMap[key]) {
      normalized.add(levelMap[key]);
    }
  });

  return Array.from(normalized).length > 0 
    ? Array.from(normalized) 
    : ['Licence', 'Master'];
}

function normalizeDomaines(domaines) {
  if (!Array.isArray(domaines)) {
    return [];
  }

  return domaines
    .filter(d => d && typeof d === 'string')
    .map(d => d.trim())
    .filter(d => d.length > 0);
}

function normalizeLanguages(languages) {
  if (!Array.isArray(languages)) {
    return ['Français', 'Anglais'];
  }

  return languages
    .filter(l => l && typeof l === 'string')
    .map(l => l.trim());
}

function normalizeDocuments(documents) {
  if (!Array.isArray(documents)) {
    return ['CV', 'Lettre de motivation'];
  }

  return documents.filter(d => d && typeof d === 'string');
}

function parseCritereSelection(text) {
  if (!text || typeof text !== 'string') return [];

  const criteres = [];

  const patterns = [
    { name: 'Excellence académique', pattern: /excellence|top|meilleures|distinction/gi },
    { name: 'GPA minimum', pattern: /gpa|moyenne|note|minimum grade/gi },
    { name: 'Expérience professionnelle', pattern: /expérience|stage|emploi|work experience/gi },
    { name: 'Leadership', pattern: /leadership|leadership|direction|leader/gi },
    { name: 'Engagement communautaire', pattern: /engagement|communauté|community|social/gi },
    { name: 'Maîtrise des langues', pattern: /langue|language|anglais|english|français|french/gi },
    { name: 'Essai/Motivation', pattern: /essai|motivation|essay|statement/gi }
  ];

  patterns.forEach(({ name, pattern }) => {
    if (pattern.test(text)) {
      criteres.push(name);
    }
  });

  return criteres;
}

function extractRestrictions(bourse) {
  const restrictions = [];

  if (bourse.paysEligibles && Array.isArray(bourse.paysEligibles)) {
    restrictions.push({
      type: 'pays',
      valeur: bourse.paysEligibles,
      description: `Réservée aux ressortissants de: ${bourse.paysEligibles.join(', ')}`
    });
  }

  if (bourse.ageMaximum) {
    restrictions.push({
      type: 'age',
      valeur: bourse.ageMaximum,
      description: `Âge maximum: ${bourse.ageMaximum} ans`
    });
  }

  if (bourse.salaireFamilialMax) {
    restrictions.push({
      type: 'revenu',
      valeur: bourse.salaireFamilialMax,
      description: `Revenu familial maximum: ${bourse.salaireFamilialMax}`
    });
  }

  return restrictions;
}

function calculateDaysLeft(deadline) {
  if (!deadline) return null;

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

function calculateUrgency(deadline) {
  const daysLeft = calculateDaysLeft(deadline);
  if (daysLeft === null) return 'N/A';
  if (daysLeft <= 7) return '🔴 URGENT';
  if (daysLeft <= 30) return '🟠 Bientôt';
  if (daysLeft <= 90) return '🟡 Attention';
  return '🟢 Temps';
}

function calculateTotalFinancing(bourse) {
  const allocation = parseFloat(bourse.financeAllocMensuelle) || 0;
  const dureeMonths = parseDurationToMonths(bourse.financeDuree || '1 an');
  return allocation * dureeMonths;
}

function parseDurationToMonths(duration) {
  if (!duration) return 12;

  const yearMatch = duration.match(/(\d+)\s*an/i);
  const monthMatch = duration.match(/(\d+)\s*mois/i);

  let months = 0;
  if (yearMatch) months += parseInt(yearMatch[1]) * 12;
  if (monthMatch) months += parseInt(monthMatch[1]);

  return months > 0 ? months : 12;
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. HELPERS POUR AFFICHAGE
// ═══════════════════════════════════════════════════════════════════════════

export function getBourseTitle(requirements) {
  return `${requirements.nom} (${requirements.pays})`;
}

export function getBourseDeadlineStatus(requirements) {
  const { jours_restants, urgence } = requirements;

  return {
    jours: jours_restants,
    urgence: urgence,
    message: formatDeadlineMessage(jours_restants)
  };
}

function formatDeadlineMessage(days) {
  if (days === null) return 'Date limite inconnue';
  if (days <= 0) return 'Deadline dépassée';
  if (days === 1) return '1 jour restant!';
  if (days <= 7) return `${days} jours restants`;
  if (days <= 30) return `${days} jours (4-5 semaines)`;
  return `${Math.ceil(days / 7)} semaines`;
}

export function getProfileMatchScore(requirements) {
  return {
    description: 'Score d\'alignement',
    formula: 'Calculé dans alignmentScore.js'
  };
}
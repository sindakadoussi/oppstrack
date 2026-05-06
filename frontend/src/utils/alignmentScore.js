/**
 * ÉTAPE 3: SCORING D'ALIGNEMENT
 * 
 * Ce module compare le profil utilisateur avec les critères de la bourse
 * et génère un score d'alignement avec des recommandations ciblées
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. CALCUL D'ALIGNEMENT GLOBAL
// ═══════════════════════════════════════════════════════════════════════════

export function calculateAlignment(userProfile, bourseRequirements) {
  console.log('📊 Calcul d\'alignement...');

  const scores = {
    niveau: scoreNiveau(userProfile, bourseRequirements),
    domaine: scoreDomaine(userProfile, bourseRequirements),
    gpa: scoreGPA(userProfile, bourseRequirements),
    langue: scoreLangue(userProfile, bourseRequirements),
    experience: scoreExperience(userProfile),
    competences: scoreCompetences(userProfile, bourseRequirements),
    engagement: scoreEngagement(userProfile)
  };

  // Score global (moyenne pondérée)
  const weights = {
    niveau: 1.0,
    domaine: 1.2,
    gpa: 0.9,
    langue: 1.1,
    experience: 1.0,
    competences: 1.1,
    engagement: 0.8
  };

  const weightedSum = Object.entries(scores).reduce(
    (sum, [key, score]) => sum + (score * (weights[key] || 1)),
    0
  );

  const totalWeight = Object.values(weights).reduce((a, b) => a + b);
  const overall = Math.round(weightedSum / totalWeight);

  return {
    overall: overall,
    scores: scores,
    weights: weights,
    forces: identifyStrengths(scores),
    faiblesses: identifyWeaknesses(scores),
    recommandations: generateRecommendations(userProfile, bourseRequirements, scores),
    detailsAnalyse: generateDetailedAnalysis(userProfile, bourseRequirements, scores)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SCORING PAR CRITÈRE
// ═══════════════════════════════════════════════════════════════════════════

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ SCORE NIVEAU D'ÉTUDE (0-100)                                             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function scoreNiveau(user, bourse) {
  // Pas de restriction
  if (!bourse.niveauxAcceptes || bourse.niveauxAcceptes.length === 0) {
    return 100;
  }

  const niveauUserMap = { 'Licence': 1, 'Master': 2, 'Doctorat': 3 };
  const userLevel = niveauUserMap[user.niveau] || 2;

  // Vérifier match exact
  if (bourse.niveauxAcceptes.includes(user.niveau)) {
    return 100;
  }

  // Vérifier si niveau accepté + / -
  const acceptedLevels = bourse.niveauxAcceptes.map(n => niveauUserMap[n] || 0);
  const minLevel = Math.min(...acceptedLevels);
  const maxLevel = Math.max(...acceptedLevels);

  if (userLevel >= minLevel && userLevel <= maxLevel) {
    return 95; // Très bon match
  }

  if (userLevel < minLevel) {
    // Niveau insuffisant
    const gap = minLevel - userLevel;
    return Math.max(40, 100 - (gap * 20));
  }

  if (userLevel > maxLevel) {
    // Niveau supérieur (usuellement bon)
    return 85;
  }

  return 50;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ SCORE DOMAINE D'ÉTUDE (0-100)                                            ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function scoreDomaine(user, bourse) {
  // Pas de restriction de domaine
  if (!bourse.domainesAcceptes || bourse.domainesAcceptes.length === 0) {
    return 100;
  }

  const userDomaine = (user.domaine || '').toLowerCase();

  // Score parfait: match exact
  if (bourse.domainesAcceptes.some(d =>
    d.toLowerCase() === userDomaine
  )) {
    return 100;
  }

  // Score très bon: domaine accepté contient le domaine utilisateur
  if (bourse.domainesAcceptes.some(d =>
    d.toLowerCase().includes(userDomaine) || userDomaine.includes(d.toLowerCase())
  )) {
    return 90;
  }

  // Score bon: match partiel avec mots-clés
  const userDomaineParts = userDomaine.split(/\s+/);
  const partialMatches = bourse.domainesAcceptes.filter(d => {
    const domaineParts = d.toLowerCase().split(/\s+/);
    return userDomaineParts.some(part =>
      domaineParts.some(dpart => dpart === part)
    );
  });

  if (partialMatches.length > 0) {
    return Math.round(70 + (partialMatches.length * 5));
  }

  // Pas de match
  return 35;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ SCORE GPA (0-100)                                                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function scoreGPA(user, bourse) {
  // Utilisateur sans GPA
  if (user.gpa === null || user.gpa === undefined) {
    return 70; // Neutre - peut compenser par d'autres critères
  }

  // Bourse sans exigence de GPA
  if (!bourse.gpaMinimum || bourse.gpaMinimum === 0) {
    return 100;
  }

  const userGPA = parseFloat(user.gpa) || 3.0;
  const requiredGPA = parseFloat(bourse.gpaMinimum);

  // Score parfait
  if (userGPA >= requiredGPA + 0.3) {
    return 100;
  }

  // Match exact
  if (userGPA >= requiredGPA) {
    return 95;
  }

  // Légèrement en dessous
  if (userGPA >= requiredGPA - 0.3) {
    return 80;
  }

  // Significativement en dessous
  const ratio = (userGPA / requiredGPA) * 100;
  return Math.max(30, Math.round(ratio));
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ SCORE LANGUES (0-100)                                                     ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function scoreLangue(user, bourse) {
  // Pas de restriction de langue
  if (!bourse.languesmondatoires || bourse.languesmondatoires.length === 0) {
    return 100;
  }

  const userLangues = (user.langues || []).map(l => l.langue.toLowerCase());

  if (userLangues.length === 0) {
    return 40; // Pas de langues renseignées - risk
  }

  const requiredLangues = bourse.languesmondatoires.map(l => l.toLowerCase());

  // Compter les correspondances
  const matched = requiredLangues.filter(rl =>
    userLangues.some(ul => ul.includes(rl) || rl.includes(ul))
  ).length;

  const matchRatio = (matched / requiredLangues.length);

  // Bonus pour niveaux avancés
  let bonus = 0;
  user.langues.forEach(userLang => {
    if (requiredLangues.some(rl => userLang.langue.toLowerCase().includes(rl))) {
      if (['avancé', 'courant', 'langue maternelle'].includes(userLang.niveau)) {
        bonus += 5;
      }
    }
  });

  return Math.min(100, Math.round(matchRatio * 100 + bonus));
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ SCORE EXPÉRIENCE (0-100)                                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function scoreExperience(user) {
  const expCount = (user.experiences || []).length;
  const certCount = (user.certifications || []).length;
  const totalExp = expCount + (certCount * 0.5); // Demi-crédit pour certs

  // Pas d'expérience
  if (totalExp === 0) {
    return 40;
  }

  // 1-2 expériences
  if (totalExp < 2) {
    return 60;
  }

  // 2-3 expériences
  if (totalExp < 3) {
    return 75;
  }

  // 3+ expériences
  if (totalExp < 5) {
    return 90;
  }

  // 5+ expériences
  return 100;
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ SCORE COMPÉTENCES (0-100)                                                ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function scoreCompetences(user, bourse) {
  const requiredComps = bourse.profilRecherche?.competencesClés || [];

  // Pas d'exigence de compétences
  if (requiredComps.length === 0) {
    return 75; // Score neutre si pas d'info
  }

  const userCompetences = (user.competences || []).map(c => c.nom.toLowerCase());

  if (userCompetences.length === 0) {
    return 30; // Pas de compétences renseignées
  }

  // Chercher les matchs
  const matched = requiredComps.filter(rc => {
    const rcLower = rc.toLowerCase();
    return userCompetences.some(uc =>
      uc.includes(rcLower) || rcLower.includes(uc)
    );
  }).length;

  const matchRatio = (matched / requiredComps.length);
  return Math.round(matchRatio * 100);
}

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║ SCORE ENGAGEMENT (0-100)                                                  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

function scoreEngagement(user) {
  let engagementScore = 0;

  // Activités extra-académiques
  if ((user.achievements || []).length > 0) {
    engagementScore += 25;
  }

  // Leadership (basé sur titres/descriptions)
  const leadershipKeywords = ['leader', 'président', 'coordinateur', 'directeur', 'head', 'chair'];
  const hasLeadership = (user.experiences || []).some(e =>
    leadershipKeywords.some(kw => e.titre.toLowerCase().includes(kw))
  );

  if (hasLeadership) {
    engagementScore += 30;
  }

  // Projet personnel/Initiative
  const projectKeywords = ['projet', 'projet personnel', 'initiative', 'startup', 'fondateur'];
  const hasProject = (user.experiences || []).some(e =>
    projectKeywords.some(kw => e.titre.toLowerCase().includes(kw)) ||
    projectKeywords.some(kw => e.description.toLowerCase().includes(kw))
  );

  if (hasProject) {
    engagementScore += 25;
  }

  // Certifications & développement
  if ((user.certifications || []).length > 2) {
    engagementScore += 20;
  }

  return Math.min(100, engagementScore || 50);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. IDENTIFICATION DES FORCES ET FAIBLESSES
// ═══════════════════════════════════════════════════════════════════════════

function identifyStrengths(scores) {
  return Object.entries(scores)
    .filter(([_, score]) => score >= 80)
    .map(([key, score]) => ({
      critere: formatCritereName(key),
      score: score,
      emoji: '✅'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function identifyWeaknesses(scores) {
  return Object.entries(scores)
    .filter(([_, score]) => score < 70)
    .map(([key, score]) => ({
      critere: formatCritereName(key),
      score: score,
      emoji: '⚠️',
      impact: calculateImpact(score)
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}

function formatCritereName(key) {
  const names = {
    'niveau': 'Niveau d\'étude',
    'domaine': 'Domaine',
    'gpa': 'GPA/Notes',
    'langue': 'Langues',
    'experience': 'Expérience',
    'competences': 'Compétences',
    'engagement': 'Engagement'
  };

  return names[key] || key;
}

function calculateImpact(score) {
  if (score < 40) return 'Critique';
  if (score < 60) return 'Significatif';
  return 'Modéré';
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. GÉNÉRATION RECOMMANDATIONS
// ═══════════════════════════════════════════════════════════════════════════

function generateRecommendations(user, bourse, scores) {
  const recommandations = [];

  // Domaine faible
  if (scores.domaine < 80) {
    recommandations.push({
      priorite: 'HAUTE',
      critere: 'Domaine',
      probleme: `Votre domaine (${user.domaine}) ne correspond pas parfaitement`,
      action: 'Mettre en avant les projets transversaux ou tangentiels',
      exemple: `Si vous êtes en Info et la bourse demande Finance, mentionnez tout projet d'analyse de données ou fintech`
    });
  }

  // GPA faible
  if (scores.gpa < 80 && user.gpa && bourse.gpaMinimum) {
    recommandations.push({
      priorite: 'HAUTE',
      critere: 'GPA',
      probleme: `Votre GPA (${user.gpa}) est inférieur au minimum requis (${bourse.gpaMinimum})`,
      action: 'Compenser en mettant l\'accent sur les réalisations concrètes',
      exemple: `Mettez en avant: projets réussis, prix, leadership, impact communautaire`
    });
  }

  // Langues insuffisantes
  if (scores.langue < 80) {
    recommandations.push({
      priorite: 'MOYENNE',
      critere: 'Langues',
      probleme: 'Vous ne maîtrisez pas toutes les langues exigées',
      action: 'Montrer que vous êtes motivé à apprendre/améliorer',
      exemple: `Mentionnez les tests TOEFL/DELF en cours, immersions passées`
    });
  }

  // Expérience insuffisante
  if (scores.experience < 70) {
    recommandations.push({
      priorite: 'MOYENNE',
      critere: 'Expérience',
      probleme: 'Vous avez peu d\'expérience professionnelle',
      action: 'Inclure les projets académiques, bénévolat, projets personnels',
      exemple: `Projets universitaires importants = expérience. Bénévolat = engagement. Création personnel = initiative`
    });
  }

  // Compétences non alignées
  if (scores.competences < 75) {
    recommandations.push({
      priorite: 'HAUTE',
      critere: 'Compétences',
      probleme: 'Vos compétences principales ne correspondent pas à celles recherchées',
      action: 'Repérer et valoriser les compétences transversales',
      exemple: `Si on demande "Leadership" et vous êtes technique, parlez de: mentoring junior, projets menés, autonomie`
    });
  }

  return recommandations.filter(r => r);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ANALYSE DÉTAILLÉE PAR CRITÈRE
// ═══════════════════════════════════════════════════════════════════════════

function generateDetailedAnalysis(user, bourse, scores) {
  return {
    niveau: {
      userValue: user.niveau,
      required: bourse.niveauxAcceptes.join(', '),
      score: scores.niveau,
      status: scores.niveau >= 90 ? '✅ Parfait' : scores.niveau >= 70 ? '⚠️ Acceptable' : '❌ Critique',
      detail: generateNiveauDetail(user, bourse)
    },
    domaine: {
      userValue: user.domaine,
      required: bourse.domainesAcceptes.join(', '),
      score: scores.domaine,
      status: scores.domaine >= 90 ? '✅ Parfait' : scores.domaine >= 70 ? '⚠️ Acceptable' : '❌ Critique',
      detail: generateDomaineDetail(user, bourse)
    },
    gpa: {
      userValue: user.gpa ? user.gpa.toFixed(2) : 'N/A',
      required: bourse.gpaMinimum ? `Min: ${bourse.gpaMinimum}` : 'Aucune exigence',
      score: scores.gpa,
      status: scores.gpa >= 90 ? '✅ Excellent' : scores.gpa >= 70 ? '⚠️ Acceptable' : '❌ En dessous',
      detail: generateGPADetail(user, bourse)
    },
    langues: {
      userLangues: user.langues.map(l => `${l.langue} (${l.niveau})`).join(', '),
      required: bourse.languesmondatoires.join(', '),
      score: scores.langue,
      status: scores.langue >= 80 ? '✅ Bon' : scores.langue >= 60 ? '⚠️ Partiel' : '❌ Insuffisant'
    },
    experience: {
      count: user.experiences.length,
      score: scores.experience,
      status: scores.experience >= 80 ? '✅ Excellent' : scores.experience >= 60 ? '⚠️ Moyen' : '❌ Limité'
    }
  };
}

function generateNiveauDetail(user, bourse) {
  const match = bourse.niveauxAcceptes.includes(user.niveau);
  if (match) {
    return `✅ Votre niveau (${user.niveau}) est directement accepté.`;
  }
  return `⚠️ Votre niveau (${user.niveau}) n'est pas spécifié. Niveaux acceptés: ${bourse.niveauxAcceptes.join(', ')}`;
}

function generateDomaineDetail(user, bourse) {
  if (bourse.domainesAcceptes.length === 0) {
    return `✅ Aucune restriction de domaine.`;
  }
  const match = bourse.domainesAcceptes.some(d => d.toLowerCase().includes(user.domaine.toLowerCase()));
  if (match) {
    return `✅ Votre domaine (${user.domaine}) est directement accepté.`;
  }
  return `⚠️ Votre domaine (${user.domaine}) peut être considéré comme adjacent aux domaines acceptés.`;
}

function generateGPADetail(user, bourse) {
  if (!user.gpa) {
    return `❓ Vous n'avez pas renseigné votre GPA. C'est un critère important.`;
  }
  if (!bourse.gpaMinimum) {
    return `✅ Aucune exigence de GPA spécifiée.`;
  }
  if (user.gpa >= bourse.gpaMinimum) {
    const excess = user.gpa - bourse.gpaMinimum;
    return `✅ Votre GPA (${user.gpa}) dépasse le minimum requis (${bourse.gpaMinimum}) de ${excess.toFixed(2)} points.`;
  }
  const gap = bourse.gpaMinimum - user.gpa;
  return `⚠️ Votre GPA (${user.gpa}) est ${gap.toFixed(2)} points en dessous du minimum (${bourse.gpaMinimum}).`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. HELPERS POUR AFFICHAGE
// ═══════════════════════════════════════════════════════════════════════════

export function getAlignmentColor(score) {
  if (score >= 85) return '#10b981'; // Vert
  if (score >= 70) return '#f59e0b'; // Amber
  if (score >= 50) return '#ef5350'; // Rouge clair
  return '#d32f2f'; // Rouge foncé
}

export function getAlignmentLabel(score) {
  if (score >= 90) return '🌟 Excellent match';
  if (score >= 80) return '✅ Bon match';
  if (score >= 70) return '⚠️ Match acceptable';
  if (score >= 50) return '❌ Match faible';
  return '🚫 Match très faible';
}

export function formatAlignmentReport(alignment) {
  return `
RAPPORT D'ALIGNEMENT
═════════════════════════════════════════════════════════════
Score Global: ${alignment.overall}% - ${getAlignmentLabel(alignment.overall)}

FORCES (${alignment.forces.length})
${alignment.forces.map(f => `  ${f.emoji} ${f.critere}: ${f.score}%`).join('\n')}

FAIBLESSES (${alignment.faiblesses.length})
${alignment.faiblesses.map(f => `  ${f.emoji} ${f.critere}: ${f.score}% (Impact: ${f.impact})`).join('\n')}

RECOMMANDATIONS CLÉS
${alignment.recommandations.map((r, i) => `
${i + 1}. [${r.priorite}] ${r.critere}
   Problème: ${r.probleme}
   Action: ${r.action}
   Exemple: ${r.exemple}
`).join('\n')}
  `.trim();
}
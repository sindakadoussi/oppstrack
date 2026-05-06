/**
 * ÉTAPE 4: CONSTRUCTION PROMPT ENRICHI
 * 
 * Construit un prompt optimisé basé sur:
 * - Profil utilisateur complet
 * - Critères de la bourse
 * - Score d'alignement
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. FONCTION PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export function buildEnrichedPrompt(type, userProfile, bourseRequirements, alignment) {
  const baseContext = buildBaseContext(userProfile, bourseRequirements, alignment);
  
  if (type === 'cv') {
    return baseContext + buildCVPrompt(userProfile, bourseRequirements, alignment);
  } else {
    return baseContext + buildMotivationLetterPrompt(userProfile, bourseRequirements, alignment);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. CONTEXTE DE BASE (partagé pour CV et Lettre)
// ═══════════════════════════════════════════════════════════════════════════

function buildBaseContext(user, bourse, alignment) {
  return `Tu es un expert en rédaction de candidatures pour bourses d'étude.
Tu génères un document pour: ${user.niveau} en ${user.domaine}
Candidature pour: ${bourse.nom} (${bourse.pays})

═══════════════════════════════════════════════════════════════════════════════
ANALYSE D'ALIGNEMENT: ${alignment.overall}%
═══════════════════════════════════════════════════════════════════════════════

FORCES DU CANDIDAT:
${alignment.forces.map(f => `✅ ${f.critere} (${f.score}%)`).join('\n')}

POINTS À AMÉLIORER:
${alignment.faiblesses.map(f => `⚠️ ${f.critere} (${f.score}%)`).join('\n')}

PROFIL RECHERCHÉ PAR LA BOURSE:
- Valeurs: ${bourse.profilRecherche?.valeurs?.join(', ') || 'N/A'}
- Compétences clés: ${bourse.profilRecherche?.competencesClés?.join(', ') || 'N/A'}
- Type de candidat: ${bourse.profilRecherche?.profilCandidatType?.join(', ') || 'N/A'}

CRITÈRES OFFICIELS:
- Niveaux acceptés: ${bourse.niveauxAcceptes?.join(', ') || 'Tous'}
- Domaines: ${bourse.domainesAcceptes?.length > 0 ? bourse.domainesAcceptes.join(', ') : 'Tous acceptés'}
- GPA minimum: ${bourse.gpaMinimum || 'Aucune exigence'}
- Langues requises: ${bourse.languesmondatoires?.join(', ') || 'N/A'}
- Documents: ${bourse.documentsRequis?.join(', ') || 'N/A'}
- Deadline: ${bourse.jours_restants || '?'} jours restants

═══════════════════════════════════════════════════════════════════════════════
PROFIL DU CANDIDAT
═══════════════════════════════════════════════════════════════════════════════

NOM: ${user.name || 'N/A'}
EMAIL: ${user.email || 'N/A'}
NATIONALITÉ: ${user.pays || 'N/A'}
NIVEAU D'ÉTUDE: ${user.niveau || 'N/A'}
DOMAINE: ${user.domaine || 'N/A'}
SPÉCIALISATION: ${user.specialisation || 'N/A'}
GPA: ${user.gpa ? user.gpa.toFixed(2) : 'Non renseigné'}
UNIVERSITÉ ACTUELLE: ${user.universiteActuelle || 'N/A'}

EXPÉRIENCES PROFESSIONNELLES (${user.experiences?.length || 0}):
${(user.experiences || []).slice(0, 5).map((e, i) => 
  `${i + 1}. ${e.titre || 'N/A'} @ ${e.entreprise || 'N/A'}
   Durée: ${e.duree || 'N/A'}
   Description: ${(e.description || 'N/A').substring(0, 150)}...`
).join('\n\n')}

COMPÉTENCES PRINCIPALES (${user.competences?.length || 0}):
${(user.competences || []).slice(0, 10).map(c => `- ${c.nom || 'N/A'} (${c.niveau || 'N/A'})`).join('\n')}

LANGUES:
${(user.langues || []).map(l => `- ${l.langue || 'N/A'}: ${l.niveau || 'N/A'}`).join('\n')}

CERTIFICATIONS & PRIX (${user.certifications?.length || 0}):
${(user.certifications || []).slice(0, 3).map(c => `- ${c.nom || 'N/A'} (${c.organisme || 'N/A'}, ${c.annee || 'N/A'})`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
DIRECTIVES DE COMPENSATION
═══════════════════════════════════════════════════════════════════════════════

Points faibles à compenser:
${alignment.faiblesses.map(f => `- ${f.critere} (${f.score}%): Mettre l'accent sur les réalisations tangibles`).join('\n')}

Recommandations:
${alignment.recommandations?.slice(0, 3).map(r => `- ${r.action}`).join('\n') || 'Maximiser les points forts'}

═══════════════════════════════════════════════════════════════════════════════
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. PROMPT SPÉCIFIQUE POUR CV
// ═══════════════════════════════════════════════════════════════════════════

function buildCVPrompt(user, bourse, alignment) {
  return `
INSTRUCTION: Génère un CV au FORMAT EUROPASS en français

STRUCTURE OBLIGATOIRE:

1. INFORMATIONS PERSONNELLES
   Prénom Nom | Email | Téléphone (optionnel) | ${user.pays}

2. PROFIL PERSONNEL (2-3 lignes max)
   ⭐ Personnalisé pour: ${bourse.nom}
   ⭐ Mettre en avant: ${alignment.forces[0]?.critere || 'vos atouts'}
   Exemple: "Étudiant en ${user.domaine} avec expertise en ${user.competences[0]?.nom || 'leadership'} 
   et passion pour ${bourse.profilRecherche?.valeurs?.[0] || 'l\'excellence'}"

3. FORMATION ACADÉMIQUE
   - Études actuelles: ${user.niveau} en ${user.domaine}
   ${user.gpa ? `- GPA: ${user.gpa.toFixed(2)}` : ''}
   ${user.certifications?.length > 0 ? `- Certifications: ${user.certifications.slice(0, 2).map(c => c.nom).join(', ')}` : ''}

4. EXPÉRIENCE PROFESSIONNELLE
   ${(user.experiences || []).slice(0, 3).map(e => 
     `- ${e.titre || 'N/A'}
   ${e.entreprise || 'N/A'}, ${e.duree || 'N/A'}
   ${e.description ? e.description.substring(0, 150) : 'N/A'}`
   ).join('\n\n')}

5. COMPÉTENCES
   Triées par pertinence pour: ${bourse.nom}
   • Compétences clés: ${bourse.profilRecherche?.competencesClés?.slice(0, 3).join(', ') || 'Leadership, Communication'}
   • Techniques: ${user.competences?.filter(c => c.categorie === 'technique').slice(0, 3).map(c => c.nom).join(', ') || 'N/A'}
   • Langues: ${user.langues?.map(l => l.langue + ' (' + l.niveau + ')').join(', ') || 'N/A'}

6. RÉALISATIONS & PRIX
   ${user.achievements?.slice(0, 3).join('\n   ') || 
     user.certifications?.length > 0 
       ? user.certifications.map(c => `- ${c.nom} (${c.annee})`).join('\n   ')
       : '- (Mentionnez tout prix, distinction académique ou leadership)'}

DIRECTIVES IMPORTANTES:
✅ Format: EUROPASS (structure claire, professionnel)
✅ Longueur: 1-2 pages maximum
✅ Langue: Français formel
✅ Dates: JJ/MM/AAAA
✅ COMPENSATION: Les points faibles (${alignment.faiblesses.map(f => f.critere.toLowerCase()).join(', ')}) 
   doivent être compensés en mettant l'accent sur les réalisations concrètes

❌ À ÉVITER:
- Pas de justification pour les déficits
- Pas de "soft skills" sans exemple concret
- Pas de clichés ("Je suis passionné par...")

MOTS-CLÉS À INCLURE SI POSSIBLE:
${bourse.profilRecherche?.motsClesCV?.slice(0, 5).join(', ') || 'Excellence, Leadership, Innovation'}
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. PROMPT SPÉCIFIQUE POUR LETTRE DE MOTIVATION
// ═══════════════════════════════════════════════════════════════════════════

function buildMotivationLetterPrompt(user, bourse, alignment) {
  return `
INSTRUCTION: Génère une LETTRE DE MOTIVATION personnalisée en français

STRUCTURE REQUISE:

1. EN-TÊTE
   [Votre nom et adresse]
   [Lieu et date]
   
   À l'attention du jury de ${bourse.nom}

2. SALUTATION
   "Madame, Monsieur,"

3. PARAGRAPHE D'OUVERTURE (2-3 lignes)
   ⭐ Mentionner EXPLICITEMENT: ${bourse.nom}
   ⭐ Indiquer votre parcours: ${user.niveau} en ${user.domaine}
   ⭐ Exprimer motivation claire
   
   Exemple: "Je suis actuellement ${user.niveau} en ${user.domaine} et je postule 
   avec enthousiasme à la bourse ${bourse.nom}..."

4. PARAGRAPHE 2: ALIGNEMENT (4-5 lignes)
   ⭐ FORCES À METTRE EN AVANT: ${alignment.forces.map(f => f.critere.toLowerCase()).join(', ')}
   ⭐ VALEURS PARTAGÉES: ${bourse.profilRecherche?.valeurs?.join(', ') || 'Excellence'}
   ⭐ COMPÉTENCES: ${bourse.profilRecherche?.competencesClés?.slice(0, 2).join(', ') || 'Leadership'}
   
   Inclure UN exemple concret:
   ${user.experiences?.[0] 
     ? `"Lors de mon expérience chez ${user.experiences[0].entreprise}, j'ai..."` 
     : '"Par exemple, dans mes projets académiques..."'}

5. PARAGRAPHE 3: AMBITIONS & IMPACT (4-5 lignes)
   ⭐ Vision pour les 5 prochaines années
   ⭐ Comment cette bourse vous aide
   ⭐ Contribution envisagée
   
   Focus: ${bourse.profilRecherche?.motivationFocus || 'Excellence académique'}

6. COMPENSATION DES FAIBLESSES (2-3 lignes si pertinent)
   Points à compenser: ${alignment.faiblesses.map(f => f.critere.toLowerCase()).join(', ')}
   
   ⚠️ NE PAS NIER - MONTRER LA VOLONTÉ DE PROGRESSER
   "Bien que mon [point faible] soit [chiffre], ma détermination et mes 
   [réalisations] démontrent ma capacité à réussir..."

7. CONCLUSION (2 lignes)
   "Je suis convaincu que cette bourse me permettra de [impact spécifique]."

8. FERMETURE
   "Cordialement,"
   [Votre nom]

DIRECTIVES STYLE:
Ton: ${bourse.profilRecherche?.styleRecommande?.tonalite || 'Professionnel'}
Formalité: ${bourse.profilRecherche?.styleRecommande?.formalite || 'Formel'}
Détail: ${bourse.profilRecherche?.styleRecommande?.detailLevel || 'Détaillé'}

✅ MUST-HAVE:
- Mention explicite de "${bourse.nom}"
- 1 exemple concret d'expérience/projet
- Vision personnelle claire
- Lien explicite entre vos atouts et critères de la bourse

❌ À ÉVITER:
- Généricités applicables à toute bourse
- "Je suis passionné par..." (cliché)
- Focus sur l'argent/financement
- Trop long (max 3/4 page)

VÉRIFICATION FINALE:
✓ Bourse mentionnée nommément?
✓ Exemple spécifique inclus?
✓ Vision future claire?
✓ Lien: Profil → Critères bourse?
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. HELPERS (optionnel)
// ═══════════════════════════════════════════════════════════════════════════

export function getPromptLength(prompt) {
  return prompt.length;
}

export function getPromptTokenEstimate(prompt) {
  // Rough estimate: ~4 chars per token
  return Math.ceil(prompt.length / 4);
}
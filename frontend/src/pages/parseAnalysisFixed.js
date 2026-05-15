// ═══════════════════════════════════════════════════════════════════════════
// ✅ PARSER FIXÉ - Reconnaît correctement les sections
// ═══════════════════════════════════════════════════════════════════════════

function parseAnalysisFixed(text) {
  if (!text) return [];
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections = [];
  let currentSection = null;

  // Pattern pour reconnaître les titres de section
  // Formats: "## TITRE", "### TITRE", "**TITRE**", "🎯 TITRE", "📋 TITRE", etc.
  const isSectionTitle = (line) => {
    return (
      /^#{2,4}\s+/.test(line) ||                    // ## ou ### ou ####
      /^\*\*[^*]{5,60}\*\*$/.test(line) ||          // **TITRE**
      /^[🎯📊✅❌⚠️📋✨🚀🛠️📝]\s+[A-Z].{3,60}$/.test(line) || // 🎯 TITRE
      (/^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ][A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\s]{4,60}$/.test(line) && line.length < 70)
    );
  };

  const getCleanTitle = (line) => {
    return line
      .replace(/^#+\s+/, '')          // Remove ##
      .replace(/^\*\*/, '')            // Remove **
      .replace(/\*\*$/, '')            // Remove **
      .replace(/^[🎯📊✅❌⚠️📋✨🚀🛠️📝]\s*/, '') // Remove emoji
      .trim();
  };

  for (const line of lines) {
    // Ignorer les séparateurs
    if (/^-{3,}$|^_{3,}$|^={3,}$/.test(line)) continue;

    // Détecter titre de section
    if (isSectionTitle(line)) {
      // Sauvegarder la section précédente
      if (currentSection && currentSection.items.length > 0) {
        sections.push(currentSection);
      }

      const cleanTitle = getCleanTitle(line);
      currentSection = {
        title: cleanTitle,
        key: classifySection(cleanTitle),
        items: [],
        score: null,
      };
    } else if (currentSection) {
      // Vérifier si c'est un score (ex: "5/10" ou "Score: 7/10")
      const scoreMatch = line.match(/(\d+)\s*\/\s*10/);
      if (scoreMatch) {
        currentSection.score = parseInt(scoreMatch[1]);
      }

      // Vérifier si c'est un bullet point
      const bulletMatch = line.match(/^[-•*✓✔️]\s+(.+)$/);
      if (bulletMatch) {
        let item = bulletMatch[1].trim();
        // Nettoyer les formatages markdown
        item = item.replace(/\*\*/g, '').trim();
        if (item && item.length > 3) {
          currentSection.items.push(item);
        }
      } else if (
        line &&
        line.length > 10 &&
        !line.startsWith('|') && // Pas une table
        !line.includes('http') && // Pas un URL
        !line.match(/^\d+\s*\|/) // Pas une ligne de tableau
      ) {
        // Texte libre → ajouter comme item
        let item = line.replace(/\*\*/g, '').trim();
        if (item && !isSectionTitle(item)) {
          currentSection.items.push(item);
        }
      }
    }
  }

  // Ajouter la dernière section
  if (currentSection && currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  // Trier dans l'ordre défini
  const order = ['score', 'strong', 'weak', 'error', 'action', 'rewrite', 'other'];
  return sections.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

function classifySection(title) {
  const t = title.toLowerCase();
  const SECTION_DEFS = [
    { key: 'score', fr: ['score', 'adéquation', 'compatibilité', 'match', 'verdict'], en: ['score', 'match', 'compatibility', 'compat'] },
    { key: 'strong', fr: ['point fort', 'atout', 'positif', 'strength', 'bon'], en: ['strength', 'strong', 'positive', 'good'] },
    { key: 'weak', fr: ['point faible', 'lacune', 'manque', 'faible', 'amélioration'], en: ['weakness', 'weak', 'gap', 'miss', 'improvement'] },
    { key: 'error', fr: ['erreur', 'problème', 'incorrection', 'corriger', 'alerte'], en: ['error', 'problem', 'issue', 'fix', 'alert'] },
    { key: 'action', fr: ['recommandation', 'conseil', 'action', 'plan', 'amélioration stratégique'], en: ['recommendation', 'action', 'plan', 'improve'] },
    { key: 'rewrite', fr: ['reformulation', 'réécriture', 'suggestion', 'améliorer'], en: ['rewrite', 'suggestion', 'improve', 'rephrase'] },
  ];

  for (const def of SECTION_DEFS) {
    if (def.fr.some(k => t.includes(k)) || def.en.some(k => t.includes(k))) {
      return def.key;
    }
  }
  return 'other';
}

export default parseAnalysisFixed;
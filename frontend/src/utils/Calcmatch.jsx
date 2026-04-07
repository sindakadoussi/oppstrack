// utils/calcMatch.js — logique partagée entre BourseCard et BourseDrawer

export const countryFlag = (pays) => {
  const flags = {
    'France':'🇫🇷','Allemagne':'🇩🇪','Royaume-Uni':'🇬🇧','États-Unis':'🇺🇸',
    'Canada':'🇨🇦','Japon':'🇯🇵','Chine':'🇨🇳','Australie':'🇦🇺',
    'Suisse':'🇨🇭','Pays-Bas':'🇳🇱','Maroc':'🇲🇦','Hongrie':'🇭🇺',
    'Corée du Sud':'🇰🇷','Nouvelle-Zélande':'🇳🇿','Turquie':'🇹🇷',
    'Belgique':'🇧🇪','Espagne':'🇪🇸','Italie':'🇮🇹','Portugal':'🇵🇹',
    'Roumanie':'🇷🇴','Arabie Saoudite':'🇸🇦','Brunei':'🇧🇳',
    'Tunisie':'🇹🇳','Algérie':'🇩🇿','Égypte':'🇪🇬',
  };
  return flags[pays] || '🌍';
};

export const calcMatch = (bourse, user) => {
  if (!bourse || !user) return null;
  let score = 0, total = 0;

  // 1. Éligibilité Tunisienne (20 pts)
  if (bourse.tunisienEligible) {
    total += 20;
    const eligible = String(bourse.tunisienEligible).toLowerCase().trim();
    const userIsTunisian =
      (user.nationality || user.pays || '').toLowerCase().includes('tunisie') ||
      (user.countryOfResidence || '').toLowerCase().includes('tunisie') ||
      (user.pays || '').toLowerCase().includes('tunisie');
    if (eligible === 'oui' || eligible === 'inconnu') score += 20;
    else if (eligible === 'non' && !userIsTunisian) score += 15;
  }

  // 2. Pays (25 pts)
  if (user.pays || user.nationality || user.countryOfResidence || user.targetCountries?.length > 0) {
    total += 25;
    const bp = String(bourse.pays || '').toLowerCase().trim();
    const userPaysList = [
      user.pays, user.nationality, user.countryOfResidence,
      ...(user.targetCountries || []).map(t => t.country),
    ].filter(Boolean).map(p => p.toLowerCase().trim());

    const isInternational =
      bp.includes('international') || bp.includes('tous pays') ||
      bp.includes('any country')   || bp.includes('monde') || bp === '';

    const matchPays = userPaysList.some(up =>
      bp === up || bp.includes(up) || up.includes(bp) || isInternational
    );
    if (matchPays) score += 25;
    else if (isInternational) score += 18;
  }

  // 3. Niveau (30 pts)
  if (user.niveau || user.currentLevel || user.targetDegree) {
    total += 30;
    const bn = String(bourse.niveau || bourse.eligibilite?.niveauRequis || '').toLowerCase();
    const userLevels = [user.niveau, user.currentLevel, user.targetDegree]
      .filter(Boolean).map(l => l.toLowerCase().trim());
    const baseLevels = userLevels.map(l => l.replace(/\s*\d+$/, '').trim());
    const allUserLevels = [...userLevels, ...baseLevels];

    const matchNiveau = allUserLevels.some(level =>
      bn.includes(level) ||
      (level.includes('master')   && bn.includes('master'))  ||
      (level.includes('licence')  && (bn.includes('licence') || bn.includes('bachelor') || bn.includes('undergraduate'))) ||
      (level.includes('doctorat') && (bn.includes('doctorat') || bn.includes('phd') || bn.includes('doctoral'))) ||
      bn.includes('tous niveaux') || bn.includes('any level')
    );
    if (matchNiveau) score += 30;
  }

  // 4. Domaine (25 pts)
  if (user.domaine || user.fieldOfStudy || user.targetFields?.length > 0) {
    total += 25;
    const bd = String(bourse.domaine || '').toLowerCase();
    const desc = String(bourse.description || '').toLowerCase();
    const conditions = String(bourse.eligibilite?.conditionsSpeciales || '').toLowerCase();
    const userDomains = [
      user.domaine, user.fieldOfStudy,
      ...(user.targetFields || []).map(f => f.field),
    ].filter(Boolean).map(d => d.toLowerCase().trim());

    let domainPoints = 0;
    for (const ud of userDomains) {
      if (bd.includes(ud) || ud.includes(bd) || desc.includes(ud) || conditions.includes(ud)) {
        domainPoints = 25; break;
      }
      const words = ud.split(/\s+/).filter(w => w.length > 3);
      if (words.some(w => bd.includes(w) || desc.includes(w) || conditions.includes(w))) {
        domainPoints = Math.max(domainPoints, 14);
      }
    }
    score += domainPoints;
  }

  // 5. Langue (10 pts bonus)
  if (bourse.langue && user.languages?.length > 0) {
    total += 10;
    const bl = String(bourse.langue).toLowerCase().trim();
    const userLangs = user.languages.map(l => String(l.language || '').toLowerCase().trim()).filter(Boolean);
    const matchLangue = userLangs.some(ul =>
      bl.includes(ul) || ul.includes(bl) ||
      (bl === 'anglais' && ul.includes('english')) ||
      (bl === 'français' && ul.includes('french'))
    );
    if (matchLangue) score += 10;
  }

  if (total === 0) return null;
  return Math.min(100, Math.round((score / total) * 100));
};

// Calcul détaillé pour le MatchDrawer
export const calcMatchDetails = (bourse, user) => {
  if (!bourse || !user) return null;

  const details = [];
  let totalScore = 0, totalMax = 0;

  // 1. Éligibilité Tunisienne
  {
    const max = 20;
    const eligible = String(bourse.tunisienEligible || '').toLowerCase().trim();
    const userIsTunisian =
      (user.nationality || '').toLowerCase().includes('tunisie') ||
      (user.pays || '').toLowerCase().includes('tunisie') ||
      (user.countryOfResidence || '').toLowerCase().includes('tunisie');
    let pts = 0;
    if (eligible === 'oui' || eligible === 'inconnu') pts = 20;
    else if (eligible === 'non' && !userIsTunisian) pts = 15;
    totalMax += max; totalScore += pts;
    details.push({
      label: 'Éligibilité tunisienne', icon: '🇹🇳', points: pts, max,
      matched: pts > 0, isBonus: true,
      userVal: userIsTunisian ? 'Tunisien(ne)' : (user.nationality || '—'),
      bourseVal: eligible === 'oui' ? 'Oui' : eligible === 'non' ? 'Non' : 'Non précisé',
      reason: pts > 0
        ? (eligible === 'oui' ? 'Bourse ouverte aux Tunisiens ✓'
           : eligible === 'inconnu' ? 'Éligibilité non précisée — score attribué par défaut'
           : 'Non tunisien(ne) + bourse fermée → points attribués quand même')
        : 'Tunisien(ne) mais bourse fermée aux Tunisiens',
    });
  }

  // 2. Pays
  {
    const max = 25;
    const bp = String(bourse.pays || '').toLowerCase().trim();
    const userPaysList = [
      user.pays, user.nationality, user.countryOfResidence,
      ...(user.targetCountries || []).map(t => t.country),
    ].filter(Boolean).map(p => p.toLowerCase().trim());

    const isInternational = bp.includes('international') || bp.includes('tous pays') || bp === '';
    const matchPays = userPaysList.some(up => bp === up || bp.includes(up) || up.includes(bp));
    let pts = 0;
    if (matchPays) pts = 25;
    else if (isInternational) pts = 18;
    totalMax += max; totalScore += pts;
    details.push({
      label: 'Pays / Destination', icon: '📍', points: pts, max,
      matched: pts > 0,
      userVal: userPaysList.join(', ') || '—',
      bourseVal: bourse.pays || 'International',
      reason: matchPays
        ? `"${userPaysList[0]}" correspond à "${bourse.pays}" ✓`
        : isInternational
          ? `Bourse internationale → ouverte à tous les pays (+${pts} pts)`
          : `Aucun de vos pays cibles ne correspond à "${bourse.pays}"`,
    });
  }

  // 3. Niveau
  {
    const max = 30;
    const bn = String(bourse.niveau || bourse.eligibilite?.niveauRequis || '').toLowerCase();
    const userLevels = [user.niveau, user.currentLevel, user.targetDegree]
      .filter(Boolean).map(l => l.toLowerCase().trim());
    const baseLevels = userLevels.map(l => l.replace(/\s*\d+$/, '').trim());
    const allUserLevels = [...new Set([...userLevels, ...baseLevels])];
    const matchNiveau = allUserLevels.some(level =>
      bn.includes(level) ||
      (level.includes('master')   && bn.includes('master'))  ||
      (level.includes('licence')  && (bn.includes('licence') || bn.includes('bachelor'))) ||
      (level.includes('doctorat') && (bn.includes('doctorat') || bn.includes('phd'))) ||
      bn.includes('tous niveaux') || bn.includes('any level')
    );
    const pts = matchNiveau ? 30 : 0;
    totalMax += max; totalScore += pts;
    details.push({
      label: "Niveau d'études", icon: '🎓', points: pts, max,
      matched: matchNiveau,
      userVal: userLevels.join(', ') || '—',
      bourseVal: bourse.niveau || '—',
      reason: matchNiveau
        ? `"${userLevels[0]}" correspond à "${bourse.niveau}" ✓`
        : `"${userLevels[0] || '?'}" ne correspond pas à "${bourse.niveau || '?'}"`,
    });
  }

  // 4. Domaine
  {
    const max = 25;
    const bd = String(bourse.domaine || '').toLowerCase();
    const desc = String(bourse.description || '').toLowerCase();
    const userDomains = [
      user.domaine, user.fieldOfStudy,
      ...(user.targetFields || []).map(f => f.field),
    ].filter(Boolean).map(d => d.toLowerCase().trim());

    let pts = 0, matchedDomain = '';
    for (const ud of userDomains) {
      if (bd.includes(ud) || ud.includes(bd) || desc.includes(ud)) { pts = 25; matchedDomain = ud; break; }
      const words = ud.split(/\s+/).filter(w => w.length > 3);
      if (words.some(w => bd.includes(w) || desc.includes(w))) {
        pts = Math.max(pts, 14); matchedDomain = ud;
      }
    }
    totalMax += max; totalScore += pts;
    details.push({
      label: "Domaine d'études", icon: '📚', points: pts, max,
      matched: pts > 0,
      userVal: userDomains.join(', ') || '—',
      bourseVal: bourse.domaine || 'Tous domaines',
      reason: pts === 25
        ? `"${matchedDomain}" correspond exactement au domaine de la bourse ✓`
        : pts === 14
          ? `Correspondance partielle avec "${matchedDomain}"`
          : `Aucun de vos domaines ne correspond à "${bourse.domaine || 'Tous domaines'}"`,
    });
  }

  // 5. Langue
  if (bourse.langue) {
    const max = 10;
    const bl = String(bourse.langue).toLowerCase();
    const userLangs = (user.languages || []).map(l => String(l.language || '').toLowerCase()).filter(Boolean);
    const matchLangue = userLangs.some(ul =>
      bl.includes(ul) || ul.includes(bl) ||
      (bl === 'anglais' && ul.includes('english')) ||
      (bl === 'français' && ul.includes('french'))
    );
    const pts = matchLangue ? 10 : 0;
    totalMax += max; totalScore += pts;
    details.push({
      label: 'Langue', icon: '🗣️', points: pts, max,
      matched: matchLangue, isBonus: true,
      userVal: userLangs.join(', ') || '—',
      bourseVal: bourse.langue,
      reason: matchLangue
        ? `Vous maîtrisez "${bl}" ✓`
        : `Langue requise "${bl}" non trouvée dans votre profil`,
    });
  }

  const pct = totalMax > 0 ? Math.min(100, Math.round((totalScore / totalMax) * 100)) : 0;
  return { score: totalScore, total: totalMax, pct, details };
};

export const getScoreColor = (score) => {
  if (score === null) return '#64748b';
  if (score >= 85) return '#16a34a';
  if (score >= 65) return '#eab308';
  if (score >= 45) return '#f97316';
  return '#ef4444';
};

export const getScoreLabel = (score) => {
  if (score === null) return null;
  if (score >= 85) return 'Excellent match';
  if (score >= 65) return 'Très bon match';
  if (score >= 45) return 'Match correct';
  return 'Match partiel';
};
const FONT = `font-family: 'Segoe UI', Arial, Helvetica, sans-serif;`;

// ═══════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════════════

// Supprime ** et * partout
function cleanMd(text) {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim();
}

// Parse les langues depuis le tableau markdown
// | **Arabe** | Natif | - |  =>  { lang:'Arabe', level:'Natif', cert:'-' }
function parseLanguageTable(entries) {
  const rows = [];
  for (const e of entries) {
    for (const b of e.bullets) {
      const clean = b.replace(/\*\*/g, '').trim();
      // Ignore les lignes header et séparateur
      if (/^langue|^-{3,}|^\|?-+\|/.test(clean.toLowerCase())) continue;
      // Parse  | Langue | Niveau | Cert |
      const parts = clean.split('|').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2 && parts[0].length > 1) {
        rows.push({ lang: parts[0], level: parts[1] || '', cert: parts[2] || '' });
      }
    }
  }
  return rows;
}

// Parse les compétences clés : "**Recherche** | détail"  => ["Recherche — détail"]
function parseCompetences(entries) {
  const items = [];
  for (const e of entries) {
    if (e.title) {
      const clean = cleanMd(e.title);
      if (clean && clean.length > 2) items.push(clean);
    }
    for (const b of e.bullets) {
      const clean = cleanMd(b);
      if (!clean || clean.length < 3) continue;
      // Transforme "Recherche scientifique | Méthodologie" en deux items
      const parts = clean.split('|').map(s => s.trim()).filter(Boolean);
      items.push(...parts);
    }
  }
  return items;
}

// ═══════════════════════════════════════════════════════════════════════════
// PARSER CV
// ═══════════════════════════════════════════════════════════════════════════
function parseCVText(text) {
  if (!text) return { name: '', title: '', coords: [], sections: [] };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = { name: '', title: '', coords: [], sections: [] };
  let i = 0;

  // Saute les séparateurs du début
  while (i < lines.length && /^#+\s|^-{3,}$|^\*/.test(lines[i])) i++;

  // Nom
  if (i < lines.length && lines[i].length < 100 && !lines[i].includes('@')) {
    result.name = cleanMd(lines[i]);
    i++;
  }

  while (i < lines.length && /^#+\s|^-{3,}$/.test(lines[i])) i++;

  // Titre
  if (i < lines.length && lines[i].length < 120 && !lines[i].includes('@') && !lines[i].includes('+')) {
    result.title = cleanMd(lines[i]);
    i++;
  }

  // Coordonnées
  const coordLines = [];
  for (let j = 0; j < lines.length; j++) {
    const line = lines[j];
    if ((line.includes('@') || line.includes('+') || line.toLowerCase().includes('tunisie') || line.toLowerCase().includes('résidence') || line.toLowerCase().includes('nationalité')) && !line.startsWith('#')) {
      coordLines.push(line);
    }
  }
  if (coordLines.length > 0) {
    result.coords = coordLines
      .flatMap(line => line.split('|').map(c => c.trim()))
      .map(c => cleanMd(c).replace(/^(nationalité|résidence|téléphone|email|phone)\s*:\s*/i, '').trim())
      .filter(c => c.length > 2)
      .slice(0, 8);
  }

  // Sections
  let currentSection = null;
  let currentEntry = null;

  for (const line of lines) {
    const isH2 = /^##\s+[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ]/.test(line);
    const isH3 = /^###\s+/.test(line);

    if (isH2) {
      if (currentSection) result.sections.push(currentSection);
      currentSection = { title: cleanMd(line.replace(/^#+\s+/, '')), entries: [] };
      currentEntry = null;
    } else if (isH3 && currentSection) {
      currentEntry = { date: '', title: cleanMd(line.replace(/^#+\s+/, '')), bullets: [] };
      currentSection.entries.push(currentEntry);
    } else if (currentSection) {
      const isDate = /^\d{2}\/\d{4}|^\d{4}\s*[-–]|^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|\*janvier|\*février|\*mars|\*avril|\*mai|\*juin|\*juillet|\*août|\*septembre|\*octobre|\*novembre|\*décembre)/i.test(line);
      const isBullet = /^[-•*]\s/.test(line);
      const isTableRow = line.includes('|');
      const isTitle = /^\*\*[^*]+\*\*/.test(line) || (/^[A-ZÀ-Ü][^:]*$/.test(line) && line.length < 100 && !isDate && !isBullet);

      if (isDate) {
        currentEntry = { date: cleanMd(line), title: '', bullets: [] };
        currentSection.entries.push(currentEntry);
      } else if (isTitle && !isBullet && !isTableRow) {
        if (!currentEntry) { currentEntry = { date: '', title: '', bullets: [] }; currentSection.entries.push(currentEntry); }
        currentEntry.title = cleanMd(line);
      } else if (isBullet || isTableRow) {
        if (!currentEntry) { currentEntry = { date: '', title: '', bullets: [] }; currentSection.entries.push(currentEntry); }
        currentEntry.bullets.push(line.replace(/^[-•*]\s*/, '').trim());
      } else if (line.length > 5) {
        if (!currentEntry) { currentEntry = { date: '', title: '', bullets: [] }; currentSection.entries.push(currentEntry); }
        currentEntry.bullets.push(cleanMd(line));
      }
    }
  }
  if (currentSection) result.sections.push(currentSection);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD CV HTML — 2 colonnes professionnel
// ═══════════════════════════════════════════════════════════════════════════
function buildEuropassHTML(text, lang = 'fr') {
  const cv = parseCVText(text);

  const ACCENT  = '#1B3A6B';
  const ACCENT2 = '#2E5FA3';
  const SIDEBAR_BG = '#F0F4FA';
  const LINE    = '#D6E0F0';

  // Icône coordonnée
  const getIcon = c => {
    const l = c.toLowerCase();
    if (l.includes('@')) return '✉';
    if (l.includes('+') || l.match(/\d{8,}/)) return '☎';
    if (l.includes('linkedin')) return '🔗';
    if (l.includes('github')) return '⌨';
    if (l.includes('http') || l.includes('www')) return '🌐';
    return '📍';
  };

  // Sections sidebar vs main
  const SIDEBAR_KW = ['compétence', 'skill', 'langue', 'language', 'outil', 'tool',
    'logiciel', 'software', 'intérêt', 'interest', 'loisir', 'hobby',
    'certification', 'prix', 'award', 'informatique'];

  const sidebarSecs = [];
  const mainSecs = [];

  for (const sec of cv.sections) {
    const t = sec.title.toLowerCase();
    // La section "titre / candidature" doit être ignorée (c'est le doublon)
    if (t.includes('candidate') || t.includes('candidat') || t.match(/^(doctorat|phd)/)) continue;
    if (SIDEBAR_KW.some(k => t.includes(k))) sidebarSecs.push(sec);
    else mainSecs.push(sec);
  }

  // ── Render sidebar section ──────────────────────────────────
  const renderSidebarSection = (sec) => {
    const t = sec.title.toLowerCase();

    // LANGUES → cartes visuelles
    if (t.includes('langue') || t.includes('language')) {
      const rows = parseLanguageTable(sec.entries);
      if (rows.length === 0) return '';
      return `
        <div style="margin-bottom:22px">
          <div style="font-size:7.5pt;font-weight:800;color:${ACCENT};text-transform:uppercase;
            letter-spacing:1.2px;border-bottom:2px solid ${ACCENT};padding-bottom:4px;margin-bottom:10px">
            ${sec.title}
          </div>
          ${rows.map(r => `
            <div style="margin-bottom:8px;padding:6px 8px;background:white;border-radius:6px;
              border-left:3px solid ${ACCENT2};">
              <div style="font-size:9pt;font-weight:700;color:${ACCENT}">${r.lang}</div>
              <div style="font-size:8pt;color:#555;margin-top:2px">${r.level}${r.cert && r.cert !== '-' ? ' · ' + r.cert : ''}</div>
            </div>
          `).join('')}
        </div>`;
    }

    // COMPÉTENCES → pills/tags
    if (t.includes('compétence') || t.includes('skill')) {
      const items = parseCompetences(sec.entries);
      if (items.length === 0) return '';
      return `
        <div style="margin-bottom:22px">
          <div style="font-size:7.5pt;font-weight:800;color:${ACCENT};text-transform:uppercase;
            letter-spacing:1.2px;border-bottom:2px solid ${ACCENT};padding-bottom:4px;margin-bottom:10px">
            ${sec.title}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:5px">
            ${items.map(item => `
              <span style="font-size:8pt;padding:3px 8px;background:white;border:1px solid ${LINE};
                border-radius:4px;color:#2a2a2a;line-height:1.4">${item}</span>
            `).join('')}
          </div>
        </div>`;
    }

    // Sections génériques sidebar
    const items = sec.entries.flatMap(e => [
      ...(e.title ? [cleanMd(e.title)] : []),
      ...e.bullets.map(b => cleanMd(b)),
    ]).filter(Boolean);

    if (items.length === 0) return '';
    return `
      <div style="margin-bottom:22px">
        <div style="font-size:7.5pt;font-weight:800;color:${ACCENT};text-transform:uppercase;
          letter-spacing:1.2px;border-bottom:2px solid ${ACCENT};padding-bottom:4px;margin-bottom:10px">
          ${sec.title}
        </div>
        ${items.map(item => `
          <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:6px">
            <span style="color:${ACCENT2};font-weight:700;font-size:9pt;flex-shrink:0;margin-top:1px">›</span>
            <span style="font-size:9pt;color:#2a2a2a;line-height:1.5">${item}</span>
          </div>`).join('')}
      </div>`;
  };

  // ── Render main section ─────────────────────────────────────
  const renderMainSection = (sec) => {
    const entries = sec.entries.filter(e => e.date || e.title || e.bullets.length > 0);
    if (entries.length === 0) return '';

    const entriesHTML = entries.map(e => `
      <div style="display:grid;grid-template-columns:82px 1fr;gap:0 14px;
        margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid ${LINE}">
        <div style="font-size:7.5pt;color:#666;font-weight:600;padding-top:2px;
          text-align:right;line-height:1.5">${cleanMd(e.date)}</div>
        <div>
          ${e.title ? `<div style="font-size:10pt;font-weight:700;color:#1a1a1a;
            margin-bottom:4px;line-height:1.4">${cleanMd(e.title)}</div>` : ''}
          ${e.bullets.length ? `
            <ul style="margin:0;padding-left:15px">
              ${e.bullets.map(b => `
                <li style="font-size:9pt;color:#3a3a3a;margin-bottom:3px;line-height:1.6">
                  ${cleanMd(b)}
                </li>`).join('')}
            </ul>` : ''}
        </div>
      </div>`).join('');

    return `
      <div style="margin-bottom:20px;page-break-inside:avoid">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="width:4px;height:18px;background:${ACCENT2};border-radius:2px;flex-shrink:0"></div>
          <span style="font-size:10.5pt;font-weight:800;color:${ACCENT};
            text-transform:uppercase;letter-spacing:.8px">${sec.title}</span>
        </div>
        ${entriesHTML}
      </div>`;
  };

  // Avatar initiales
  const initials = cv.name.split(' ').filter(Boolean).slice(0,2).map(w => w[0]?.toUpperCase()||'').join('');

  return `<!DOCTYPE html>
<html lang="${lang === 'anglais' ? 'en' : 'fr'}">
<head>
<meta charset="UTF-8">
<title>${cv.name} — CV</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    background: #e8ecf0;
    padding: 24px 0;
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cv-wrap {
    width: 210mm;
    min-height: 297mm;
    margin: auto;
    background: white;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  }
  .cv-header {
    background: ${ACCENT};
    padding: 26px 28px 22px;
    display: flex;
    align-items: center;
    gap: 18px;
    color: white;
  }
  .cv-avatar {
    width: 60px; height: 60px;
    border-radius: 50%;
    background: ${ACCENT2};
    border: 3px solid rgba(255,255,255,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 20pt; font-weight: 800; color: white;
    flex-shrink: 0;
  }
  .cv-name { font-size: 20pt; font-weight: 700; letter-spacing: -0.3px; line-height:1.1; margin-bottom:4px; }
  .cv-title-line { font-size: 10.5pt; opacity:0.85; font-style:italic; margin-bottom:10px; }
  .cv-coords { display:flex; flex-wrap:wrap; gap:5px 14px; }
  .cv-coord { font-size:8.5pt; opacity:0.9; display:flex; align-items:center; gap:5px; }
  .cv-body {
    display: grid;
    grid-template-columns: 180px 1fr;
  }
  .cv-sidebar {
    background: ${SIDEBAR_BG};
    padding: 20px 16px;
    border-right: 1px solid ${LINE};
    /* Permet au sidebar de s'étendre sur plusieurs pages */
  }
  .cv-main {
    padding: 20px 24px;
  }
  ul { list-style: disc; }
  @media print {
    body { background: white; padding: 0; }
    .cv-wrap { box-shadow: none; margin: 0; width: 100%; }
    .cv-body { display: grid; grid-template-columns: 180px 1fr; }
    /* Fix : évite que le contenu coupe en haut de page 2 */
    .cv-main > div { page-break-inside: avoid; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>
<div class="cv-wrap">

  <div class="cv-header">
    <div class="cv-avatar">${initials || '?'}</div>
    <div style="flex:1">
      <div class="cv-name">${cv.name || 'Nom Prénom'}</div>
      ${cv.title ? `<div class="cv-title-line">${cv.title}</div>` : ''}
      <div class="cv-coords">
        ${cv.coords.map(c => `
          <div class="cv-coord">
            <span>${getIcon(c)}</span>
            <span>${c}</span>
          </div>`).join('')}
      </div>
    </div>
  </div>

  <div class="cv-body">
    <div class="cv-sidebar">
      ${sidebarSecs.map(renderSidebarSection).join('')}
    </div>
    <div class="cv-main">
      ${mainSecs.map(renderMainSection).join('')}
    </div>
  </div>

</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD LETTRE HTML — avec coords étudiant
// ═══════════════════════════════════════════════════════════════════════════
function buildLMHTML(text, lang = 'fr') {
  const accent = '#1B3A6B';

  // Supprime ** et *
  const clean = (s) => s ? s.replace(/\*\*/g, '').replace(/\*/g, '').trim() : '';

  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !/^#+\s|^-{3,}$/.test(l));

  // Chercher infos expéditeur (nom, email, téléphone) dans les premières lignes
  const senderInfos = { name: '', email: '', phone: '', address: '' };
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const l = clean(lines[i]);
    if (l.includes('@') && !senderInfos.email) senderInfos.email = l;
    else if ((l.includes('+') || /\d{8,}/.test(l)) && !senderInfos.phone) senderInfos.phone = l;
    else if ((l.toLowerCase().includes('tunisie') || l.toLowerCase().includes('mahdia')) && !senderInfos.address) senderInfos.address = l;
    else if (!senderInfos.name && l.length < 60 && !l.includes('|') && i < 4) senderInfos.name = l;
  }

  // Parser les lignes courantes
  const objIdx  = lines.findIndex(l => /^(objet|subject)\s*:/i.test(clean(l)));
  const senderEnd = objIdx > 0 ? Math.min(objIdx, 6) : 4;
  const senderLines = lines.slice(0, senderEnd).filter(Boolean).map(clean);
  const subjectLine = objIdx >= 0 ? clean(lines[objIdx]) : '';
  const bodyLines = lines.slice(objIdx >= 0 ? objIdx + 1 : senderEnd).map(clean);

  const salutIdx = bodyLines.findIndex(l => /^(madame|monsieur|dear|à qui|a qui)/i.test(l));
  const sigIdx   = bodyLines.findLastIndex(l => /^(cordialement|sincèrement|sincerely|veuillez|je vous prie|yours)/i.test(l));

  const salutation   = salutIdx >= 0 ? bodyLines[salutIdx] : '';
  const bodyContent  = bodyLines.slice(salutIdx >= 0 ? salutIdx+1 : 0, sigIdx >= 0 ? sigIdx : undefined);
  const sigLines     = sigIdx >= 0 ? bodyLines.slice(sigIdx) : [];

  const paragraphs = [];
  let cur = [];
  for (const l of bodyContent) {
    if (!l) { if (cur.length) { paragraphs.push(cur.join(' ')); cur = []; } }
    else cur.push(l);
  }
  if (cur.length) paragraphs.push(cur.join(' '));

  // Coord expéditeur formatées
  const coordItems = [
    senderInfos.phone && `<span>☎ ${senderInfos.phone}</span>`,
    senderInfos.email && `<span>✉ ${senderInfos.email}</span>`,
    senderInfos.address && `<span>📍 ${senderInfos.address}</span>`,
  ].filter(Boolean).join('<span style="color:#bbb;margin:0 8px">|</span>');

  return `<!DOCTYPE html>
<html lang="${lang === 'anglais' ? 'en' : 'fr'}">
<head>
<meta charset="UTF-8">
<title>Lettre de motivation</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    background: #e8ecf0;
    padding: 24px 0;
    -webkit-print-color-adjust: exact;
  }
  .lm-page {
    width: 210mm;
    min-height: 297mm;
    margin: auto;
    background: white;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    display: flex;
    flex-direction: column;
  }
  /* Bande header */
  .lm-header {
    background: ${accent};
    padding: 20px 28px;
    color: white;
  }
  .lm-sender-name {
    font-size: 16pt;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .lm-coords {
    font-size: 9pt;
    opacity: 0.88;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 0;
    align-items: center;
  }
  /* Corps */
  .lm-body {
    padding: 28px 32px;
    flex: 1;
    color: #1a1a1a;
    line-height: 1.85;
  }
  p { margin-bottom: 14px; text-align: justify; font-size: 10.5pt; }
  .lm-subject {
    text-align: center;
    font-size: 11pt;
    font-weight: 700;
    color: ${accent};
    margin: 0 0 22px;
    padding: 10px;
    background: #F0F4FA;
    border-left: 4px solid ${accent};
    border-radius: 4px;
  }
  .lm-salut {
    font-size: 10.5pt;
    font-weight: 600;
    margin-bottom: 18px;
    color: #1a1a1a;
  }
  .lm-sig {
    margin-top: 28px;
    font-size: 10pt;
    line-height: 1.8;
  }
  @media print {
    body { background: white; padding: 0; }
    .lm-page { box-shadow: none; margin: 0; width: 100%; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>
<div class="lm-page">

  <div class="lm-header">
    <div class="lm-sender-name">${senderLines[0] || ''}</div>
    ${coordItems ? `<div class="lm-coords">${coordItems}</div>` : ''}
  </div>

  <div class="lm-body">
    ${subjectLine ? `<div class="lm-subject">${subjectLine}</div>` : ''}
    ${salutation ? `<div class="lm-salut">${salutation}</div>` : ''}

    ${paragraphs.map(p => `<p>${p}</p>`).join('')}

    ${sigLines.length ? `
      <div class="lm-sig">
        ${sigLines.map(l => `<div>${l}</div>`).join('')}
      </div>` : ''}
  </div>

</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOAD LIBRARIES + GENERATE PDF
// ═══════════════════════════════════════════════════════════════════════════
async function loadLibraries() {
  return new Promise((resolve, reject) => {
    let loaded = 0;
    const checkLoad = () => { loaded++; if (loaded === 2) resolve(); };
    if (!window.html2canvas) {
      const s1 = document.createElement('script');
      s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s1.onload = checkLoad; s1.onerror = reject;
      document.head.appendChild(s1);
    } else { checkLoad(); }
    if (!window.jsPDF) {
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s2.onload = checkLoad; s2.onerror = reject;
      document.head.appendChild(s2);
    } else { checkLoad(); }
  });
}

async function generateAndDownloadPDF(htmlContent, filename) {
  try {
    await loadLibraries();
    const { jsPDF } = window.jspdf;
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.cssText = `position:fixed;left:-9999px;top:0;width:210mm;background:white;overflow:hidden;`;
    document.body.appendChild(container);
    await new Promise(r => setTimeout(r, 1200));
    const canvas = await window.html2canvas(container, {
      scale: 3, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff', windowHeight: container.scrollHeight,
    });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
    while (heightLeft > 0) {
      // ← Fix page 2 : on commence exactement là où la page s'arrête
      position = -(imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    pdf.save(filename);
    document.body.removeChild(container);
  } catch (e) {
    console.error('❌ Erreur PDF:', e);
    alert('Erreur PDF: ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════
export function buildPreviewHTML(text, docType, lang = 'fr') {
  return docType === 'cv' ? buildEuropassHTML(text, lang) : buildLMHTML(text, lang);
}

export async function downloadCVPDF(text, filename = 'CV_OppsTrack.pdf', lang = 'fr') {
  const html = buildEuropassHTML(text, lang);
  await generateAndDownloadPDF(html, filename);
}

export async function downloadLMPDF(text, filename = 'LM_OppsTrack.pdf', lang = 'fr') {
  const html = buildLMHTML(text, lang);
  await generateAndDownloadPDF(html, filename);
}
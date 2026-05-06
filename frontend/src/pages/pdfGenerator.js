// ═══════════════════════════════════════════════════════════════════════════
//  PDF GENERATOR — window.open + window.print()
//  Même technique que le vrai Europass
// ═══════════════════════════════════════════════════════════════════════════

// ─── Police embarquée (pas de Google Fonts) ──────────────────
const FONT = `font-family: 'Segoe UI', Arial, Helvetica, sans-serif;`;

// ─── Parse le texte brut en sections ─────────────────────────
function parseCVText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = { name: '', title: '', coords: [], sections: [] };
  let i = 0;

  if (lines[0]) { result.name = lines[0]; i++; }
  if (lines[1] && !lines[1].includes('@') && !lines[1].includes('+') && !lines[1].includes('|') && lines[1].length < 100) {
    result.title = lines[1]; i++;
  }

  const coordLine = lines.find(l => (l.includes('@') || l.includes('+')) && l.includes('|'));
  if (coordLine) result.coords = coordLine.split('|').map(c => c.trim()).filter(Boolean);

  const isSectionTitle = l =>
    /^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ][A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\s\/&\-]{3,}$/.test(l) &&
    !l.startsWith('-') && l.length < 70;

  let cur = null;
  for (const line of lines.slice(i)) {
    if (line === coordLine || /^-{5,}$/.test(line)) continue;
    if (isSectionTitle(line)) {
      if (cur) result.sections.push(cur);
      cur = { title: line, entries: [] };
    } else if (cur) {
      const last = cur.entries[cur.entries.length - 1];
      const isDate = /^\d{2}\/\d{4}|^\d{4}\s*[-–]/.test(line);
      const isBullet = line.startsWith('-') || line.startsWith('•');
      const isSubTitle = !isDate && !isBullet && line.length < 90 && (!last || last.title);

      if (isDate) {
        cur.entries.push({ date: line, title: '', bullets: [] });
      } else if (isBullet) {
        if (!last) cur.entries.push({ date: '', title: '', bullets: [] });
        cur.entries[cur.entries.length - 1].bullets.push(line.replace(/^[-•]\s*/, ''));
      } else if (isSubTitle && !last?.title) {
        if (!last) cur.entries.push({ date: '', title: '', bullets: [] });
        cur.entries[cur.entries.length - 1].title = line;
      } else {
        if (!last) cur.entries.push({ date: '', title: '', bullets: [] });
        cur.entries[cur.entries.length - 1].bullets.push(line);
      }
    }
  }
  if (cur) result.sections.push(cur);
  return result;
}

// ─── HTML Europass ────────────────────────────────────────────
function buildEuropassHTML(text, lang = 'fr') {
  const cv = parseCVText(text);
  const accent = '#003399';

  const coordsHTML = cv.coords.map((c, i) => {
    const isEmail = c.includes('@');
    const isLinkedIn = c.toLowerCase().includes('linkedin') || c.startsWith('www.');
    const isPhone = /\+\d|^\d{2,}/.test(c.replace(/\s/g, ''));
    let icon = isEmail ? '✉' : isPhone ? '✆' : isLinkedIn ? '⛓' : '📍';
    const sep = i < cv.coords.length - 1 ? '<span style="color:#bbb;margin:0 6px">|</span>' : '';
    return `<span>${icon} ${c}</span>${sep}`;
  }).join('');

  const sectionsHTML = cv.sections.map(sec => {
    const entriesHTML = sec.entries.map(e => `
      <div style="margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid #f0f0f0">
        ${e.date ? `<div style="font-size:8pt;color:#888;margin-bottom:1px">${e.date}</div>` : ''}
        ${e.title ? `<div style="font-size:9.5pt;font-weight:700;color:#1a1a1a;margin-bottom:3px">${e.title}</div>` : ''}
        ${e.bullets.length ? `<ul style="margin:3px 0 0 16px;padding:0">${e.bullets.map(b => `<li style="font-size:9pt;color:#333;margin-bottom:2px;line-height:1.5">${b}</li>`).join('')}</ul>` : ''}
      </div>`).join('');

    return `
      <div style="margin-bottom:14px;page-break-inside:avoid">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:2px">
          <span style="color:${accent};font-size:8pt">●</span>
          <span style="font-size:10pt;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:.4px">${sec.title}</span>
        </div>
        <div style="height:1.5px;background:${accent};opacity:.2;margin-bottom:7px"></div>
        <div style="padding-left:2px">${entriesHTML}</div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="${lang === 'anglais' ? 'en' : 'fr'}">
<head>
<meta charset="UTF-8">
<title>${cv.name} — CV</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { ${FONT} font-size:9.5pt; color:#1a1a1a; background:white; padding:16mm 18mm; line-height:1.5; }
  ul li { list-style: disc; }
  @media print {
    body { padding: 0; margin: 0; }
    @page { margin: 16mm 18mm; size: A4; }
  }
</style>
</head>
<body>
  <!-- Logo Europass -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
    <div style="background:${accent};border-radius:4px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;color:#FFD700;font-size:22px;font-weight:900;flex-shrink:0">★</div>
    <span style="font-size:24pt;font-weight:300;color:${accent};letter-spacing:3px">europass</span>
  </div>

  <!-- Nom -->
  <div style="font-size:20pt;font-weight:700;color:#1a1a1a;margin-bottom:2px">${cv.name}</div>
  ${cv.title ? `<div style="font-size:10pt;color:#555;font-style:italic;margin-bottom:8px">${cv.title}</div>` : ''}

  <!-- Coordonnées -->
  <div style="border-top:1px solid #ddd;border-bottom:1px solid #ddd;padding:6px 0;margin-bottom:18px;font-size:8.5pt;color:#333;line-height:2">
    ${coordsHTML}
  </div>

  <!-- Sections -->
  ${sectionsHTML}
</body>
</html>`;
}

// ─── HTML Lettre de motivation ────────────────────────────────
function buildLMHTML(text, lang = 'fr') {
  const accent = '#003399';
  const lines = text.split('\n').map(l => l.trim());

  const objIdx = lines.findIndex(l => /^(objet|subject)\s*:/i.test(l));
  const senderLines = lines.slice(0, objIdx > 0 ? Math.min(objIdx, 5) : 3).filter(Boolean);
  const subjectLine = objIdx >= 0 ? lines[objIdx] : '';

  const bodyLines = lines.slice(objIdx >= 0 ? objIdx + 1 : 3);
  const salutIdx = bodyLines.findIndex(l => /^(madame|monsieur|dear|à qui|a qui)/i.test(l));
  const sigIdx = bodyLines.findIndex(l => /^(cordialement|sincèrement|sincerely|veuillez|je vous prie|yours)/i.test(l));

  const salutation = salutIdx >= 0 ? bodyLines[salutIdx] : '';
  const bodyContent = bodyLines.slice(salutIdx >= 0 ? salutIdx + 1 : 0, sigIdx >= 0 ? sigIdx : undefined);
  const sigLines = sigIdx >= 0 ? bodyLines.slice(sigIdx) : [];

  const paragraphs = [];
  let cur = [];
  for (const l of bodyContent) {
    if (!l) { if (cur.length) { paragraphs.push(cur.join(' ')); cur = []; } }
    else cur.push(l);
  }
  if (cur.length) paragraphs.push(cur.join(' '));

  return `<!DOCTYPE html>
<html lang="${lang === 'anglais' ? 'en' : 'fr'}">
<head>
<meta charset="UTF-8">
<title>Lettre de motivation</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { ${FONT} font-size:10.5pt; color:#1a1a1a; background:white; padding:20mm 22mm; line-height:1.75; }
  p { margin-bottom:14px; text-align:justify; }
  @media print {
    body { padding:0; margin:0; }
    @page { margin:20mm 22mm; size:A4; }
  }
</style>
</head>
<body>
  <!-- Barre bleue top + expéditeur -->
  <div style="border-top:3px solid ${accent};padding-top:10px;margin-bottom:20px">
    <div style="font-size:10.5pt;color:#1a1a1a;line-height:1.7">
      ${senderLines.map((l, i) => i === 0 ? `<strong>${l}</strong>` : l).join('<br>')}
    </div>
  </div>

  <!-- Objet -->
  ${subjectLine ? `<div style="text-align:center;font-size:11.5pt;font-weight:700;color:${accent};margin:20px 0;text-decoration:underline;text-underline-offset:4px">${subjectLine}</div>` : ''}

  <!-- Formule d'appel -->
  ${salutation ? `<p style="margin-bottom:16px">${salutation}</p>` : ''}

  <!-- Corps -->
  ${paragraphs.map(p => `<p>${p}</p>`).join('')}

  <!-- Signature -->
  ${sigLines.length ? `<div style="margin-top:28px;line-height:1.8">${sigLines.map(l => `<p style="margin-bottom:4px">${l}</p>`).join('')}<div style="height:50px"></div></div>` : ''}
</body>
</html>`;
}

// ─── Ouvre une fenêtre et lance window.print() ───────────────
function printHTML(htmlContent, filename) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Veuillez autoriser les popups pour télécharger le PDF.');
    return;
  }

  win.document.open();
  win.document.write(htmlContent);
  win.document.close();

  // Attendre que les ressources soient chargées
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
      // Fermer après impression (optionnel)
      // win.close();
    }, 800);
  };
}

// ─── API publique ─────────────────────────────────────────────
export function downloadCVPDF(text, filename = 'CV_OppsTrack.pdf', lang = 'fr') {
  printHTML(buildEuropassHTML(text, lang), filename);
}

export function downloadLMPDF(text, filename = 'LM_OppsTrack.pdf', lang = 'fr') {
  printHTML(buildLMHTML(text, lang), filename);
}

export function buildPreviewHTML(text, docType, lang = 'fr') {
  return docType === 'cv' ? buildEuropassHTML(text, lang) : buildLMHTML(text, lang);
}
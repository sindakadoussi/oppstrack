// ═══════════════════════════════════════════════════════════════════════════
// ✅ PDF GENERATOR - SANS DOUBLE DÉCLARATION
// ═══════════════════════════════════════════════════════════════════════════

const FONT = `font-family: 'Segoe UI', Arial, Helvetica, sans-serif;`;

function parseCVText(text) {
  if (!text) return { name: '', title: '', coords: [], sections: [] };
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = { name: '', title: '', coords: [], sections: [] };
  let i = 0;

  while (i < lines.length && /^#+\s|^-{3,}$|^\*/.test(lines[i])) i++;
  if (i < lines.length && lines[i].length < 100 && !lines[i].includes('@')) {
    result.name = lines[i].replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    i++;
  }

  while (i < lines.length && /^#+\s|^-{3,}$/.test(lines[i])) i++;
  if (i < lines.length && lines[i].length < 120 && !lines[i].includes('@') && !lines[i].includes('+')) {
    result.title = lines[i].replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    i++;
  }

  const coordLines = [];
  for (let j = 0; j < lines.length; j++) {
    const line = lines[j];
    if ((line.includes('@') || line.includes('+') || line.includes('Tunisie')) && !line.startsWith('#')) {
      coordLines.push(line);
    }
  }
  
  if (coordLines.length > 0) {
    result.coords = coordLines
      .flatMap(line => line.split('|').map(c => c.trim()))
      .map(c => c.replace(/^[📍📧📞🌍]\s*/, '').replace(/^-\s*/, '').trim())
      .filter(c => c.length > 0)
      .slice(0, 6);
  }

  let currentSection = null;
  let currentEntry = null;

  for (const line of lines) {
    if (/^-{3,}$/.test(line) || /^#+\s/.test(line) && line.match(/^#+\s+[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ]/)) {
      const level = (line.match(/^#+/) || [''])[0].length;
      const title = line.replace(/^#+\s+/, '').trim();
      if (level === 2) {
        if (currentSection) result.sections.push(currentSection);
        currentSection = { title, entries: [] };
        currentEntry = null;
      }
    } else if (currentSection) {
      const isDate = /^\d{2}\/\d{4}|^\d{4}\s*[-–]|^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i.test(line);
      const isBullet = /^[-•*]\s/.test(line);
      const isTitle = /^\*\*[^*]+\*\*/.test(line) || (/^[A-ZÀ-Ü][^:]*$/.test(line) && line.length < 100 && !isDate && !isBullet);

      if (isDate) {
        currentEntry = { date: line, title: '', bullets: [] };
        currentSection.entries.push(currentEntry);
      } else if (isTitle && !isBullet) {
        if (!currentEntry) {
          currentEntry = { date: '', title: '', bullets: [] };
          currentSection.entries.push(currentEntry);
        }
        currentEntry.title = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
      } else if (isBullet) {
        if (!currentEntry) {
          currentEntry = { date: '', title: '', bullets: [] };
          currentSection.entries.push(currentEntry);
        }
        const cleanBullet = line.replace(/^[-•*]\s*/, '').trim();
        currentEntry.bullets.push(cleanBullet);
      } else if (line && line.length > 10) {
        if (!currentEntry) {
          currentEntry = { date: '', title: '', bullets: [] };
          currentSection.entries.push(currentEntry);
        }
        currentEntry.bullets.push(line);
      }
    }
  }

  if (currentSection) result.sections.push(currentSection);
  return result;
}

function buildEuropassHTML(text, lang = 'fr') {
  const cv = parseCVText(text);
  const accent = '#003399';

  const coordsHTML = cv.coords.map((c, i) => {
    const sep = i < cv.coords.length - 1 ? '<span style="color:#bbb;margin:0 6px">|</span>' : '';
    return `<span>${c}</span>${sep}`;
  }).join('');

  const sectionsHTML = cv.sections.map(sec => {
    if (!sec.title || sec.entries.length === 0) return '';
    const entriesHTML = sec.entries.filter(e => e.date || e.title || e.bullets.length > 0).map(e => `
      <div style="margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid #f0f0f0">
        ${e.date ? `<div style="font-size:8pt;color:#888;margin-bottom:1px">${e.date}</div>` : ''}
        ${e.title ? `<div style="font-size:9.5pt;font-weight:700;color:#1a1a1a;margin-bottom:3px">${e.title}</div>` : ''}
        ${e.bullets.length ? `<ul style="margin:3px 0 0 16px;padding:0">${e.bullets.map(b => `<li style="font-size:9pt;color:#333;margin-bottom:2px;line-height:1.5">${b}</li>`).join('')}</ul>` : ''}
      </div>`).join('');
    return `<div style="margin-bottom:14px;page-break-inside:avoid">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:2px">
        <span style="color:${accent};font-size:8pt">●</span>
        <span style="font-size:10pt;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:.4px">${sec.title}</span>
      </div>
      <div style="height:1.5px;background:${accent};opacity:.2;margin-bottom:7px"></div>
      <div style="padding-left:2px">${entriesHTML}</div></div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="${lang === 'anglais' ? 'en' : 'fr'}"><head><meta charset="UTF-8"><title>${cv.name} — CV</title><style>* { margin:0; padding:0; box-sizing:border-box; } body { ${FONT} font-size:9.5pt; color:#1a1a1a; background:white; padding:16mm 18mm; line-height:1.5; } ul li { list-style: disc; } @media print { body { padding: 0; margin: 0; } @page { margin: 16mm 18mm; size: A4; } }</style></head><body><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="background:${accent};border-radius:4px;width:42px;height:42px;display:flex;align-items:center;justify-content:center;color:#FFD700;font-size:22px;font-weight:900;flex-shrink:0">★</div><span style="font-size:24pt;font-weight:300;color:${accent};letter-spacing:3px">europass</span></div><div style="font-size:20pt;font-weight:700;color:#1a1a1a;margin-bottom:2px">${cv.name}</div>${cv.title ? `<div style="font-size:10pt;color:#555;font-style:italic;margin-bottom:8px">${cv.title}</div>` : ''}${cv.coords.length ? `<div style="border-top:1px solid #ddd;border-bottom:1px solid #ddd;padding:6px 0;margin-bottom:18px;font-size:8.5pt;color:#333;line-height:2">${coordsHTML}</div>` : ''}${sectionsHTML}</body></html>`;
}

function buildLMHTML(text, lang = 'fr') {
  const accent = '#003399';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !/^#+\s|^-{3,}$/.test(l));
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
  return `<!DOCTYPE html><html lang="${lang === 'anglais' ? 'en' : 'fr'}"><head><meta charset="UTF-8"><title>Lettre</title><style>* { margin:0; padding:0; box-sizing:border-box; } body { ${FONT} font-size:10.5pt; color:#1a1a1a; background:white; padding:20mm 22mm; line-height:1.75; } p { margin-bottom:14px; }</style></head><body><div style="border-top:3px solid ${accent};padding-top:10px;margin-bottom:20px"><div style="font-size:10.5pt;color:#1a1a1a;line-height:1.7">${senderLines.map((l, i) => i === 0 ? `<strong>${l}</strong>` : l).join('<br>')}</div></div>${subjectLine ? `<div style="text-align:center;font-size:11.5pt;font-weight:700;color:${accent};margin:20px 0">${subjectLine}</div>` : ''}${salutation ? `<p style="margin-bottom:16px">${salutation}</p>` : ''}${paragraphs.map(p => `<p>${p}</p>`).join('')}${sigLines.length ? `<div style="margin-top:28px">${sigLines.map(l => `<p style="margin-bottom:4px">${l}</p>`).join('')}</div>` : ''}</body></html>`;
}

async function loadLibraries() {
  return new Promise((resolve, reject) => {
    let loaded = 0;
    const checkLoad = () => { loaded++; if (loaded === 2) resolve(); };
    if (!window.html2canvas) {
      const s1 = document.createElement('script');
      s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s1.onload = checkLoad; s1.onerror = reject; document.head.appendChild(s1);
    } else checkLoad();
    if (!window.jsPDF) {
      const s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s2.onload = checkLoad; s2.onerror = reject; document.head.appendChild(s2);
    } else checkLoad();
  });
}




async function generateAndDownloadPDF(htmlContent, filename) {
  try {
    await loadLibraries();
    const { jsPDF } = window.jspdf;
    const html2canvas = window.html2canvas;
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;padding:0;background:white';
    document.body.appendChild(container);
    await new Promise(r => setTimeout(r, 1000));
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', windowHeight: container.scrollHeight });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    pdf.save(filename);
    document.body.removeChild(container);
    console.log('✅ PDF généré:', filename);
  } catch (e) { 
    console.error('❌ Erreur PDF:', e);
    alert('Erreur PDF: ' + e.message); 
  }
}

export function buildPreviewHTML(text, docType, lang = 'fr') {
  return docType === 'cv' ? buildEuropassHTML(text, lang) : buildLMHTML(text, lang);
}

export async function downloadCVPDF(text, filename = 'CV_Ameliore.pdf', lang = 'fr') {
  const html = buildEuropassHTML(text, lang);
  await generateAndDownloadPDF(html, filename);
}

export async function downloadLMPDF(text, filename = 'LM_Amelioree.pdf', lang = 'fr') {
  const html = buildLMHTML(text, lang);
  await generateAndDownloadPDF(html, filename);
}

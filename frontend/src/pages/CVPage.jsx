import React, { useState, useRef, useEffect } from 'react';

const WEBHOOK_URL = 'http://localhost:5678/webhook/payload-webhook';
const API_BASE    = 'http://localhost:3001/api';

// ── Utilitaires ───────────────────────────────────────────────────────────────
const scoreColor = s => s >= 80 ? '#34d399' : s >= 60 ? '#fbbf24' : '#f87171';

const SECTIONS_CV = ['Coordonnées','Résumé','Formation','Expériences','Compétences','Langues','Projets'];
const SECTIONS_LM = ['Accroche','Votre profil','Motivation','Projet','Valeur ajoutée','Conclusion'];

// ── Indicateur de score circulaire ───────────────────────────────────────────
function ScoreRing({ score }) {
  if (!score) return null;
  const r = 36, c = 2 * Math.PI * r;
  const fill = c - (score / 100) * c;
  const color = scoreColor(score);
  return (
    <div style={{ position:'relative', width:88, height:88, flexShrink:0 }}>
      <svg width="88" height="88" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7"/>
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={c} strokeDashoffset={fill}
          strokeLinecap="round" style={{ transition:'stroke-dashoffset .8s ease' }}/>
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
        <span style={{ fontSize:20,fontWeight:800,color,lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:10,color:'#475569' }}>/100</span>
      </div>
    </div>
  );
}

// ── Checklist item ────────────────────────────────────────────────────────────
function CheckItem({ item }) {
  const colors = { ok:'#34d399', warning:'#fbbf24', error:'#f87171' };
  const icons  = { ok:'✓', warning:'!', error:'✕' };
  const c = colors[item.status] || '#64748b';
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 0',
      borderBottom:'1px solid rgba(255,255,255,.04)' }}>
      <div style={{ width:20,height:20,borderRadius:'50%',background:`${c}20`,border:`1px solid ${c}50`,
        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>
        <span style={{ fontSize:11,fontWeight:800,color:c }}>{icons[item.status]}</span>
      </div>
      <div>
        <div style={{ fontSize:13,fontWeight:600,color:'#e2e8f0',marginBottom:2 }}>{item.title}</div>
        {item.detail && <div style={{ fontSize:12,color:'#64748b',lineHeight:1.5 }}>{item.detail}</div>}
      </div>
    </div>
  );
}

// ── Sélecteur de bourse ───────────────────────────────────────────────────────
function BourseSelector({ bourses, selected, onSelect }) {
  const selectedBourse = bourses.find(b => b.nom === selected);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em',fontWeight:600 }}>
        Bourse cible (personnalisation IA)
      </label>
      <select
        value={selected}
        onChange={e => onSelect(e.target.value)}
        style={{ padding:'9px 14px', borderRadius:10, border:'1px solid rgba(99,102,241,.25)',
          background:'rgba(15,15,30,.8)', color: selected ? '#e2e8f0' : '#64748b',
          fontSize:13, outline:'none', cursor:'pointer' }}>
        <option value="">-- Aucune bourse (CV générique) --</option>
        {bourses.map((b,i) => (
          <option key={i} value={b.nom}>{b.nom}{b.pays ? ` · ${b.pays}` : ''}</option>
        ))}
      </select>
      {selected && (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <div style={{ fontSize:12, color:'#818cf8', display:'flex', alignItems:'center', gap:6 }}>
            <span>✨</span>
            <span>L'IA va scraper le site officiel de <strong>{selected}</strong> pour personnaliser votre document</span>
          </div>
          {selectedBourse?.url && (
            <div style={{ fontSize:11, color:'#475569', display:'flex', alignItems:'center', gap:4 }}>
              <span>🔗</span>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:300 }}>{selectedBourse.url}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Générateur IA ─────────────────────────────────────────────────────────────
async function generateWithAI(type, bourseName, user, extraContext, bourseUrl) {
  const bourseInfo = bourseName
    ? `La bourse cible est "${bourseName}"${bourseUrl ? `. Lien officiel à scraper : ${bourseUrl}` : ''}. Personnalise spécifiquement pour cette bourse.`
    : 'Génère un document générique de qualité professionnelle.';

  const profil = user ? `
Profil du candidat :
- Nom : ${user.name || 'Non renseigné'}
- Niveau : ${user.niveau || user.currentLevel || 'Non renseigné'}
- Domaine : ${user.domaine || user.fieldOfStudy || 'Non renseigné'}
- Pays cible : ${user.pays || 'Non renseigné'}
- Institution : ${user.institution || 'Non renseigné'}
- Motivation : ${user.motivationSummary?.slice(0,200) || 'Non renseignée'}
` : '';

  const prompt = type === 'CV'
    ? `Génère un CV académique complet et professionnel en français, prêt à l'emploi.
${bourseInfo}
${profil}
${extraContext ? `Informations supplémentaires : ${extraContext}` : ''}

Structure obligatoire :
1. COORDONNÉES (Prénom Nom, email, téléphone, LinkedIn, ville)
2. RÉSUMÉ PROFESSIONNEL (3-4 phrases percutantes)
3. FORMATION (du plus récent au plus ancien)
4. EXPÉRIENCES & STAGES (avec résultats mesurables)
5. COMPÉTENCES TECHNIQUES (liste organisée)
6. LANGUES (avec niveaux)
7. PROJETS & RÉALISATIONS
8. ACTIVITÉS & ENGAGEMENTS

Retourne le CV complet et bien formaté en texte.`
    : `Génère une lettre de motivation professionnelle et percutante en français.
${bourseInfo}
${profil}
${extraContext ? `Informations supplémentaires : ${extraContext}` : ''}

Structure :
1. Objet : Candidature à la Bourse ${bourseName || '[Nom Bourse]'}
2. Accroche forte et personnalisée
3. Présentation du profil et parcours
4. Motivation spécifique pour CETTE bourse (pas générique)
5. Projet concret à réaliser avec la bourse
6. Valeur ajoutée apportée
7. Conclusion avec formule professionnelle

Longueur : 400-600 mots. Ton : professionnel, enthousiaste, convaincant.
Retourne la lettre complète et bien formatée.`;

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text:          prompt,
      context:       type === 'CV' ? 'generate_cv' : 'generate_lm',
      conversationId:`${type.toLowerCase()}-gen-${Date.now()}`,
      id:            user?.id || null,
    }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await res.json();
  return data.output || data.text || data.message || '';
}

async function analyzeDocument(text, type, bourseName, bourseUrl) {
  const context = bourseName
    ? `Ce document est destiné à la bourse "${bourseName}"${bourseUrl ? `. Scrape le site officiel : ${bourseUrl} pour vérifier les exigences exactes.` : ''}. Analyse-le en tenant compte des exigences spécifiques de cette bourse.`
    : '';

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `Analyse ce ${type} ${context} et retourne UNIQUEMENT un JSON valide (sans markdown) avec ce format exact:
{"score":number,"checklist":[{"title":string,"status":"ok"|"warning"|"error","detail":string}],"strengths":[string],"toFix":[string],"toAdd":[string],"toRemove":[string],"conclusion":string}

${type} à analyser:
${text}`,
      context:       'CV_ANALYSIS',
      conversationId:`analysis-${Date.now()}`,
    }),
    signal: AbortSignal.timeout(45000),
  });
  const data = await res.json();
  const raw  = data.output || data.text || '';
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return null;
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CVPage({ user }) {
  const [tab,         setTab]         = useState('cv');      // cv | lm
  const [mode,        setMode]        = useState('menu');    // menu | generate | edit | analyze | result
  const [bourse,      setBourse]      = useState('');
  const [bourses,     setBourses]     = useState([]);
  const [content,     setContent]     = useState('');
  const [extraCtx,    setExtraCtx]    = useState('');
  const [analysis,    setAnalysis]    = useState(null);
  const [generating,  setGenerating]  = useState(false);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [fileName,    setFileName]    = useState(null);
  const [genStep,     setGenStep]     = useState('');
  const fileRef = useRef(null);

  // Charger les bourses de l'user
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE}/users/${user.id}?depth=0`)
      .then(r => r.json())
      .then(d => setBourses(d.bourses_choisies || []))
      .catch(() => {});
  }, [user?.id]);

  const docType = tab === 'cv' ? 'CV' : 'Lettre de motivation';

  const handleGenerate = async () => {
    setGenerating(true);
    setMode('generate');
    setGenStep(`Analyse du profil et de la bourse ${bourse || ''}…`);
    try {
      setTimeout(() => setGenStep('Rédaction personnalisée en cours…'), 2000);
      setTimeout(() => setGenStep('Finalisation et mise en forme…'), 5000);
      const selectedBourse = bourses.find(b => b.nom === bourse);
      const result = await generateWithAI(tab === 'cv' ? 'CV' : 'LM', bourse, user, extraCtx, selectedBourse?.url || '');
      setContent(result || '');
      setGenStep('');
      setMode('edit');
    } catch {
      setGenStep('Erreur — réessayez');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setAnalyzing(true);
    setMode('analyze');
    try {
      const selectedBourse2 = bourses.find(b => b.nom === bourse);
      const result = await analyzeDocument(content, docType, bourse, selectedBourse2?.url || '');
      setAnalysis(result);
      setMode('result');
    } catch {}
    finally { setAnalyzing(false); }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => { setContent(e.target.result?.slice(0, 8000) || ''); };
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      setContent(`[Fichier chargé : ${file.name}]\nCollez ou modifiez le contenu ci-dessous pour l'analyse IA.`);
    }
    setMode('edit');
  };

  const reset = () => { setMode('menu'); setContent(''); setAnalysis(null); setFileName(null); setExtraCtx(''); };

  return (
    <div style={S.page}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <h2 style={S.h2}>📄 CV & Lettre de Motivation</h2>
          <p style={S.sub}>L'IA crée et analyse vos documents personnalisés pour chaque bourse</p>
        </div>
        {mode !== 'menu' && (
          <button style={S.btnBack} onClick={reset}>← Retour</button>
        )}
      </div>

      {/* ── Tabs CV / LM ───────────────────────────────────────────── */}
      <div style={S.tabs}>
        {[
          { id:'cv', label:'📄 Mon CV',                icon:'📄' },
          { id:'lm', label:'💌 Lettre de motivation',  icon:'💌' },
        ].map(t => (
          <button key={t.id}
            style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}
            onClick={() => { setTab(t.id); reset(); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MENU ───────────────────────────────────────────────────── */}
      {mode === 'menu' && (
        <div style={S.menuGrid}>

          {/* Sélecteur bourse */}
          <div style={{ ...S.menuCard, gridColumn:'1/-1' }}>
            <BourseSelector
              bourses={bourses}
              selected={bourse}
              onSelect={setBourse}
            />
          </div>

          {/* Créer avec IA */}
          <div style={S.menuCard}>
            <div style={S.menuIcon}>✨</div>
            <div style={S.menuTitle}>Créer avec l'IA</div>
            <div style={S.menuDesc}>
              L'IA génère un {docType} complet et personnalisé{bourse ? ` pour la bourse "${bourse}"` : ''} à partir de votre profil.
            </div>
            {!user && (
              <div style={S.menuWarn}>⚠️ Connectez-vous pour un résultat personnalisé</div>
            )}
            {user && (
              <div style={{ marginBottom:10 }}>
                <textarea
                  style={S.contextInput}
                  value={extraCtx}
                  onChange={e => setExtraCtx(e.target.value)}
                  placeholder={`Informations supplémentaires pour personnaliser votre ${docType} (projets, expériences spécifiques, points forts…)`}
                  rows={3}
                />
              </div>
            )}
            <button style={S.btnPrimary} onClick={handleGenerate}>
              ✨ Générer mon {docType}
            </button>
          </div>

          {/* Uploader & analyser */}
          <div style={S.menuCard}>
            <div style={S.menuIcon}>🔍</div>
            <div style={S.menuTitle}>Analyser un document existant</div>
            <div style={S.menuDesc}>
              Uploadez votre {docType} existant — l'IA vous donne une checklist détaillée et un score.
            </div>
            <div
              style={S.dropZone}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
            >
              <input type="file" ref={fileRef} style={{ display:'none' }}
                accept=".pdf,.doc,.docx,.txt"
                onChange={e => handleFileUpload(e.target.files[0])} />
              {fileName
                ? <><span style={{ fontSize:24 }}>📄</span><span style={{ color:'#34d399',fontSize:13 }}>✅ {fileName}</span></>
                : <><span style={{ fontSize:28 }}>📁</span><span style={{ color:'#64748b',fontSize:13 }}>Glissez ou cliquez — PDF · TXT · DOCX</span></>
              }
            </div>
            <button style={S.btnOutline} onClick={() => setMode('edit')}>
              ✍️ Coller le texte manuellement
            </button>
          </div>
        </div>
      )}

      {/* ── GENERATING ─────────────────────────────────────────────── */}
      {mode === 'generate' && (
        <div style={S.genBox}>
          <div style={S.genSpinner} />
          <div style={{ fontSize:15, fontWeight:600, color:'#e2e8f0', marginBottom:6 }}>
            Génération en cours…
          </div>
          <div style={{ fontSize:13, color:'#64748b' }}>{genStep}</div>
          <div style={{ marginTop:16, display:'flex', gap:6 }}>
            {['Profil analysé','Bourse identifiée','Personnalisation','Rédaction','Finalisation'].map((s,i) => (
              <div key={i} style={{
                fontSize:11, padding:'3px 10px', borderRadius:99,
                background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.2)',
                color:'#818cf8', animation:`fadeIn .4s ease ${i*.15}s both`
              }}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── ANALYZING ──────────────────────────────────────────────── */}
      {mode === 'analyze' && (
        <div style={S.genBox}>
          <div style={S.genSpinner} />
          <div style={{ fontSize:15, fontWeight:600, color:'#e2e8f0', marginBottom:6 }}>
            Analyse IA en cours…
          </div>
          <div style={{ fontSize:13, color:'#64748b' }}>
            Vérification de la structure, du contenu et des points d'amélioration{bourse ? ` pour "${bourse}"` : ''}…
          </div>
        </div>
      )}

      {/* ── EDIT ───────────────────────────────────────────────────── */}
      {mode === 'edit' && (
        <div style={S.editLayout}>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0' }}>
                {docType}{bourse ? ` — ${bourse}` : ''}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button style={S.btnXs} onClick={() => {
                  const blob = new Blob([content], { type:'text/plain' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `${tab === 'cv' ? 'CV' : 'LM'}_${bourse || 'OppsTrack'}.txt`;
                  a.click();
                }}>⬇️ Télécharger</button>
                <button style={S.btnXs} onClick={() => { setContent(''); setBourse(bourse); }}>
                  🔄 Régénérer
                </button>
              </div>
            </div>

            <textarea
              style={S.editArea}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`Votre ${docType} apparaîtra ici après génération, ou collez votre texte…`}
              rows={28}
            />

            <BourseSelector bourses={bourses} selected={bourse} onSelect={setBourse} />

            <button
              style={{ ...S.btnPrimary, opacity: content.trim() ? 1 : .5 }}
              disabled={!content.trim() || analyzing}
              onClick={handleAnalyze}>
              🔍 Analyser avec l'IA{bourse ? ` (pour ${bourse})` : ''}
            </button>
          </div>

          {/* Tips latérales */}
          <div style={S.tipPanel}>
            <div style={S.tipTitle}>💡 Sections {tab === 'cv' ? 'CV' : 'LM'}</div>
            {(tab === 'cv' ? SECTIONS_CV : SECTIONS_LM).map((s,i) => (
              <div key={i} style={S.tipItem}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:'#6366f1',flexShrink:0,marginTop:5 }}/>
                <span>{s}</span>
              </div>
            ))}
            <div style={{ marginTop:16, ...S.tipTitle }}>⚡ Conseils clés</div>
            {(tab === 'cv'
              ? ['Verbes d\'action en début de phrase','Résultats mesurables (+X%, réduit de Y)','Max 1-2 pages','Personnalisez pour chaque bourse']
              : ['Mentionnez la bourse par son nom','Projet concret et réaliste','Ton enthousiaste mais professionnel','1 page maximum']
            ).map((c,i) => (
              <div key={i} style={S.tipItem}>
                <span style={{ color:'#fbbf24',fontSize:12 }}>→</span>
                <span style={{ fontSize:12 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULT ─────────────────────────────────────────────────── */}
      {mode === 'result' && analysis && (
        <div style={S.resultLayout}>
          {/* Score + actions */}
          <div style={S.resultHead}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <ScoreRing score={analysis.score} />
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#f1f5f9' }}>
                  Analyse de votre {docType}
                </div>
                {bourse && (
                  <div style={{ fontSize:12, color:'#818cf8', marginTop:2 }}>
                    Personnalisé pour : {bourse}
                  </div>
                )}
                <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>
                  {analysis.score >= 80 ? '🎉 Excellent — prêt à envoyer !'
                    : analysis.score >= 60 ? '👍 Bon — quelques ajustements recommandés'
                    : '⚠️ À améliorer avant soumission'}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={S.btnXs} onClick={() => setMode('edit')}>✏️ Modifier</button>
              <button style={S.btnPrimary} onClick={handleGenerate}>✨ Régénérer</button>
            </div>
          </div>

          <div style={S.resultGrid}>
            {/* Colonne gauche : checklist + conclusion */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {analysis.checklist?.length > 0 && (
                <div style={S.resultCard}>
                  <div style={S.cardTitle}>✅ Checklist détaillée</div>
                  {analysis.checklist.map((item,i) => <CheckItem key={i} item={item} />)}
                </div>
              )}
              {analysis.conclusion && (
                <div style={{ ...S.resultCard, background:'rgba(99,102,241,.04)' }}>
                  <div style={S.cardTitle}>📝 Conclusion de l'IA</div>
                  <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.7, margin:0 }}>{analysis.conclusion}</p>
                </div>
              )}
            </div>

            {/* Colonne droite : forces + corrections */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {analysis.strengths?.length > 0 && (
                <div style={{ ...S.resultCard, borderColor:'rgba(52,211,153,.2)' }}>
                  <div style={{ ...S.cardTitle, color:'#34d399' }}>💪 Points forts</div>
                  {analysis.strengths.map((s,i) => (
                    <div key={i} style={S.listItem}>
                      <span style={{ color:'#34d399', fontSize:12 }}>✓</span>
                      <span style={{ fontSize:13, color:'#6ee7b7' }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.toFix?.length > 0 && (
                <div style={{ ...S.resultCard, borderColor:'rgba(251,191,36,.2)' }}>
                  <div style={{ ...S.cardTitle, color:'#fbbf24' }}>🔧 À corriger</div>
                  {analysis.toFix.map((s,i) => (
                    <div key={i} style={S.listItem}>
                      <span style={{ color:'#fbbf24', fontSize:12 }}>→</span>
                      <span style={{ fontSize:13, color:'#fde68a' }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.toAdd?.length > 0 && (
                <div style={{ ...S.resultCard, borderColor:'rgba(96,165,250,.2)' }}>
                  <div style={{ ...S.cardTitle, color:'#60a5fa' }}>➕ À ajouter</div>
                  {analysis.toAdd.map((s,i) => (
                    <div key={i} style={S.listItem}>
                      <span style={{ color:'#60a5fa', fontSize:12 }}>+</span>
                      <span style={{ fontSize:13, color:'#93c5fd' }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.toRemove?.length > 0 && (
                <div style={{ ...S.resultCard, borderColor:'rgba(248,113,113,.2)' }}>
                  <div style={{ ...S.cardTitle, color:'#f87171' }}>🗑️ À supprimer</div>
                  {analysis.toRemove.map((s,i) => (
                    <div key={i} style={S.listItem}>
                      <span style={{ color:'#f87171', fontSize:12 }}>✕</span>
                      <span style={{ fontSize:13, color:'#fca5a5' }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:        { width:'100%', padding:'32px 16px', fontFamily:"system-ui,sans-serif", color:'#e2e8f0' },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 },
  h2:          { fontSize:'1.8rem', fontWeight:800, color:'#f1f5f9', marginBottom:6 },
  sub:         { color:'#64748b', fontSize:14 },
  btnBack:     { padding:'8px 16px', borderRadius:9, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'#94a3b8', fontSize:13, cursor:'pointer' },

  tabs:        { display:'flex', gap:6, marginBottom:24 },
  tab:         { padding:'9px 20px', borderRadius:10, border:'1px solid rgba(99,102,241,.2)', background:'transparent', color:'#64748b', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all .2s' },
  tabActive:   { background:'rgba(99,102,241,.2)', borderColor:'rgba(99,102,241,.5)', color:'#818cf8' },

  menuGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  menuCard:    { padding:'22px', borderRadius:16, background:'rgba(15,15,30,.8)', border:'1px solid rgba(99,102,241,.15)', display:'flex', flexDirection:'column', gap:12 },
  menuIcon:    { fontSize:32 },
  menuTitle:   { fontSize:15, fontWeight:700, color:'#f1f5f9' },
  menuDesc:    { fontSize:13, color:'#64748b', lineHeight:1.6, flex:1 },
  menuWarn:    { fontSize:12, color:'#fbbf24', padding:'6px 10px', borderRadius:8, background:'rgba(251,191,36,.08)', border:'1px solid rgba(251,191,36,.2)' },
  contextInput:{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid rgba(99,102,241,.2)', background:'rgba(255,255,255,.03)', color:'#e2e8f0', fontSize:13, outline:'none', resize:'vertical', fontFamily:'system-ui', lineHeight:1.5, boxSizing:'border-box' },

  dropZone:    { border:'2px dashed rgba(99,102,241,.3)', borderRadius:12, padding:'24px', textAlign:'center', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'all .2s' },
  btnPrimary:  { padding:'12px 18px', borderRadius:11, border:'none', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all .2s' },
  btnOutline:  { padding:'10px 16px', borderRadius:11, background:'transparent', border:'1px solid rgba(99,102,241,.3)', color:'#818cf8', fontSize:13, cursor:'pointer' },
  btnXs:       { padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'#94a3b8', fontSize:12, cursor:'pointer' },

  genBox:      { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px', gap:16, textAlign:'center' },
  genSpinner:  { width:48, height:48, borderRadius:'50%', border:'3px solid rgba(99,102,241,.15)', borderTopColor:'#6366f1', borderRightColor:'#a855f7', animation:'spin 1s linear infinite' },

  editLayout:  { display:'flex', gap:20, alignItems:'flex-start' },
  editArea:    { width:'100%', padding:'16px', borderRadius:12, border:'1px solid rgba(99,102,241,.2)', background:'rgba(15,15,30,.6)', color:'#e2e8f0', fontSize:13, fontFamily:"'Courier New',monospace", lineHeight:1.65, outline:'none', resize:'vertical', boxSizing:'border-box', minHeight:500 },
  tipPanel:    { width:220, flexShrink:0, padding:'18px', borderRadius:14, background:'rgba(15,15,30,.8)', border:'1px solid rgba(99,102,241,.15)', display:'flex', flexDirection:'column', gap:8, position:'sticky', top:80 },
  tipTitle:    { fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 },
  tipItem:     { display:'flex', gap:8, alignItems:'flex-start', fontSize:13, color:'#64748b', lineHeight:1.4 },

  resultHead:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderRadius:16, background:'rgba(15,15,30,.8)', border:'1px solid rgba(99,102,241,.15)', marginBottom:16, flexWrap:'wrap', gap:12 },
  resultGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  resultCard:  { padding:'18px 20px', borderRadius:14, background:'rgba(15,15,30,.8)', border:'1px solid rgba(99,102,241,.12)', display:'flex', flexDirection:'column', gap:4 },
  cardTitle:   { fontSize:11, fontWeight:700, color:'#818cf8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 },
  listItem:    { display:'flex', gap:8, alignItems:'flex-start', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,.04)' },
};

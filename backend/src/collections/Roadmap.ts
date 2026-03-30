import React, { useState, useEffect, useCallback } from 'react';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';

const API_BASE    = 'http://localhost:3001/api';
const WEBHOOK_URL = 'http://localhost:5678/webhook/payload-webhook';

const ETAPES_GENERIQUES = [
  { id: 0, icon: '🎯', titre: 'Choisir la bourse',        couleur: '#6366f1' },
  { id: 1, icon: '📋', titre: 'Préparer les documents',   couleur: '#8b5cf6' },
  { id: 2, icon: '✍️', titre: 'Lettre de motivation',     couleur: '#a855f7' },
  { id: 3, icon: '📝', titre: 'CV académique',            couleur: '#c084fc' },
  { id: 4, icon: '🎙️', titre: "Préparer l'entretien",    couleur: '#e879f9' },
  { id: 5, icon: '📬', titre: 'Soumettre la candidature', couleur: '#f472b6' },
  { id: 6, icon: '🎉', titre: 'Attendre les résultats',   couleur: '#fb923c' },
];

// ── Charge les bourses depuis la collection /api/roadmap ──────────────────────
function useBourses(userId) {
  const [bourses, setBourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const res  = await fetch(
        `${API_BASE}/roadmap?where[userId][equals]=${userId}&limit=50&depth=0`,
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await res.json();
      // Normaliser les champs pour correspondre à ce qu'attend BourseTimeline
      const docs = (data.docs || []).map(d => ({
        _id:          d.id,
        nom:          d.nom,
        pays:         d.pays        || '',
        url:          d.lienOfficiel || '',
        deadline:     d.dateLimite  || '',
        financement:  d.financement || '',
        etapeCourante: d.etapeCourante || 0,
        statut:       d.statut      || 'en_cours',
      }));
      setBourses(docs);
    } catch { setBourses([]); }
    finally  { setLoading(false); }
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);
  return { bourses, loading, reload };
}

// ── Génère la roadmap via n8n (inchangé) ─────────────────────────────────────
function useRoadmap(bourse) {
  const [roadmap,    setRoadmap]    = useState(null);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    if (!bourse?.nom) return;

    const cacheKey = `roadmap_${bourse.nom.replace(/\s+/g, '_')}`;
    const cached   = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 24 * 3600 * 1000) { setRoadmap(data); return; }
      } catch {}
    }

    const generate = async () => {
      setGenLoading(true);
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text:    `Génère la roadmap de candidature pour la bourse "${bourse.nom}"`,
            context: 'generate_roadmap',
            bourse:  { nom: bourse.nom, pays: bourse.pays, url: bourse.url },
          }),
          signal: AbortSignal.timeout(45000),
        });
        const data = await res.json();
        const rm   = data?.roadmap || data?.output;

        if (rm && rm.etapes) {
          setRoadmap(rm);
          localStorage.setItem(cacheKey, JSON.stringify({ data: rm, ts: Date.now() }));
        } else {
          setRoadmap(buildFallback(bourse));
        }
      } catch {
        setRoadmap(buildFallback(bourse));
      } finally {
        setGenLoading(false);
      }
    };

    generate();
  }, [bourse?.nom]);

  return { roadmap, genLoading };
}

function buildFallback(bourse) {
  return {
    bourse:         bourse.nom,
    deadlineFinale: bourse.deadline || 'À vérifier sur le site officiel',
    langue:         bourse.langue   || 'À confirmer',
    conseilGlobal:  `Consultez le site officiel de ${bourse.nom} pour les exigences exactes.`,
    etapes: [
      { id:0, icon:'🎯', titre:"Vérifier l'éligibilité",   description:`Vérifier que vous correspondez aux critères de ${bourse.nom}.`,    deadline:'Avant de commencer',          documents:['Relevés de notes','Passeport','Justificatifs de niveau'],            conseils:[`Lisez attentivement les critères de ${bourse.nom}`,"Contactez l'ambassade si nécessaire"], dureeEstimee:'1 semaine' },
      { id:1, icon:'📋', titre:'Rassembler les documents', description:`Préparer le dossier complet selon les exigences de ${bourse.nom}.`, deadline:'6 semaines avant la deadline', documents:['Relevés de notes traduits','Diplômes certifiés','Passeport valide 6+ mois'], conseils:['Faites certifier chaque document','Prévoyez 2 copies de chaque pièce'],    dureeEstimee:'3 semaines' },
      { id:2, icon:'✍️', titre:'Lettre de motivation',     description:`Rédiger une lettre personnalisée pour ${bourse.nom}.`,              deadline:'4 semaines avant',             documents:['Lettre de motivation (1-2 pages)','Plan de recherche si requis'],        conseils:[`Mentionnez explicitement ${bourse.nom}`,'Structure : projet → motivation → impact'], dureeEstimee:'2 semaines' },
      { id:3, icon:'📝', titre:'CV académique',            description:'Adapter le CV au format international requis.',                     deadline:'4 semaines avant',             documents:['CV en français ET en anglais','Europass si requis'],                     conseils:['Format 1-2 pages max','Inclure publications et prix'],                   dureeEstimee:'1 semaine' },
      { id:4, icon:'🎙️', titre:"Préparer l'entretien",    description:`S'entraîner avec le simulateur IA OppsTrack.`,                      deadline:'2 semaines avant',             documents:['Notes de préparation','Questions types de la bourse'],                  conseils:['Utilisez le simulateur entretien OppsTrack',`Renseignez-vous sur ${bourse.pays||'le pays cible'}`], dureeEstimee:'2 semaines' },
      { id:5, icon:'📬', titre:'Soumettre la candidature', description:`Déposer le dossier complet sur la plateforme officielle.`,          deadline:bourse.deadline||'Voir site',   documents:['Dossier complet finalisé','Formulaire de candidature rempli'],           conseils:['Soumettez 48h avant la deadline','Conservez les accusés de réception'],  dureeEstimee:'2 jours' },
      { id:6, icon:'🎉', titre:'Suivi & résultats',        description:"Suivre l'avancement et répondre aux demandes complémentaires.",     deadline:'Après soumission',             documents:[],                                                                        conseils:['Vérifiez vos emails quotidiennement','Préparez un plan B'],             dureeEstimee:'4-12 semaines' },
    ],
  };
}

// ── BourseTimeline — logique inchangée, goToStep sauvegarde dans /api/roadmap ─
function BourseTimeline({ bourse, isActive, onSelect, user, handleQuickReply }) {
  const stepKey = `roadmap_step_${bourse.nom.replace(/\s+/g, '_')}`;

  const [currentStep, setCurrentStep] = useState(() => {
    // 1. Étape depuis la collection roadmap (champ etapeCourante)
    if (bourse.etapeCourante !== undefined) return bourse.etapeCourante;
    // 2. Fallback localStorage
    try {
      const saved = localStorage.getItem(stepKey);
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });

  const { roadmap, genLoading } = useRoadmap(bourse);

  // Sauvegarde localStorage + collection roadmap
  const goToStep = useCallback(async (stepIndex) => {
    setCurrentStep(stepIndex);
    localStorage.setItem(stepKey, String(stepIndex));

    // Mettre à jour etapeCourante dans /api/roadmap/:id
    if (bourse._id) {
      await fetch(`${API_BASE}/roadmap/${bourse._id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ etapeCourante: stepIndex }),
      }).catch(() => {});
    }
  }, [bourse._id, bourse.nom]);

  const etapes = roadmap?.etapes || [];
  const total  = etapes.length || ETAPES_GENERIQUES.length;
  const pct    = total > 1 ? Math.round((currentStep / (total - 1)) * 100) : 0;

  const COLORS = ['#6366f1','#8b5cf6','#a855f7','#c084fc','#e879f9','#f472b6','#fb923c'];

  // Badge statut
  const statutColors = {
    en_cours: { bg:'rgba(99,102,241,0.12)', color:'#818cf8', label:'En cours' },
    soumis:   { bg:'rgba(251,191,36,0.12)', color:'#fbbf24', label:'Soumis' },
    accepte:  { bg:'rgba(16,185,129,0.12)', color:'#10b981', label:'Accepté ✓' },
    refuse:   { bg:'rgba(239,68,68,0.12)',  color:'#f87171', label:'Refusé' },
  };
  const statutStyle = statutColors[bourse.statut] || statutColors.en_cours;

  return (
    <div style={S.timelineCard}>
      <div style={S.bourseHeader} onClick={onSelect}>
        <div style={S.bourseInfo}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={S.bourseName}>{bourse.nom}</div>
            <span style={{ ...S.statutBadge, background: statutStyle.bg, color: statutStyle.color }}>
              {statutStyle.label}
            </span>
          </div>
          <div style={S.bourseMeta}>
            {bourse.pays     && <span>📍 {bourse.pays}</span>}
            {roadmap?.deadlineFinale && <span>⏰ {roadmap.deadlineFinale}</span>}
            {roadmap?.langue         && <span>🗣 {roadmap.langue}</span>}
          </div>
          {bourse.url && (
            <a href={bourse.url} target="_blank" rel="noopener noreferrer" style={S.bourseUrl}
               onClick={e => e.stopPropagation()}>
              🔗 Site officiel
            </a>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={S.pctBadge}>{currentStep + 1}/{total} · {pct}%</div>
          <div style={{ ...S.chevron, transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</div>
        </div>
      </div>

      {isActive && (
        <div style={S.timelineBody}>
          {roadmap?.conseilGlobal && (
            <div style={S.conseilGlobal}>💡 {roadmap.conseilGlobal}</div>
          )}

          {genLoading && (
            <div style={S.genLoading}>
              <div style={S.spinner} />
              <span>L'IA analyse le site officiel de {bourse.nom}…</span>
            </div>
          )}

          {!genLoading && etapes.map((etape, i) => {
            const isCompleted = i < currentStep;
            const isActif     = i === currentStep;
            const isPending   = i > currentStep;
            const color       = COLORS[i % COLORS.length];

            return (
              <div key={etape.id ?? i} style={S.stepRow} onClick={() => goToStep(i)}>
                <div style={S.connector}>
                  <div style={{
                    ...S.dot,
                    background:  isCompleted ? '#10b981' : isActif ? color : 'rgba(30,30,60,0.9)',
                    borderColor: isCompleted ? '#10b981' : isActif ? color : 'rgba(255,255,255,0.1)',
                    boxShadow:   isActif ? `0 0 0 5px ${color}33, 0 0 18px ${color}55` : 'none',
                    opacity:     isPending ? 0.45 : 1,
                  }}>
                    {isCompleted
                      ? <span style={{ color:'#fff', fontSize:14, fontWeight:700 }}>✓</span>
                      : <span style={{ fontSize:16 }}>{etape.icon || '📌'}</span>
                    }
                  </div>
                  {i < etapes.length - 1 && (
                    <div style={{ ...S.line, background: isCompleted ? '#10b981' : 'rgba(99,102,241,0.2)' }} />
                  )}
                </div>

                <div style={{ ...S.stepContent, paddingBottom: i < etapes.length - 1 ? 24 : 8 }}>
                  <div style={S.stepHead}>
                    <div>
                      <div style={{ ...S.stepTitle, color: isPending ? '#475569' : '#f1f5f9' }}>
                        {etape.titre}
                      </div>
                      {etape.deadline && <div style={S.deadline}>⏰ {etape.deadline}</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {etape.dureeEstimee && <span style={S.dureeBadge}>{etape.dureeEstimee}</span>}
                      <span style={{ ...S.stepNum, color: isPending ? '#334155' : '#475569' }}>{i+1}/{total}</span>
                    </div>
                  </div>

                  <div style={{ ...S.stepDesc, color: isPending ? '#334155' : '#64748b' }}>
                    {etape.description}
                  </div>

                  {(isActif || isCompleted) && etape.documents?.length > 0 && (
                    <div style={S.docsBox}>
                      <div style={S.docsTitle}>📁 Documents requis :</div>
                      {etape.documents.map((doc, j) => (
                        <div key={j} style={S.docItem}>
                          <span style={{ color: isCompleted ? '#10b981' : color }}>{isCompleted ? '✓' : '→'}</span>
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(isActif || isCompleted) && etape.conseils?.length > 0 && (
                    <div style={S.conseils}>
                      {etape.conseils.map((c, j) => (
                        <div key={j} style={S.conseilItem}>
                          <span style={{ color:'#6366f1' }}>💡</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(isActif || isCompleted) && etape.lienOfficiel && (
                    <a href={etape.lienOfficiel} target="_blank" rel="noopener noreferrer"
                       style={S.stepLink} onClick={e => e.stopPropagation()}>
                      🔗 Lien officiel de cette étape
                    </a>
                  )}

                  {isActif && (
                    <div style={S.stepActions}>
                      <button style={S.btnNext}
                        onClick={e => { e.stopPropagation(); goToStep(Math.min(i+1, total-1)); }}>
                        Étape suivante →
                      </button>
                      <button style={S.btnAI}
                        onClick={e => {
                          e.stopPropagation();
                          handleQuickReply(`Pour la bourse ${bourse.nom}, je suis à l'étape ${i+1}/${total} : "${etape.titre}". Comment réussir cette étape ? Quels documents préparer et quels conseils as-tu ?`);
                        }}>
                        🤖 Aide IA
                      </button>
                      {i > 0 && (
                        <button style={S.btnDone}
                          onClick={e => { e.stopPropagation(); goToStep(i-1); }}>
                          ← Retour
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div style={S.progressBox}>
            <div style={S.progressLabel}>
              <span>Progression {bourse.nom}</span>
              <span style={{ color:'#818cf8', fontWeight:600 }}>{pct}%</span>
            </div>
            <div style={S.progressTrack}>
              <div style={{ ...S.progressFill, width:`${pct}%` }} />
            </div>
            <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>
              Étape {currentStep+1} sur {total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoadmapPage({
  user, messages, input, setInput, loading,
  handleSend, chatContainerRef, handleQuickReply,
}) {
  const { bourses, loading: boursesLoading, reload } = useBourses(user?.id);
  const [activeBourse, setActiveBourse] = useState(0);

  useEffect(() => {
    if (bourses.length > 0) setActiveBourse(0);
  }, [bourses.length]);

  return (
    <div style={{ width:'100%', padding:'32px 16px', fontFamily:"'Outfit', sans-serif" }}>
      <div style={S.layout}>
        <div style={S.left}>
          <div style={S.header}>
            <h2 style={S.h2}>🗺️ Roadmap de Candidature</h2>
            <p style={S.sub}>
              {bourses.length > 0
                ? `${bourses.length} bourse${bourses.length > 1 ? 's' : ''} — timeline personnalisée par l'IA`
                : 'Cliquez sur Appliquer dans les recommandations pour ajouter une bourse'}
            </p>
          </div>

          {boursesLoading && (
            <div style={S.loadingBox}>
              <div style={S.spinner} />
              <span style={{ color:'#64748b', fontSize:14 }}>Chargement de vos bourses…</span>
            </div>
          )}

          {!boursesLoading && bourses.length === 0 && (
            <div style={S.emptyBox}>
              <div style={{ fontSize:48, marginBottom:16 }}>🗺️</div>
              <div style={{ color:'#f1f5f9', fontWeight:700, fontSize:16, marginBottom:8 }}>
                Aucune candidature en cours
              </div>
              <div style={{ color:'#64748b', fontSize:13, lineHeight:1.6, maxWidth:360, textAlign:'center' }}>
                Allez dans <strong style={{ color:'#818cf8' }}>Recommandations</strong> et cliquez sur{' '}
                <strong style={{ color:'#818cf8' }}>🗺️ Appliquer</strong> sur une bourse pour démarrer votre roadmap.
              </div>
              <button style={S.btnChat}
                onClick={() => handleQuickReply('Recommande moi des bourses')}>
                🎯 Voir les recommandations
              </button>
            </div>
          )}

          {!boursesLoading && bourses.map((bourse, i) => (
            <BourseTimeline
              key={bourse._id || bourse.nom + i}
              bourse={bourse}
              isActive={activeBourse === i}
              onSelect={() => setActiveBourse(activeBourse === i ? -1 : i)}
              user={user}
              handleQuickReply={handleQuickReply}
            />
          ))}

          {user?.id && !boursesLoading && (
            <button style={S.btnRefresh} onClick={reload}>🔄 Actualiser mes bourses</button>
          )}
        </div>

        <div style={S.chatPanel}>
          <div style={S.chatHead}>
            <span style={{ fontSize:22 }}>🤖</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'#e2e8f0' }}>Assistant Roadmap</div>
              <div style={{ fontSize:12, color:'#64748b' }}>Conseils personnalisés par étape</div>
            </div>
          </div>

          <div style={S.chatMessages} ref={chatContainerRef}>
            {messages.length === 0 && (
              <div style={{ padding:12 }}>
                <p style={{ color:'#64748b', fontSize:13, marginBottom:12 }}>
                  Demandez-moi des conseils sur n'importe quelle étape !
                </p>
                {[
                  'Comment écrire une lettre de motivation percutante ?',
                  'Quels documents faut-il pour une bourse en France ?',
                  "Comment se préparer à l'entretien de sélection ?",
                ].map((q, i) => (
                  <button key={i} style={S.suggestBtn} onClick={() => handleQuickReply(q)}>{q}</button>
                ))}
              </div>
            )}
            {messages.slice(-20).map((msg, i) => (
              <div key={i} style={{ ...S.msg, ...(msg.sender === 'user' ? S.msgUser : {}) }}>
                {msg.sender === 'ai'   && <div style={S.avatar}>🤖</div>}
                <div style={{ ...S.bubble, ...(msg.sender === 'user' ? S.bubbleUser : S.bubbleAI) }}>
                  {msg.text}
                </div>
                {msg.sender === 'user' && <div style={{ ...S.avatar, ...S.avatarUser }}>👤</div>}
              </div>
            ))}
            {loading && (
              <div style={S.msg}>
                <div style={S.avatar}>🤖</div>
                <div style={{ ...S.bubble, ...S.bubbleAI, display:'flex', gap:4, alignItems:'center' }}>
                  {[0,1,2].map(i => <span key={i} style={{ ...S.dotAnim, animationDelay:`${i*0.2}s` }} />)}
                </div>
              </div>
            )}
          </div>

          <ChatInput input={input} setInput={setInput}
            onSend={() => {
              const b = bourses[activeBourse];
              const stepKey = b ? `roadmap_step_${b.nom.replace(/\s+/g, '_')}` : null;
              const step = stepKey ? parseInt(localStorage.getItem(stepKey) || '0') : 0;
              if (b && input.trim()) {
                handleSend(`[Contexte: bourse "${b.nom}", étape ${step+1}/7] ` + input);
              } else {
                handleSend();
              }
            }} loading={loading}
            placeholder="Demandez conseil sur cette étape…" />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,60%,100%{transform:scale(0.7);opacity:0.5} 30%{transform:scale(1.1);opacity:1} }
      `}</style>
    </div>
  );
}

const S = {
  layout:       { display:'flex', gap:32, alignItems:'flex-start', maxWidth:1200, margin:'0 auto' },
  left:         { flex:1, display:'flex', flexDirection:'column', gap:16 },
  header:       { marginBottom:8 },
  h2:           { fontSize:'1.8rem', fontWeight:800, color:'#f1f5f9', marginBottom:8 },
  sub:          { color:'#64748b', fontSize:14 },
  loadingBox:   { display:'flex', alignItems:'center', gap:12, padding:'24px', color:'#64748b' },
  emptyBox:     { display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 24px', borderRadius:16, background:'rgba(255,255,255,.02)', border:'1px dashed rgba(99,102,241,.2)' },
  btnChat:      { marginTop:20, padding:'12px 24px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' },
  btnRefresh:   { padding:'8px 16px', borderRadius:8, background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)', color:'#818cf8', fontSize:12, cursor:'pointer', alignSelf:'flex-start' },
  timelineCard: { borderRadius:16, background:'rgba(15,15,30,.8)', border:'1px solid rgba(99,102,241,.2)', overflow:'hidden' },
  bourseHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', cursor:'pointer' },
  bourseInfo:   { flex:1 },
  bourseName:   { fontSize:16, fontWeight:700, color:'#f1f5f9', marginBottom:4 },
  bourseMeta:   { display:'flex', gap:14, fontSize:12, color:'#64748b', flexWrap:'wrap' },
  bourseUrl:    { display:'inline-block', marginTop:6, fontSize:12, color:'#818cf8', textDecoration:'none' },
  statutBadge:  { fontSize:11, padding:'2px 8px', borderRadius:8, fontWeight:600 },
  pctBadge:     { padding:'4px 12px', borderRadius:99, background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.25)', color:'#818cf8', fontSize:12, fontWeight:700 },
  chevron:      { fontSize:22, color:'#475569', transition:'transform .2s' },
  timelineBody: { padding:'0 22px 22px', borderTop:'1px solid rgba(255,255,255,.05)' },
  conseilGlobal:{ margin:'16px 0 20px', padding:'12px 16px', borderRadius:10, background:'rgba(99,102,241,.06)', border:'1px solid rgba(99,102,241,.15)', color:'#94a3b8', fontSize:13, lineHeight:1.6 },
  genLoading:   { display:'flex', alignItems:'center', gap:12, padding:'24px', color:'#64748b', fontSize:13 },
  stepRow:      { display:'flex', gap:16, cursor:'pointer' },
  connector:    { display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, width:44 },
  dot:          { width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'2px solid', transition:'all .3s', zIndex:1 },
  line:         { width:2, flex:1, minHeight:16, margin:'4px 0', transition:'background .3s' },
  stepContent:  { flex:1 },
  stepHead:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4, paddingTop:8 },
  stepTitle:    { fontSize:15, fontWeight:700, marginBottom:2 },
  deadline:     { fontSize:11, color:'#f59e0b', fontWeight:600 },
  dureeBadge:   { padding:'2px 8px', borderRadius:99, background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.2)', color:'#a78bfa', fontSize:11 },
  stepNum:      { fontSize:11 },
  stepDesc:     { fontSize:13, lineHeight:1.55, marginBottom:10 },
  docsBox:      { marginBottom:10, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)' },
  docsTitle:    { fontSize:11, color:'#475569', fontWeight:700, letterSpacing:1, marginBottom:8, textTransform:'uppercase' },
  docItem:      { display:'flex', gap:8, fontSize:12, color:'#94a3b8', marginBottom:5, alignItems:'flex-start' },
  conseils:     { display:'flex', flexDirection:'column', gap:5, marginBottom:10 },
  conseilItem:  { display:'flex', gap:8, fontSize:12, color:'#64748b', alignItems:'flex-start' },
  stepLink:     { display:'inline-block', marginBottom:10, fontSize:12, color:'#818cf8', textDecoration:'none' },
  stepActions:  { display:'flex', gap:8, marginTop:4, flexWrap:'wrap' },
  btnNext:      { padding:'8px 16px', borderRadius:8, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' },
  btnAI:        { padding:'8px 14px', borderRadius:8, background:'rgba(99,102,241,.12)', border:'1px solid rgba(99,102,241,.3)', color:'#818cf8', fontSize:12, cursor:'pointer' },
  btnDone:      { padding:'8px 14px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', color:'#64748b', fontSize:12, cursor:'pointer' },
  progressBox:  { marginTop:20, padding:'16px 18px', borderRadius:12, background:'rgba(15,15,30,.6)', border:'1px solid rgba(99,102,241,.12)' },
  progressLabel:{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#64748b', marginBottom:8 },
  progressTrack:{ height:6, background:'rgba(255,255,255,.05)', borderRadius:3, overflow:'hidden' },
  progressFill: { height:'100%', background:'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius:3, transition:'width .5s ease' },
  chatPanel:    { width:340, flexShrink:0, background:'rgba(15,15,30,.8)', border:'1px solid rgba(99,102,241,.2)', borderRadius:16, overflow:'hidden', position:'sticky', top:80, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 100px)' },
  chatHead:     { display:'flex', gap:10, alignItems:'center', padding:'14px 16px', borderBottom:'1px solid rgba(99,102,241,.15)' },
  chatMessages: { flex:1, overflowY:'auto', padding:12, minHeight:300 },
  suggestBtn:   { display:'block', width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:8, background:'rgba(99,102,241,.08)', border:'1px solid rgba(99,102,241,.2)', color:'#94a3b8', fontSize:12, cursor:'pointer', marginBottom:6, lineHeight:1.4 },
  msg:          { display:'flex', gap:8, marginBottom:12, maxWidth:'92%' },
  msgUser:      { marginLeft:'auto', flexDirection:'row-reverse' },
  avatar:       { width:28, height:28, borderRadius:'50%', background:'rgba(99,102,241,.2)', border:'1px solid rgba(99,102,241,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 },
  avatarUser:   { background:'rgba(139,92,246,.2)', borderColor:'rgba(139,92,246,.3)' },
  bubble:       { padding:'10px 14px', borderRadius:14, fontSize:13, lineHeight:1.5, wordBreak:'break-word' },
  bubbleAI:     { background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', color:'#cbd5e1', borderTopLeftRadius:4 },
  bubbleUser:   { background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'#fff', borderTopRightRadius:4 },
  dotAnim:      { width:6, height:6, borderRadius:'50%', background:'#6366f1', display:'inline-block', animation:'bounce 1.2s infinite ease-in-out' },
  spinner:      { width:20, height:20, borderRadius:'50%', border:'2px solid rgba(139,92,246,.15)', borderTopColor:'#8b5cf6', animation:'spin 1s linear infinite', flexShrink:0 },
};
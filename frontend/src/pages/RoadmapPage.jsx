// RoadmapPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import axios from 'axios';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';

const ETAPES_GENERIQUES = [
  { id: 0, icon: '🎯', titre: 'Choisir la bourse',        couleur: '#1a3a6b' },
  { id: 1, icon: '📋', titre: 'Préparer les documents',   couleur: '#2563eb' },
  { id: 2, icon: '✍️', titre: 'Lettre de motivation',     couleur: '#1a3a6b' },
  { id: 3, icon: '📝', titre: 'CV académique',            couleur: '#2563eb' },
  { id: 4, icon: '🎙️', titre: "Préparer l'entretien",    couleur: '#1a3a6b' },
  { id: 5, icon: '📬', titre: 'Soumettre la candidature', couleur: '#2563eb' },
  { id: 6, icon: '🎉', titre: 'Attendre les résultats',   couleur: '#f5a623' },
];

function useBourses(userId) {
  const [bourses, setBourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const res = await axiosInstance.get(API_ROUTES.roadmap.byUser(userId), {
        params: { limit:50, depth:0 },
        signal: AbortSignal.timeout(5000),
      });
      const docs = (res.data.docs || []).map(d => ({
        _id:           d.id,
        nom:           d.nom,
        pays:          d.pays         || '',
        url:           d.lienOfficiel || '',
        deadline:      d.dateLimite   || '',
        financement:   d.financement  || '',
        etapeCourante: d.etapeCourante || 0,
        statut:        d.statut       || 'en_cours',
      }));
      const uniqueMap = new Map();
      docs.forEach(b => {
        const key = `${b.nom?.toLowerCase().trim()}|${b.pays?.toLowerCase().trim()}|${b.deadline}`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, b);
      });
      setBourses(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Erreur chargement bourses:', err);
      setBourses([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);
  return { bourses, loading, reload };
}

function useRoadmap(bourse) {
  const [roadmap,    setRoadmap]    = useState(null);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    if (!bourse?.nom) return;
    const cacheKey = `roadmap_${bourse.nom.replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 24 * 3600 * 1000) { setRoadmap(data); return; }
      } catch {}
    }
    const generate = async () => {
      setGenLoading(true);
      try {
        const res = await axios.post(WEBHOOK_ROUTES.chat, {
          text: `Génère la roadmap de candidature pour la bourse "${bourse.nom}"`,
          context: 'generate_roadmap',
          bourse: { nom:bourse.nom, pays:bourse.pays, url:bourse.url },
        }, { headers:{'Content-Type':'application/json'}, signal:AbortSignal.timeout(45000) });
        const rm = res.data?.roadmap || res.data?.output;
        if (rm && rm.etapes) {
          setRoadmap(rm);
          localStorage.setItem(cacheKey, JSON.stringify({ data:rm, ts:Date.now() }));
        } else {
          setRoadmap(buildFallback(bourse));
        }
      } catch (err) {
        console.error('Erreur génération roadmap:', err);
        setRoadmap(buildFallback(bourse));
      } finally {
        setGenLoading(false);
      }
    };
    generate();
  }, [bourse?.nom, bourse?.pays, bourse?.url]);

  return { roadmap, genLoading };
}

function buildFallback(bourse) {
  return {
    bourse: bourse.nom,
    deadlineFinale: bourse.deadline || 'À vérifier sur le site officiel',
    langue: bourse.langue || 'À confirmer',
    conseilGlobal: `Consultez le site officiel de ${bourse.nom} pour les exigences exactes.`,
    etapes: [
      { id:0, icon:'🎯', titre:"Vérifier l'éligibilité",      description:`Vérifier que vous correspondez aux critères de ${bourse.nom}.`,              deadline:'Avant de commencer',         documents:['Relevés de notes','Passeport','Justificatifs de niveau'],         conseils:[`Lisez attentivement les critères de ${bourse.nom}`,"Contactez l'ambassade si nécessaire"], dureeEstimee:'1 semaine' },
      { id:1, icon:'📋', titre:'Rassembler les documents',    description:`Préparer le dossier complet selon les exigences de ${bourse.nom}.`,           deadline:'6 semaines avant la deadline', documents:['Relevés de notes traduits','Diplômes certifiés','Passeport valide 6+ mois'], conseils:['Faites certifier chaque document','Prévoyez 2 copies de chaque pièce'],                        dureeEstimee:'3 semaines' },
      { id:2, icon:'✍️', titre:'Lettre de motivation',        description:`Rédiger une lettre personnalisée pour ${bourse.nom}.`,                        deadline:'4 semaines avant',             documents:['Lettre de motivation (1-2 pages)','Plan de recherche si requis'],    conseils:[`Mentionnez explicitement ${bourse.nom}`,'Structure : projet → motivation → impact'],             dureeEstimee:'2 semaines' },
      { id:3, icon:'📝', titre:'CV académique',               description:'Adapter le CV au format international requis.',                               deadline:'4 semaines avant',             documents:['CV en français ET en anglais','Europass si requis'],                 conseils:['Format 1-2 pages max','Inclure publications et prix'],                                           dureeEstimee:'1 semaine' },
      { id:4, icon:'🎙️', titre:"Préparer l'entretien",       description:`S'entraîner avec le simulateur IA OppsTrack.`,                                deadline:'2 semaines avant',             documents:['Notes de préparation','Questions types de la bourse'],              conseils:['Utilisez le simulateur entretien OppsTrack',`Renseignez-vous sur ${bourse.pays||'le pays cible'}`], dureeEstimee:'2 semaines' },
      { id:5, icon:'📬', titre:'Soumettre la candidature',    description:`Déposer le dossier complet sur la plateforme officielle.`,                    deadline:bourse.deadline||'Voir site',   documents:['Dossier complet finalisé','Formulaire de candidature rempli'],      conseils:['Soumettez 48h avant la deadline','Conservez les accusés de réception'],                         dureeEstimee:'2 jours' },
      { id:6, icon:'🎉', titre:'Suivi & résultats',           description:"Suivre l'avancement et répondre aux demandes complémentaires.",               deadline:'Après soumission',             documents:[],                                                                    conseils:['Vérifiez vos emails quotidiennement','Préparez un plan B'],                                     dureeEstimee:'4-12 semaines' },
    ],
  };
}

function BourseTimeline({ bourse, isActive, onSelect, user, handleQuickReply, onDelete }) {
  const stepKey = `roadmap_step_${bourse.nom?.replace(/\s+/g, '_') || 'unknown'}`;

  const [currentStep, setCurrentStep] = useState(() => {
    if (bourse.etapeCourante !== undefined && bourse.etapeCourante !== null) return bourse.etapeCourante;
    try { const saved = localStorage.getItem(stepKey); return saved ? parseInt(saved, 10) : 0; }
    catch { return 0; }
  });

  const { roadmap, genLoading } = useRoadmap(bourse);

  const goToStep = useCallback(async (stepIndex) => {
    setCurrentStep(stepIndex);
    localStorage.setItem(stepKey, String(stepIndex));
    if (bourse._id) {
      await axiosInstance.patch(API_ROUTES.roadmap.update(bourse._id), { etapeCourante: stepIndex }).catch(() => {});
    }
  }, [bourse._id, stepKey]);

  const etapes = roadmap?.etapes || [];
  const total  = etapes.length || ETAPES_GENERIQUES.length;
  const pct    = total > 1 ? Math.round((currentStep / (total - 1)) * 100) : 0;

  const COLORS = ['#1a3a6b','#2563eb','#1a3a6b','#2563eb','#1a3a6b','#2563eb','#f5a623'];

  const statutColors = {
    en_cours: { bg:'#eff6ff',    color:'#1a3a6b', border:'#bfdbfe', label:'En cours'   },
    soumis:   { bg:'#fffbeb',    color:'#d97706', border:'#fde68a', label:'Soumis'      },
    accepte:  { bg:'#f0fdf4',    color:'#166534', border:'#bbf7d0', label:'Accepté ✓'  },
    refuse:   { bg:'#fef2f2',    color:'#dc2626', border:'#fecaca', label:'Refusé'      },
  };
  const statutStyle = statutColors[bourse.statut] || statutColors.en_cours;

  return (
    <div style={S.timelineCard}>
      <div style={{ height:3, background:`linear-gradient(90deg,#1a3a6b,#f5a623)`, width:`${pct}%`, transition:'width 0.5s ease' }}/>

      <div style={S.bourseHeader} onClick={onSelect}>
        <div style={S.bourseInfo}>
          <div style={S.bourseNameRow}>
            <div style={S.bourseName}>{bourse.nom}</div>
            <div style={S.headerRight}>
              <span style={{ ...S.statutBadge, background:statutStyle.bg, color:statutStyle.color, border:`1px solid ${statutStyle.border}` }}>
                {statutStyle.label}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                style={S.deleteBtn}
                title="Supprimer cette bourse de la roadmap"
              >🗑️</button>
            </div>
          </div>
          <div style={S.bourseMeta}>
            {bourse.pays     && <span>📍 {bourse.pays}</span>}
            {roadmap?.deadlineFinale && <span>⏰ {roadmap.deadlineFinale}</span>}
            {roadmap?.langue && <span>🗣 {roadmap.langue}</span>}
          </div>
          {bourse.url && (
            <a href={bourse.url} target="_blank" rel="noopener noreferrer"
              style={S.bourseUrl} onClick={e => e.stopPropagation()}>
              🔗 Site officiel
            </a>
          )}
        </div>
        <div style={S.headerRightSide}>
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
              <div style={S.spinner}/>
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
                    background:   isCompleted ? '#166534' : isActif ? color : '#f1f5f9',
                    borderColor:  isCompleted ? '#166534' : isActif ? color : '#e2e8f0',
                    boxShadow:    isActif ? `0 0 0 4px ${color}22` : 'none',
                    opacity:      isPending ? 0.5 : 1,
                  }}>
                    {isCompleted ? <span style={{ color:'#fff', fontSize:14, fontWeight:700 }}>✓</span> : <span style={{ fontSize:16 }}>{etape.icon || '📌'}</span>}
                  </div>
                  {i < etapes.length - 1 && <div style={{ ...S.line, background: isCompleted ? '#166534' : '#e2e8f0' }}/>}
                </div>

                <div style={{ ...S.stepContent, paddingBottom: i < etapes.length - 1 ? 24 : 8 }}>
                  <div style={S.stepHead}>
                    <div>
                      <div style={{ ...S.stepTitle, color: isPending ? '#94a3b8' : '#1a3a6b' }}>{etape.titre}</div>
                      {etape.deadline && <div style={S.deadline}>⏰ {etape.deadline}</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {etape.dureeEstimee && <span style={S.dureeBadge}>{etape.dureeEstimee}</span>}
                      <span style={{ ...S.stepNum, color: isPending ? '#cbd5e1' : '#94a3b8' }}>{i + 1}/{total}</span>
                    </div>
                  </div>

                  <div style={{ ...S.stepDesc, color: isPending ? '#94a3b8' : '#475569' }}>
                    {etape.description}
                  </div>

                  {(isActif || isCompleted) && etape.documents?.length > 0 && (
                    <div style={S.docsBox}>
                      <div style={S.docsTitle}>📁 Documents requis :</div>
                      {etape.documents.map((doc, j) => (
                        <div key={j} style={S.docItem}>
                          <span style={{ color: isCompleted ? '#166534' : color }}>{isCompleted ? '✓' : '→'}</span>
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(isActif || isCompleted) && etape.conseils?.length > 0 && (
                    <div style={S.conseils}>
                      {etape.conseils.map((c, j) => (
                        <div key={j} style={S.conseilItem}>
                          <span style={{ color:'#f5a623' }}>💡</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isActif && (
                    <div style={S.stepActions}>
                      <button style={S.btnNext} onClick={e => { e.stopPropagation(); goToStep(Math.min(i + 1, total - 1)); }}>
                        Étape suivante →
                      </button>
                      <button style={S.btnAI}
                        onClick={e => {
                          e.stopPropagation();
                          handleQuickReply(`Pour la bourse ${bourse.nom}, je suis à l'étape ${i + 1}/${total} : "${etape.titre}". Comment réussir cette étape ?`);
                        }}>
                        🤖 Aide IA
                      </button>
                      {i > 0 && (
                        <button style={S.btnBack} onClick={e => { e.stopPropagation(); goToStep(i - 1); }}>
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
              <span style={{ color:'#1a3a6b', fontWeight:600 }}>Progression {bourse.nom}</span>
              <span style={{ color:'#f5a623', fontWeight:700 }}>{pct}%</span>
            </div>
            <div style={S.progressTrack}>
              <div style={{ ...S.progressFill, width:`${pct}%` }}/>
            </div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
              Étape {currentStep + 1} sur {total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Modal de connexion (magic link) ─────────────────────────────────────────
function LoginModal({ onClose }) {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { setErrMsg('Email invalide'); return; }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', {
        email: email.trim().toLowerCase(),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || 'Impossible de contacter le serveur');
    }
  };

  return (
    <div style={M.overlay}>
      <div style={M.box}>
        <div style={M.head}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Connexion à OppsTrack</span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {status === 'idle' && (
            <>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Entrez votre email pour recevoir un <strong style={{ color: '#1a3a6b' }}>lien de connexion magique</strong>.
              </p>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                autoFocus
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                style={M.input}
              />
              {errMsg && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{errMsg}</div>}
              <button style={M.btn} onClick={send}>✉️ Envoyer le lien magique</button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={M.spinner} />
              <p style={{ color: '#64748b', marginTop: 14 }}>Envoi en cours...</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Lien envoyé !</div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                Vérifiez votre boîte mail (et les spams).<br/>
                Cliquez sur le lien pour vous connecter.
              </p>
              <button style={{ ...M.btn, background: '#166534', marginTop: 20 }} onClick={onClose}>
                ✓ Fermer
              </button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#dc2626', marginBottom: 12 }}>{errMsg}</p>
              <button style={{ ...M.btn, background: '#dc2626' }} onClick={() => { setStatus('idle'); setErrMsg(''); }}>
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={M.backdrop} onClick={onClose} />
    </div>
  );
}

const M = {
  overlay:  { position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' },
  backdrop: { position:'absolute', inset:0, background:'rgba(26,58,107,0.45)', backdropFilter:'blur(6px)' },
  box:      { position:'relative', zIndex:2001, width:400, maxWidth:'92vw', background:'#ffffff', borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 20px 48px rgba(26,58,107,0.18)', borderTop:'3px solid #f5a623' },
  head:     { display:'flex', alignItems:'center', gap:10, padding:'16px 20px', background:'#1a3a6b', borderBottom:'1px solid rgba(255,255,255,0.1)' },
  closeBtn: { marginLeft:'auto', background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' },
  body:     { padding:'24px' },
  input:    { width:'100%', padding:'11px 14px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:4 },
  btn:      { width:'100%', marginTop:16, padding:'12px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'opacity 0.2s' },
  spinner:  { width:40, height:40, border:'3px solid #eff6ff', borderTopColor:'#1a3a6b', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' },
};

// Styles pour l'état non connecté
const S_locked = {
  locked: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fc',
    padding: 24,
  },
  lockedCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '48px 40px',
    boxShadow: '0 4px 20px rgba(26,58,107,0.08)',
    maxWidth: 380,
    width: '100%',
  },
  lockBtn: {
    padding: '12px 32px',
    borderRadius: 6,
    background: '#1a3a6b',
    color: 'white',
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
};

export default function RoadmapPage({
  user,
  messages,
  input,
  setInput,
  loading: chatLoading,
  handleSend,
  chatContainerRef,
  handleQuickReply,
}) {
  const [showLoginModal, setShowLoginModal] = useState(false); 
  const { bourses, loading: boursesLoading, reload } = useBourses(user?.id);
  const [activeBourse, setActiveBourse] = useState(0);
  const [showChat, setShowChat] = useState(false);   // ← Ajouté


  if (!user) {
    return (
      <>
        <div style={S_locked.locked}>
          <div style={S_locked.lockedCard}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🗺️</div>
            <h3 style={{ color: '#1a3a6b', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
              Roadmap non disponible
            </h3>
            <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, maxWidth: 280, textAlign: 'center', margin: '0 0 24px' }}>
              Connectez-vous pour suivre l'avancement de vos candidatures et bénéficier de conseils personnalisés.
            </p>
            <button style={S_locked.lockBtn} onClick={() => setShowLoginModal(true)}>
              🔐 Se connecter
            </button>
          </div>
        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }


  const handleDeleteBourse = useCallback(async (bourse) => {
    if (!bourse._id) return;
    try {
      await axiosInstance.delete(API_ROUTES.roadmap.delete(bourse._id));
      reload();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  }, [reload]);

  useEffect(() => {
    if (bourses.length > 0) setActiveBourse(0);
  }, [bourses.length]);

  const getBourseKey = (bourse, index) =>
    bourse._id || `${bourse.nom?.replace(/\s+/g, '_')}-${bourse.pays}-${bourse.deadline}-${index}`;

  return (
    <div style={{ width: '100%', background: '#f8f9fc', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", position: 'relative' }}>

      <div style={{ maxWidth: 1232, margin: '0 auto', padding: '24px 32px' }}>
        <div style={S.layout}>

          {/* Colonne gauche : Liste des timelines */}
          <div style={S.left}>
            {boursesLoading && (
              <div style={S.loadingBox}>
                <div style={S.spinner} />
                <span style={{ color: '#64748b', fontSize: 14 }}>Chargement de vos bourses…</span>
              </div>
            )}

            {!boursesLoading && bourses.length === 0 && (
              <div style={S.emptyBox}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                <div style={{ color: '#1a3a6b', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                  Aucune candidature en cours
                </div>
                <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, maxWidth: 360, textAlign: 'center' }}>
                  Allez dans <strong style={{ color: '#1a3a6b' }}>Recommandations</strong> et cliquez sur{' '}
                  <strong style={{ color: '#f5a623' }}>🗺️ Postuler</strong> pour démarrer votre roadmap.
                </div>
                <button style={S.btnChat} onClick={() => handleQuickReply('Recommande moi des bourses')}>
                  🎯 Voir les recommandations
                </button>
              </div>
            )}

            {!boursesLoading && bourses.map((bourse, i) => (
              <BourseTimeline
                key={getBourseKey(bourse, i)}
                bourse={bourse}
                isActive={activeBourse === i}
                onSelect={() => setActiveBourse(activeBourse === i ? -1 : i)}
                user={user}
                handleQuickReply={handleQuickReply}
                onDelete={() => handleDeleteBourse(bourse)}
              />
            ))}

            {user?.id && !boursesLoading && (
              <button style={S.btnRefresh} onClick={reload}>🔄 Actualiser mes bourses</button>
            )}
          </div>

          {/* Chat latéral (comme dans BoursesPage) */}
          {showChat && (
            <div style={{ 
              width: 320, 
              flexShrink: 0, 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: 10, 
              position: 'sticky', 
              top: 110, 
              display: 'flex', 
              flexDirection: 'column', 
              maxHeight: 'calc(100vh - 130px)', 
              minHeight: 0, 
              boxShadow: '0 4px 16px rgba(26,58,107,0.08)', 
              zIndex: 90 
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '14px 16px', borderBottom: '2px solid #f5a623', background: '#1a3a6b', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Assistant Roadmap</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Conseils personnalisés par étape</div>
                </div>
                <button 
                  onClick={() => setShowChat(false)} 
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 16, marginLeft: 'auto' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12 }} ref={chatContainerRef}>
                {messages.length === 0 && (
                  <div style={{ padding: 12 }}>
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
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
                    {msg.sender === 'ai' && <div style={S.avatar}>🤖</div>}
                    <div style={{ ...S.bubble, ...(msg.sender === 'user' ? S.bubbleUser : S.bubbleAI) }}>
                      {msg.text}
                    </div>
                    {msg.sender === 'user' && <div style={{ ...S.avatar, ...S.avatarUser }}>👤</div>}
                  </div>
                ))}
                {chatLoading && (
                  <div style={S.msg}>
                    <div style={S.avatar}>🤖</div>
                    <div style={{ ...S.bubble, ...S.bubbleAI, display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0,1,2].map(i => <span key={i} style={{ ...S.dotAnim, animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ flexShrink: 0, padding: 12, borderTop: '1px solid #f1f5f9' }}>
                <ChatInput 
                  input={input} 
                  setInput={setInput} 
                  onSend={() => handleSend()} 
                  loading={chatLoading} 
                  placeholder="Demandez conseil sur cette étape…" 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bouton flottant pour ouvrir/fermer le chat */}
      <button
        onClick={() => setShowChat(prev => !prev)}
        style={{
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          width: 56, 
          height: 56, 
          borderRadius: '50%', 
          background: '#f5a623',
          border: 'none', 
          boxShadow: '0 4px 12px rgba(26,58,107,0.3)', 
          cursor: 'pointer', 
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: 24, 
          color: '#1a3a6b', 
          zIndex: 1000
        }}
      >
        {showChat ? '✕' : '💬'}
      </button>

      <style>{`
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes bounce { 0%,60%,100%{transform:scale(0.7);opacity:0.5} 30%{transform:scale(1.1);opacity:1} }
        button[title="Supprimer cette bourse de la roadmap"]:hover {
          background: #fef2f2 !important;
          color: #dc2626 !important;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

// Styles (inchangés)
const S = {
  layout:       { display:'flex', gap:24, alignItems:'flex-start' },
  left:         { flex:1, display:'flex', flexDirection:'column', gap:14 },
  loadingBox:   { display:'flex', alignItems:'center', gap:12, padding:'24px', color:'#64748b' },
  emptyBox:     { display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 24px', borderRadius:10, background:'#ffffff', border:'2px dashed #bfdbfe' },
  btnChat:      { marginTop:20, padding:'11px 24px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' },
  btnRefresh:   { padding:'8px 16px', borderRadius:6, background:'transparent', border:'1px solid #e2e8f0', color:'#64748b', fontSize:12, cursor:'pointer', alignSelf:'flex-start' },

  timelineCard: { borderRadius:10, background:'#ffffff', border:'1px solid #e2e8f0', overflow:'hidden', boxShadow:'0 2px 8px rgba(26,58,107,0.06)' },
  bourseHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', cursor:'pointer' },
  bourseInfo:   { flex:1 },
  bourseName:   { fontSize:15, fontWeight:700, color:'#1a3a6b', marginBottom:4 },
  bourseMeta:   { display:'flex', gap:14, fontSize:12, color:'#64748b', flexWrap:'wrap' },
  bourseUrl:    { display:'inline-block', marginTop:6, fontSize:12, color:'#1a3a6b', textDecoration:'none', fontWeight:500 },
  statutBadge:  { fontSize:11, padding:'2px 9px', borderRadius:4, fontWeight:600 },
  pctBadge:     { padding:'4px 12px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:12, fontWeight:700 },
  chevron:      { fontSize:22, color:'#1a3a6b', transition:'transform .2s', fontWeight:700 },
  timelineBody: { padding:'0 20px 20px', borderTop:'1px solid #f1f5f9' },
  conseilGlobal:{ margin:'14px 0 18px', padding:'12px 16px', borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:13, lineHeight:1.6 },
  genLoading:   { display:'flex', alignItems:'center', gap:12, padding:'24px', color:'#64748b', fontSize:13 },
  stepRow:      { display:'flex', gap:14, cursor:'pointer' },
  connector:    { display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, width:44 },
  dot:          { width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'2px solid', transition:'all .3s', zIndex:1 },
  line:         { width:2, flex:1, minHeight:16, margin:'4px 0', transition:'background .3s' },
  stepContent:  { flex:1 },
  stepHead:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4, paddingTop:10 },
  stepTitle:    { fontSize:14, fontWeight:700, marginBottom:2, color:'#1a3a6b' },
  deadline:     { fontSize:11, color:'#d97706', fontWeight:600 },
  dureeBadge:   { padding:'2px 8px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:11, fontWeight:500 },
  stepNum:      { fontSize:11, color:'#94a3b8' },
  stepDesc:     { fontSize:13, lineHeight:1.55, marginBottom:10, color:'#475569' },
  docsBox:      { marginBottom:10, padding:'10px 14px', borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0' },
  docsTitle:    { fontSize:11, color:'#1a3a6b', fontWeight:700, letterSpacing:1, marginBottom:8, textTransform:'uppercase' },
  docItem:      { display:'flex', gap:8, fontSize:12, color:'#475569', marginBottom:5, alignItems:'flex-start' },
  conseils:     { display:'flex', flexDirection:'column', gap:5, marginBottom:10 },
  conseilItem:  { display:'flex', gap:8, fontSize:12, color:'#475569', alignItems:'flex-start' },
  stepActions:  { display:'flex', gap:8, marginTop:6, flexWrap:'wrap' },
  btnNext:      { padding:'8px 16px', borderRadius:6, background:'#1a3a6b', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  btnAI:        { padding:'8px 14px', borderRadius:6, background:'#f5a623', border:'none', color:'#1a3a6b', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  btnBack:      { padding:'8px 14px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#475569', fontSize:12, cursor:'pointer', fontFamily:'inherit' },
  progressBox:  { marginTop:18, padding:'14px 16px', borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0' },
  progressLabel:{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#475569', marginBottom:8 },
  progressTrack:{ height:6, background:'#e2e8f0', borderRadius:3, overflow:'hidden' },
  progressFill: { height:'100%', background:'linear-gradient(90deg,#1a3a6b,#f5a623)', borderRadius:3, transition:'width .5s ease' },

  // Styles du chat (similaires à BoursesPage)
  suggestBtn:   { display:'block', width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:6, background:'#fff', border:'1px solid #e2e8f0', color:'#1a3a6b', fontSize:12, cursor:'pointer', marginBottom:6, lineHeight:1.4, fontFamily:'inherit' },
  msg:          { display:'flex', gap:8, marginBottom:12, maxWidth:'92%' },
  msgUser:      { marginLeft:'auto', flexDirection:'row-reverse' },
  avatar:       { width:28, height:28, borderRadius:8, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 },
  avatarUser:   { background:'#1a3a6b', border:'1px solid #1a3a6b', color:'#fff', fontSize:11, fontWeight:700 },
  bubble:       { padding:'10px 14px', borderRadius:10, fontSize:13, lineHeight:1.5, wordBreak:'break-word' },
  bubbleAI:     { background:'#ffffff', border:'1px solid #e2e8f0', color:'#1a3a6b', borderTopLeftRadius:4, boxShadow:'0 1px 3px rgba(26,58,107,0.05)' },
  bubbleUser:   { background:'#1a3a6b', color:'#fff', borderTopRightRadius:4 },
  dotAnim:      { width:6, height:6, borderRadius:'50%', background:'#1a3a6b', display:'inline-block', animation:'bounce 1.2s infinite ease-in-out' },
  spinner:      { width:20, height:20, borderRadius:'50%', border:'2px solid #e2e8f0', borderTopColor:'#1a3a6b', animation:'spin 1s linear infinite', flexShrink:0 },
  bourseNameRow:{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', marginBottom:4 },
  headerRight:  { display:'flex', alignItems:'center', gap:8 },
  headerRightSide:{ display:'flex', alignItems:'center', gap:10, flexShrink:0 },
  deleteBtn:    { background:'transparent', border:'none', fontSize:16, cursor:'pointer', padding:'5px 7px', borderRadius:4, color:'#dc2626', transition:'all 0.2s ease', display:'flex', alignItems:'center', justifyContent:'center' },
};
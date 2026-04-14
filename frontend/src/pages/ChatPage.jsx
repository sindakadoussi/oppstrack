import React, { useState, useEffect, useRef, useMemo } from 'react';
import ChatInput from '../components/ChatInput';
import axiosInstance from '@/config/axiosInstance';
import BourseDrawer from '../components/Boursedrawer';
import { API_ROUTES } from '@/config/routes';

/* ═══════════════════════════════════════════════════════════════════════════
   QUICK REPLIES
═══════════════════════════════════════════════════════════════════════════ */
const quickReplies = [
  { emoji:'🎓', label:'Trouver mes bourses',   text:'Quelles bourses correspondent à mon profil ?' },
  { emoji:'🔐', label:'Me connecter',          text:'Je veux me connecter' },
  { emoji:'🗺️', label:'Voir la roadmap',       text:'Montre-moi la roadmap pour postuler' },
  { emoji:'🎙️', label:'Préparer un entretien', text:"Je veux m'entraîner pour un entretien de bourse" },
  { emoji:'📄', label:'Analyser mon CV',        text:'Je veux analyser mon CV' },
  { emoji:'❌', label:'Mode invité',            text:'Non, je ne veux pas me connecter, continuer en invité' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HERO STATS
═══════════════════════════════════════════════════════════════════════════ */
function useHeroStats() {
  const [stats, setStats] = useState({ totalBourses:null, pctFinancees:null, loaded:false });
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await axiosInstance.get(API_ROUTES.bourses.list, { params:{ limit:500, depth:0 } });
        const docs = res.data.docs || [];
        const total = res.data.totalDocs ?? docs.length;
        const fin = docs.filter(b => { const f=(b.financement||'').toLowerCase(); return f.includes('100')||f.includes('total')||f.includes('complet')||f.includes('intégral'); });
        setStats({ totalBourses:total, pctFinancees:total>0?Math.round((fin.length/total)*100):null, loaded:true });
      } catch {
        setStats({ totalBourses:500, pctFinancees:98, loaded:true });
      }
    };
    fetch_();
  }, []);
  return stats;
}

function StatNumber({ value, suffix='', loading }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (loading||value===null) return;
    const target=parseInt(value), steps=30, inc=target/steps;
    let step=0;
    const t=setInterval(()=>{ step++; setDisplayed(Math.min(Math.round(inc*step),target)); if(step>=steps)clearInterval(t); }, 800/steps);
    return ()=>clearInterval(t);
  }, [value,loading]);
  if (loading||value===null) return <span className="stat-num stat-loading">—</span>;
  return <span className="stat-num">{displayed}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PARSER — Extraire les bourses du message IA
   Supporte 3 formats :
   1. msg.bourses = [...] (backend structuré)
   2. Bloc JSON dans le texte : ```json\n[...]\n```
   3. Matching de noms dans le texte avec la liste bourses
═══════════════════════════════════════════════════════════════════════════ */
function parseBourses(msg) {
  // ── Format 1 : backend envoie msg.bourses directement
  if (msg.bourses && Array.isArray(msg.bourses) && msg.bourses.length > 0) {
    return msg.bourses;
  }

  const text = msg.text || '';

  // ── Format 2 : JSON caché dans le texte
  const jsonPatterns = [
    /\[\[BOURSES:([\s\S]*?)\]\]/,
    /```json\s*(\[[\s\S]*?\])\s*```/,
    /BOURSES_JSON:\s*(\[[\s\S]*?\])/,
  ];
  for (const pat of jsonPatterns) {
    const m = text.match(pat);
    if (m) { try { const p = JSON.parse(m[1]); if (Array.isArray(p) && p.length) return p; } catch {} }
  }

  // ── Format 3 : parser directement le texte IA — AUCUN matching BDD
  // Détecter si c'est un message de recommandation
  const isReco = /bourse|recommande|voici|correspond.*profil|bourses.*disponibles/i.test(text);
  if (!isReco) return [];

  // Splitter par blocs "#### N️⃣ Nom" (chaque bloc = 1 bourse)
  const blocks = text.split(/(?=####\s)/);
  const bourses = [];

  for (const block of blocks) {
    // Doit commencer par #### pour être un bloc bourse
    if (!block.trim().startsWith('####')) continue;

    // Extraire le titre (nom de la bourse)
    const titleMatch = block.match(/####\s*(?:[\d1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟]+[.\s]*)?(.+)/);
    if (!titleMatch) continue;
    // Nettoyer: enlever *, emojis numériques (1️⃣2️⃣...), chiffres en début
    let nom = titleMatch[1].trim()
      .replace(/\*+/g, '')
      .replace(/^[\d️⃣🔟1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣]+[.\s]*/u, '')
      .replace(/^\d+\.?\s*/, '')
      .trim();
    if (!nom || nom.length < 3) continue;

    // Parser les champs depuis les lignes du bloc
    const pays      = (block.match(/(?:Pays|Country)\s*:\s*([^\n]+)/i)?.[1] || '').trim().replace(/^[-•*\s]+/, '');
    const fin       = (block.match(/(?:Financement|Funding)\s*:\s*([^\n]+)/i)?.[1] || '').trim().replace(/^[-•*\s]+/, '');
    const niveau    = (block.match(/(?:Niveau|Level)\s*:\s*([^\n]+)/i)?.[1] || '').trim().replace(/^[-•*\s]+/, '');
    const domaine   = (block.match(/(?:Domaine|Domain|Field)\s*:\s*([^\n]+)/i)?.[1] || '').trim().replace(/^[-•*\s]+/, '');
    const lienMatch = block.match(/https?:\/\/[^\s)\]>"]+/);
    const lien      = lienMatch ? lienMatch[0].trim() : '';
    const deadline  = (block.match(/(?:Deadline|Date limite|Clôture)\s*:\s*([^\n]+)/i)?.[1] || '').trim().replace(/^[-•*\s]+/, '');

    bourses.push({
      // Pas d'id BDD — généré depuis le texte
      nom,
      pays:         pays || '',
      financement:  fin,
      niveau,
      domaine,
      lienOfficiel: lien,
      dateLimite:   deadline || null,
      // Flag pour différencier des bourses BDD
      _fromText:    true,
    });
  }

  return bourses;
}

function cleanMessageText(text) {
  if (!text) return '';
  let t = text
    .replace(/\[\[BOURSES:[\s\S]*?\]\]/g, '')
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/BOURSES_JSON:[\s\S]*?(?=\n\n|$)/g, '');

  // Si le message contient des blocs bourses (####)
  // Garder seulement l'intro avant le 1er --- ou ###
  if (t.indexOf('####') !== -1) {
    const sep1 = t.indexOf('\n---');
    const sep2 = t.indexOf('\n###');
    const sep3 = t.indexOf('\n####');
    const cuts = [sep1, sep2, sep3].filter(x => x > 0);
    const cutAt = cuts.length > 0 ? Math.min(...cuts) : -1;
    t = cutAt > 0 ? t.slice(0, cutAt) : '';
    // Enlever les lignes commençant par #
    t = t.split('\n').filter(line => !line.trimStart().startsWith('#')).join('\n');
    return t.trim();
  }

  // Sans bourses : enlever les titres markdown
  t = t.split('\n').filter(line => !line.trimStart().startsWith('#')).join('\n');
  return t.trim();
}
function BourseCard({ bourse, onApply, onDetails, onAskAI, applied, index }) {
  const [hovered, setHovered] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appDone, setAppDone] = useState(applied);

  const dl = bourse.dateLimite ? new Date(bourse.dateLimite) : null;
  const daysLeft = dl ? Math.round((dl - new Date()) / 86400000) : null;
  const deadlineColor = daysLeft === null ? '#64748b'
    : daysLeft < 0 ? '#dc2626'
    : daysLeft <= 7 ? '#d97706'
    : daysLeft <= 30 ? '#2563eb'
    : '#166534';

  const getFinancementBadge = () => {
    const f = (bourse.financement || '').toLowerCase();
    if (f.includes('100') || f.includes('total') || f.includes('complet') || f.includes('intégral')) return { label:'100% financée', color:'#166534', bg:'#f0fdf4', border:'#86efac' };
    if (f.includes('partiel') || f.includes('50')) return { label:'Partielle', color:'#d97706', bg:'#fffbeb', border:'#fde68a' };
    if (bourse.financement) return { label:'Financement dispo', color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' };
    return null;
  };

  const badge = getFinancementBadge();

  const handleApply = async () => {
    if (appDone) return;
    setApplying(true);
    await onApply?.(bourse);
    setAppDone(true);
    setApplying(false);
  };

  return (
    <div
      className={`bourse-card bourse-card-${index % 3}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Barre top colorée */}
      <div className="bourse-card-bar"/>

      {/* Header */}
      <div className="bc-header">
        <div className="bc-flag">
          {bourse.pays ? (
            <span title={bourse.pays}>{
              {'France':'🇫🇷','Allemagne':'🇩🇪','Royaume-Uni':'🇬🇧','États-Unis':'🇺🇸',
               'Canada':'🇨🇦','Australie':'🇦🇺','Japon':'🇯🇵','Maroc':'🇲🇦',
               'Tunisie':'🇹🇳','Belgique':'🇧🇪','Suisse':'🇨🇭','Pays-Bas':'🇳🇱',
               'Suède':'🇸🇪','Italie':'🇮🇹','Espagne':'🇪🇸','Chine':'🇨🇳',
               'Corée du Sud':'🇰🇷','International':'🌍','Mondial':'🌐'}[bourse.pays] || '🌍'
            }</span>
          ) : '🌍'}
        </div>
        <div className="bc-title-wrap" style={{ cursor:'pointer' }} onClick={() => onDetails?.(bourse)}>
          <h4 className="bc-title" onMouseEnter={e=>e.currentTarget.style.color='#2563eb'} onMouseLeave={e=>e.currentTarget.style.color='#1a3a6b'}>{bourse.nom}</h4>
          {bourse.pays && <div className="bc-pays">{bourse.pays}</div>}
        </div>
      </div>

      {/* Badges */}
      <div className="bc-badges">
        {badge && (
          <span className="bc-badge" style={{ color:badge.color, background:badge.bg, borderColor:badge.border }}>
            ✓ {badge.label}
          </span>
        )}
        {daysLeft !== null && (
          <span className="bc-badge" style={{ color:deadlineColor, background:`${deadlineColor}15`, borderColor:`${deadlineColor}40` }}>
            ⏰ {daysLeft < 0 ? 'Expiré' : daysLeft === 0 ? 'Aujourd\'hui' : `${daysLeft}j`}
          </span>
        )}
        {bourse.niveau && (
          <span className="bc-badge bc-badge-neutral">🎓 {bourse.niveau}</span>
        )}
      </div>

      {/* Financement info */}
      {bourse.financement && (
        <div className="bc-financement">
          <span className="bc-fin-icon">💰</span>
          <span className="bc-fin-text">{bourse.financement.slice(0, 90)}{bourse.financement.length > 90 ? '…' : ''}</span>
        </div>
      )}

      {/* Domaine */}
      {bourse.domaine && (
        <div className="bc-domaine">📚 {bourse.domaine}</div>
      )}

      {/* Deadline date */}
      {dl && (
        <div className="bc-deadline" style={{ color:deadlineColor }}>
          📅 Deadline : {dl.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
        </div>
      )}

      {/* Actions */}
      <div className="bc-actions">
        {bourse.lienOfficiel && (
          <a href={bourse.lienOfficiel} target="_blank" rel="noopener noreferrer" className="bc-btn bc-btn-outline">
            🔗 Site officiel
          </a>
        )}
        <button className="bc-btn bc-btn-secondary" onClick={() => onDetails?.(bourse)}>
          🔍 Voir détails
        </button>
        <button
          className={`bc-btn bc-btn-primary ${appDone ? 'bc-btn-done' : ''}`}
          onClick={handleApply}
          disabled={appDone || applying}
        >
          {applying ? '⏳' : appDone ? '✓ Ajouté' : '📋 Postuler'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOURSE CARDS GRID — grille de cartes dans un message
═══════════════════════════════════════════════════════════════════════════ */
function BourseCardsGrid({ bourses, onApply, onDetails, onAskAI, appliedNoms, allBourses }) {
  const [visible, setVisible] = useState(3);

  if (!bourses || bourses.length === 0) return null;

  // ✅ FIX DRAWER : enrichir la bourse _fromText avec les données complètes de la BDD
  const enrichBourse = (b) => {
    if (!b._fromText || !allBourses?.length) return b;
    const found = allBourses.find(db => {
      const dbNom = (db.nom || '').toLowerCase().trim();
      const bNom  = (b.nom  || '').toLowerCase().trim();
      return dbNom === bNom ||
             dbNom.includes(bNom.slice(0, 12)) ||
             bNom.includes(dbNom.slice(0, 12));
    });
    return found ? { ...found, _enriched: true } : b;
  };

  return (
    <div className="bc-grid-wrap">
      <div className="bc-grid-header">
        <span className="bc-grid-icon">🎓</span>
        <span className="bc-grid-title">
          {bourses.length} bourse{bourses.length > 1 ? 's' : ''} recommandée{bourses.length > 1 ? 's' : ''}
        </span>
        <span className="bc-grid-sub">selon votre profil</span>
      </div>

      <div className="bc-grid">
        {bourses.slice(0, visible).map((b, i) => (
          <BourseCard
            key={b.id || b.nom || i}
            bourse={b}
            index={i}
            applied={appliedNoms?.has(b.nom?.trim().toLowerCase())}
            onApply={onApply}
            onDetails={(bourse) => onDetails?.(enrichBourse(bourse))}
            onAskAI={onAskAI}
          />
        ))}
      </div>

      {visible < bourses.length && (
        <button className="bc-show-more" onClick={() => setVisible(v => v + 3)}>
          Voir {Math.min(3, bourses.length - visible)} bourse{Math.min(3, bourses.length - visible) > 1 ? 's' : ''} de plus ↓
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT MESSAGE — avec détection de bourses
═══════════════════════════════════════════════════════════════════════════ */
function ChatMessage({ msg, index, appliedNoms, onApply, onDetails, handleQuickReply, allBourses }) {
  const isAI = msg.sender === 'ai';

  const detectedBourses = useMemo(() => {
    if (!isAI) return [];
    return parseBourses(msg);
  }, [msg, isAI]);

  const cleanText = useMemo(() => {
    if (!isAI) return msg.text;
    return cleanMessageText(msg.text || '');
  }, [msg.text, isAI]);

  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : part
      );
      if (/^\s*[-•·✓→★\d+\.]\s/.test(line))
        return <div key={i} className="msg-list-item">• {parts}</div>;
      if (line.trim() === '') return <br key={i}/>;
      return <div key={i}>{parts}</div>;
    });
  };

  const hasCards = detectedBourses.length > 0;

  if (!isAI) {
    return (
      <div className="msg user" style={{ animationDelay:`${index * 0.04}s` }}>
        <div className="msg-content">
          <div className="msg-bubble">
            <div className="msg-text">{formatText(msg.text)}</div>
          </div>
        </div>
        <div className="msg-avatar msg-avatar-user">👤</div>
      </div>
    );
  }

  // Message IA sans cartes — layout normal
  if (!hasCards) {
    return (
      <div className="msg ai" style={{ animationDelay:`${index * 0.04}s` }}>
        <div className="msg-avatar">
          <img src="/logo.png" alt="IA" style={{ width:20, height:20, objectFit:'contain', borderRadius:4 }}
            onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='🤖'; }}/>
        </div>
        <div className="msg-content">
          {cleanText && (
            <div className="msg-bubble">
              <div className="msg-text">{formatText(cleanText)}</div>
              {msg.voiceInput && <div className="voice-badge">🎤 Vocal</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ Message IA AVEC cartes — colonne complète, avatar en ligne avec le texte
  return (
    <div className="msg-with-cards" style={{ animationDelay:`${index * 0.04}s` }}>
      {/* Ligne avatar + texte intro */}
      <div className="msg-intro-row">
        <div className="msg-avatar">
          <img src="/logo.png" alt="IA" style={{ width:20, height:20, objectFit:'contain', borderRadius:4 }}
            onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='🤖'; }}/>
        </div>
        {cleanText && (
          <div className="msg-bubble msg-bubble-intro">
            <div className="msg-text">{formatText(cleanText)}</div>
          </div>
        )}
      </div>
      {/* Cartes pleine largeur en dessous */}
      <BourseCardsGrid
        bourses={detectedBourses}
        appliedNoms={appliedNoms}
        onApply={onApply}
        onDetails={onDetails}
        allBourses={allBourses}
        onAskAI={(b) => handleQuickReply?.(`Donne-moi plus de détails sur la bourse "${b.nom}"`)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLL TO BOTTOM
═══════════════════════════════════════════════════════════════════════════ */
function ScrollToBottomButton({ onClick, visible }) {
  if (!visible) return null;
  return (
    <button className="scroll-btn" onClick={onClick} title="Aller en bas">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CHAT PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function ChatPage({
  user, messages, input, setInput, loading,
  handleSend, handleQuickReply, chatContainerRef, setView,
  // ✅ NOUVELLES PROPS pour les cartes de bourses
  bourses = [],
  appliedNoms,
  onApplyBourse,
}) {
  const heroStats = useHeroStats();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const localRef = useRef(null);
  const containerRef = chatContainerRef || localRef;

  const [drawerBourse, setDrawerBourse] = useState(null);
  const appliedSet = useMemo(() => {
    if (appliedNoms instanceof Set) return appliedNoms;
    return new Set((appliedNoms || []).map(n => n?.trim().toLowerCase()));
  }, [appliedNoms]);

  const scrollToBottom = () => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);
  useEffect(() => { setTimeout(scrollToBottom, 100); }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => setShowScrollButton(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
    el.addEventListener('scroll', check);
    check();
    return () => el.removeEventListener('scroll', check);
  }, []);

  return (
    <div className="chat-page">

      {/* ── HERO ── */}
      <div className="chat-hero">
        <div className="hero-badge">✨ Propulsé par l'IA</div>
        <h1 className="hero-title">
          Trouvez votre bourse<br/>
          <span className="hero-accent">100% financée</span>
        </h1>
        <p className="hero-sub">
          Discutez avec notre IA. Elle analyse votre profil, recommande les meilleures
          opportunités et vous guide à chaque étape.
        </p>
      </div>

      {/* ── CHAT BOX ── */}
      <div className="chat-box">

        {/* Messages */}
        <div className="chat-messages" ref={containerRef}>

          {messages.length === 0 && (
            <div className="welcome-screen">
              <div className="welcome-avatar">
                <img src="/logo.png" alt="OppsTrack" style={{ width:36,height:36,objectFit:'contain',borderRadius:6 }}
                  onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='🤖'; }}/>
              </div>
              <div className="welcome-bubble">
                <p><strong>Bonjour{user?.name ? ` ${user.name}` : ''} !</strong> 👋</p>
                <p>Je suis votre assistant OppsTrack. Je peux :</p>
                <ul>
                  <li>🎓 Recommander des bourses selon votre profil</li>
                  <li>📋 Vous guider sur les démarches à suivre</li>
                  <li>🎙️ Vous préparer à vos entretiens</li>
                  <li>📄 Analyser votre CV et lettre de motivation</li>
                </ul>
                <p>Par où voulez-vous commencer ?</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              msg={msg}
              index={i}
              appliedNoms={appliedSet}
              onApply={onApplyBourse}
              onDetails={setDrawerBourse}
              allBourses={bourses}
              handleQuickReply={handleQuickReply}
            />
          ))}

          {loading && (
            <div className="msg ai">
              <div className="msg-avatar">🤖</div>
              <div className="msg-bubble typing-bubble">
                <span className="dot"/><span className="dot"/><span className="dot"/>
              </div>
            </div>
          )}

          <ScrollToBottomButton onClick={scrollToBottom} visible={showScrollButton}/>
        </div>

        {/* Quick Replies */}
        <div className="quick-replies">
          {quickReplies.map((qr, i) => (
            <button key={i} className="quick-reply-btn"
              onClick={() => handleQuickReply(qr.text)} disabled={loading}>
              <span>{qr.emoji}</span><span>{qr.label}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <ChatInput input={input} setInput={setInput} onSend={() => handleSend()} loading={loading}/>
      </div>

      {/* Stats */}
      <div className="hero-stats">
        <div className="stat">
          <StatNumber value={heroStats.totalBourses} suffix={heroStats.totalBourses>=500?'+':''} loading={!heroStats.loaded}/>
          <span className="stat-label">Bourses</span>
        </div>
        <div className="stat-divider"/>
        <div className="stat">
          <StatNumber value={heroStats.pctFinancees} suffix="%" loading={!heroStats.loaded}/>
          <span className="stat-label">Financées</span>
        </div>
        <div className="stat-divider"/>
        <div className="stat">
          <span className="stat-num">24/7</span>
          <span className="stat-label">IA active</span>
        </div>
      </div>



      {/* ═══ SECTION FEATURES ═══ */}
      <div className="features-section">
        <div className="features-header">
          <div className="features-eyebrow">
            <span className="features-eyebrow-line"/>
            Pourquoi OppsTrack ?
            <span className="features-eyebrow-line"/>
          </div>
          <h2 className="features-title">
            Tout ce dont vous avez besoin pour
            <span className="features-title-gradient"> décrocher votre bourse</span>
          </h2>
        </div>

        <div className="features-grid">
          {[
            {
              icon: '🔍',
              title: 'Matching intelligent',
              desc: "L'IA analyse votre profil et recommande les bourses avec les meilleures chances de succès.",
              cta: 'Trouver mes bourses',
              view: 'bourses',
              accent: '#1a3a6b',
              bg: '#eff6ff',
            },
            {
              icon: '📋',
              title: 'Roadmap personnalisée',
              desc: "Chaque candidature décomposée étape par étape : documents, lettre, soumission, résultat.",
              cta: 'Voir la roadmap',
              view: 'roadmap',
              accent: '#166534',
              bg: '#f0fdf4',
            },
            {
              icon: '🎙️',
              title: 'Entretiens simulés IA',
              desc: "Notre IA joue le rôle du jury. Obtenez un score et des conseils personnalisés.",
              cta: 'Préparer mon entretien',
              view: 'entretien',
              accent: '#f5a623',
              bg: '#fffbeb',
            },
            {
              icon: '📄',
              title: 'Analyse de documents',
              desc: "CV, lettre de motivation — l'IA identifie vos points forts et propose des améliorations.",
              cta: 'Analyser mon CV',
              view: 'chat',
              accent: '#0891b2',
              bg: '#ecfeff',
            },
            {
              icon: '🌍',
              title: 'Carte mondiale',
              desc: "Explorez les bourses dans le monde entier. Filtrez par pays, niveau et domaine.",
              cta: 'Explorer la carte',
              view: 'bourses',
              accent: '#7c3aed',
              bg: '#f5f3ff',
            },
            {
              icon: '📊',
              title: 'Tableau de bord',
              desc: "Suivez vos candidatures, alertes de deadlines et score de préparation en temps réel.",
              cta: 'Voir le dashboard',
              view: 'dashboard',
              accent: '#dc2626',
              bg: '#fef2f2',
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="feat-card"
              style={{ animationDelay: `${i * 0.07}s` }}
              onClick={() => setView && setView(feat.view)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setView && setView(feat.view)}
            >
              <div className="feat-icon-circle" style={{ background: feat.bg, color: feat.accent }}>
                {feat.icon}
              </div>
              <h3 className="feat-title">{feat.title}</h3>
              <p className="feat-desc">{feat.desc}</p>
              <div className="feat-cta" style={{ color: feat.accent }}>
                {feat.cta}
                <svg className="feat-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
              <div className="feat-hover-bar" style={{ background: feat.accent }}/>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ DRAWER BOURSE */}
      {drawerBourse && (
        <BourseDrawer
          bourse={drawerBourse}
          onClose={() => setDrawerBourse(null)}
          onAskAI={b => {
            handleQuickReply(`Donne-moi tous les détails sur la bourse "${b.nom}" : conditions, financement, processus de candidature`);
            setDrawerBourse(null);
          }}
          onChoose={b => {
            handleQuickReply('je choisis ' + b.nom);
            setDrawerBourse(null);
          }}
          applied={appliedSet.has(drawerBourse.nom?.trim().toLowerCase())}
          onApply={async b => { await onApplyBourse?.(b); }}
          starred={false}
          onStar={() => {}}
          user={user}
        />
      )}

      <style>{`
        /* ═══════════════════════════════════════
           PAGE & HERO
        ═══════════════════════════════════════ */
        .chat-page {
          display:flex; flex-direction:column; align-items:center;
          width:100%; max-width:800px; margin:0 auto;
          padding:40px 16px 32px;
          font-family:'Segoe UI',system-ui,sans-serif;
        }
        .chat-hero { text-align:center; margin-bottom:28px; width:100%; }
        .hero-badge {
          display:inline-block; padding:5px 16px;
          background:#eff6ff; border:1px solid #bfdbfe; border-radius:40px;
          color:#1a3a6b; font-size:12px; font-weight:600; letter-spacing:.5px; margin-bottom:20px;
        }
        .hero-title {
          font-size:clamp(1.8rem,5vw,2.8rem); font-weight:800; line-height:1.2;
          color:#1a3a6b; margin-bottom:16px; letter-spacing:-.02em;
        }
        .hero-accent {
          background:linear-gradient(135deg,#f5a623,#e89510);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
        }
        .hero-sub { color:#475569; font-size:15px; max-width:520px; margin:0 auto; line-height:1.6; }

        /* ═══════════════════════════════════════
           CHAT BOX
        ═══════════════════════════════════════ */
        .chat-box {
          width:100%; background:#fff; border-radius:12px;
          border:1px solid #e2e8f0; border-top:3px solid #1a3a6b;
          box-shadow:0 4px 20px rgba(26,58,107,.08); overflow:hidden;
        }
        .chat-messages {
          position:relative; height:500px; overflow-y:auto;
          padding:20px; scroll-behavior:smooth; background:#fafbfc;
        }
        .chat-messages::-webkit-scrollbar { width:5px; }
        .chat-messages::-webkit-scrollbar-track { background:#f1f5f9; }
        .chat-messages::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }

        /* ═══════════════════════════════════════
           WELCOME
        ═══════════════════════════════════════ */
        .welcome-screen { display:flex; gap:12px; align-items:flex-start; padding:8px 0; }
        .welcome-avatar {
          width:42px; height:42px; border-radius:8px;
          background:#eff6ff; border:1px solid #bfdbfe;
          display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;
        }
        .welcome-bubble {
          background:#fff; border:1px solid #e2e8f0; border-radius:0 12px 12px 12px;
          padding:16px 20px; color:#1a3a6b; font-size:14px; line-height:1.6;
          box-shadow:0 2px 8px rgba(26,58,107,.06);
        }
        .welcome-bubble ul { padding-left:20px; margin:8px 0; }
        .welcome-bubble li { margin-bottom:4px; color:#475569; }

        /* ═══════════════════════════════════════
           MESSAGES
        ═══════════════════════════════════════ */
        /* Message avec cartes — bloc vertical pleine largeur */
        .msg-with-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
          animation: msgIn .3s ease both;
          width: 100%;
        }
        .msg-intro-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .msg-bubble-intro {
          flex: 1;
          max-width: calc(100% - 44px);
        }

        .msg {
          display:flex; gap:10px; margin-bottom:18px;
          animation:msgIn .3s ease both;
        }
        .msg.ai { align-items:flex-start; }
        .msg.user { flex-direction:row-reverse; }
        /* Message AI avec cartes → layout full width */
        .msg.ai.msg-has-cards {
          flex-direction:column; gap:8px;
        }
        .msg.ai.msg-has-cards .msg-avatar-row {
          display:flex; align-items:center; gap:8px;
        }
        @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

        .msg-content { display:flex; flex-direction:column; gap:10px; flex:1; max-width:88%; }
        .msg.ai.msg-has-cards .msg-content { max-width:100%; }
        .msg.user .msg-content { align-items:flex-end; }

        .msg-avatar {
          width:34px; height:34px; border-radius:8px;
          background:#eff6ff; border:1px solid #bfdbfe;
          display:flex; align-items:center; justify-content:center;
          font-size:16px; flex-shrink:0; margin-top:2px;
        }
        .msg-avatar-user { background:#1a3a6b; border-color:#1a3a6b; color:#fff; font-size:13px; font-weight:700; }

        .msg-bubble {
          padding:11px 16px; border-radius:12px;
          font-size:14px; line-height:1.55; word-break:break-word;
        }
        .msg.ai .msg-bubble {
          background:#fff; border:1px solid #e2e8f0; color:#1a3a6b;
          border-top-left-radius:4px; box-shadow:0 1px 4px rgba(26,58,107,.05);
        }
        .msg.user .msg-bubble {
          background:#1a3a6b; color:#fff; border-top-right-radius:4px;
          box-shadow:0 2px 8px rgba(26,58,107,.2);
        }
        .msg-text { display:flex; flex-direction:column; gap:2px; }
        .msg-list-item { padding-left:8px; color:#475569; font-size:13px; }
        .msg.user .msg-list-item { color:rgba(255,255,255,0.9); }
        .voice-badge {
          margin-top:8px; display:inline-block; font-size:10px; padding:2px 8px;
          border-radius:10px; background:rgba(26,58,107,.08); color:#1a3a6b; font-weight:600;
        }

        /* ═══════════════════════════════════════
           TYPING
        ═══════════════════════════════════════ */
        .typing-bubble {
          display:flex; gap:5px; align-items:center; padding:12px 16px;
          background:#fff; border:1px solid #e2e8f0; border-radius:12px; border-top-left-radius:4px;
        }
        .dot {
          width:7px; height:7px; border-radius:50%; background:#1a3a6b;
          animation:dotBounce 1.2s infinite ease-in-out;
        }
        .dot:nth-child(1){animation-delay:0s}
        .dot:nth-child(2){animation-delay:.2s}
        .dot:nth-child(3){animation-delay:.4s}
        @keyframes dotBounce{0%,60%,100%{transform:scale(.7);opacity:.5}30%{transform:scale(1.1);opacity:1}}

        /* ═══════════════════════════════════════
           ✅ BOURSE CARDS GRID
        ═══════════════════════════════════════ */
        /* ═══════════════════════════════════════
           BOURSE CARDS — design pro
        ═══════════════════════════════════════ */
        .bc-grid-wrap {
          width: 100%;
          margin-top: 4px;
          animation: fadeIn .4s ease;
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

        .bc-grid-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #1a3a6b08, #f5a62308);
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .bc-grid-icon { font-size: 20px; }
        .bc-grid-title { font-size: 14px; font-weight: 700; color: #1a3a6b; }
        .bc-grid-sub {
          margin-left: auto;
          font-size: 11px;
          color: #94a3b8;
          background: #f8fafc;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }

        /* Grid 2 colonnes */
        .bc-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        /* Card */
        .bourse-card {
          position: relative;
          background: #fff;
          border: 1.5px solid #e8edf5;
          border-radius: 12px;
          overflow: hidden;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
          animation: cardIn .35s ease both;
          display: flex;
          flex-direction: column;
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:none; }
        }
        .bourse-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(26,58,107,.12);
          border-color: #bfdbfe;
        }

        /* Barre top colorée par index */
        .bourse-card-bar { height: 3px; width: 100%; flex-shrink: 0; }
        .bourse-card-0 .bourse-card-bar { background: linear-gradient(90deg,#1a3a6b,#2563eb); }
        .bourse-card-1 .bourse-card-bar { background: linear-gradient(90deg,#166534,#16a34a); }
        .bourse-card-2 .bourse-card-bar { background: linear-gradient(90deg,#7c3aed,#2563eb); }
        .bourse-card-3 .bourse-card-bar { background: linear-gradient(90deg,#f5a623,#d97706); }
        .bourse-card-4 .bourse-card-bar { background: linear-gradient(90deg,#0891b2,#2563eb); }
        .bourse-card-5 .bourse-card-bar { background: linear-gradient(90deg,#dc2626,#7c3aed); }
        .bourse-card-0:hover .bourse-card-bar,
        .bourse-card-1:hover .bourse-card-bar,
        .bourse-card-2:hover .bourse-card-bar,
        .bourse-card-3:hover .bourse-card-bar,
        .bourse-card-4:hover .bourse-card-bar,
        .bourse-card-5:hover .bourse-card-bar {
          background: linear-gradient(90deg,#f5a623,#e89510);
        }

        /* Contenu carte */
        .bc-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px 10px;
        }
        .bc-flag { font-size: 26px; line-height: 1; flex-shrink: 0; }
        .bc-title-wrap { flex: 1; min-width: 0; cursor: pointer; }
        .bc-title {
          font-size: 13px;
          font-weight: 700;
          color: #1a3a6b;
          margin: 0 0 3px;
          line-height: 1.35;
          transition: color .15s;
        }
        .bc-title-wrap:hover .bc-title { color: #2563eb; }
        .bc-pays { font-size: 11px; color: #64748b; }

        /* Badges */
        .bc-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          padding: 0 16px 10px;
        }
        .bc-badge {
          font-size: 10.5px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 6px;
          border: 1px solid;
          white-space: nowrap;
        }
        .bc-badge-neutral { color: #475569; background: #f8fafc; border-color: #e2e8f0; }

        /* Infos */
        .bc-financement {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px 6px;
          font-size: 12px;
          color: #475569;
        }
        .bc-domaine { padding: 0 16px 8px; font-size: 11px; color: #64748b; }
        .bc-deadline { padding: 0 16px 10px; font-size: 11px; font-weight: 600; }

        /* Actions */
        .bc-actions {
          display: flex;
          gap: 6px;
          padding: 10px 14px 14px;
          border-top: 1px solid #f1f5f9;
          margin-top: auto;
        }
        .bc-btn {
          flex: 1;
          padding: 8px 6px;
          border-radius: 7px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid;
          transition: all .18s;
          text-align: center;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-family: inherit;
          white-space: nowrap;
        }
        .bc-btn-primary {
          background: #1a3a6b;
          color: #fff;
          border-color: #1a3a6b;
        }
        .bc-btn-primary:hover:not(:disabled) {
          background: #15314f;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26,58,107,.25);
        }
        .bc-btn-primary:disabled { opacity: .6; cursor: default; }
        .bc-btn-done { background: #166534 !important; border-color: #166534 !important; }

        .bc-btn-secondary {
          background: #fff;
          color: #1a3a6b;
          border-color: #bfdbfe;
        }
        .bc-btn-secondary:hover {
          background: #eff6ff;
          transform: translateY(-1px);
        }

        .bc-btn-outline {
          background: #fff;
          color: #64748b;
          border-color: #e2e8f0;
        }
        .bc-btn-outline:hover { background: #f8fafc; color: #1a3a6b; }

        /* Voir plus */
        .bc-show-more {
          width: 100%;
          margin-top: 10px;
          padding: 10px;
          border: 1.5px dashed #bfdbfe;
          border-radius: 8px;
          background: #f8fafc;
          color: #1a3a6b;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all .18s;
          font-family: inherit;
        }
        .bc-show-more:hover { background: #eff6ff; border-color: #93c5fd; }

        /* ═══════════════════════════════════════
           QUICK REPLIES
        ═══════════════════════════════════════ */
        .quick-replies {
          display:flex; flex-wrap:wrap; gap:8px;
          padding:14px 18px; border-top:1px solid #f1f5f9;
          justify-content:center; background:#f8fafc;
        }
        .quick-reply-btn {
          display:flex; align-items:center; gap:7px;
          padding:7px 14px; border-radius:6px;
          border:1px solid #e2e8f0; background:#fff; color:#1a3a6b;
          font-size:12.5px; font-weight:500; cursor:pointer;
          transition:all .2s; font-family:inherit;
        }
        .quick-reply-btn:hover:not(:disabled) {
          background:#1a3a6b; color:#fff; border-color:#1a3a6b;
          transform:translateY(-1px); box-shadow:0 3px 8px rgba(26,58,107,.2);
        }
        .quick-reply-btn:disabled { opacity:.45; cursor:not-allowed; }

        /* ═══════════════════════════════════════
           STATS
        ═══════════════════════════════════════ */
        .hero-stats {
          display:flex; align-items:center; justify-content:center;
          gap:32px; flex-wrap:wrap; background:#1a3a6b;
          padding:20px 36px; border-radius:10px;
          margin-top:20px; width:100%; border-bottom:3px solid #f5a623;
        }
        .stat { display:flex; flex-direction:column; align-items:center; gap:4px; }
        .stat-num { font-size:1.8rem; font-weight:800; color:#f5a623; min-width:60px; text-align:center; }
        .stat-loading { background:rgba(255,255,255,.1)!important; -webkit-text-fill-color:transparent; border-radius:6px; animation:shimmer 1.4s infinite; }
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:1}}
        .stat-label { font-size:11px; color:rgba(255,255,255,.7); text-transform:uppercase; letter-spacing:1px; font-weight:600; }
        .stat-divider { width:1px; height:36px; background:rgba(255,255,255,.15); }

        /* ═══════════════════════════════════════
           SCROLL BTN
        ═══════════════════════════════════════ */
        .scroll-btn {
          position:sticky; bottom:10px; right:10px; float:right;
          width:36px; height:36px; border-radius:999px;
          background:#1a3a6b; border:none; color:#fff;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 12px rgba(26,58,107,.25); transition:all .18s;
          z-index:20; margin-top:4px;
        }
        .scroll-btn:hover { background:#15314f; transform:scale(1.06); }

        /* ═══════════════════════════════════════
           RESPONSIVE
        ═══════════════════════════════════════ */
        @media(max-width:640px){
          .chat-messages { height:400px; }
          .bc-grid { grid-template-columns:1fr 1fr; gap:8px; }
          .hero-stats { gap:20px; padding:16px 20px; }
          .stat-num { font-size:1.4rem; }
          .bc-actions { flex-direction:column; }
          .bc-btn { flex:none; }
        }
        @media(max-width:400px){
          .bc-grid { grid-template-columns:1fr; }
        }



        /* ═══════════════════════════════════════
           FEATURES SECTION — OppsTrack palette, cliquable
        ═══════════════════════════════════════ */
        .features-section {
          width: 100%;
          margin-top: 48px;
        }
        .features-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .features-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          color: #1a3a6b;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .features-eyebrow-line {
          display: block;
          width: 24px;
          height: 2px;
          background: #f5a623;
          border-radius: 2px;
        }
        .features-title {
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 800;
          color: #0f1724;
          line-height: 1.25;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .features-title-gradient {
          color: #1a3a6b;
        }

        /* Grid */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        /* Card cliquable */
        .feat-card {
          position: relative;
          background: #fff;
          border: 1.5px solid #e8edf5;
          border-radius: 14px;
          padding: 24px 20px 20px;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
          animation: featIn .4s ease both;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 10px;
          outline: none;
          user-select: none;
        }
        @keyframes featIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .feat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 36px rgba(26,58,107,.13);
          border-color: #bfdbfe;
        }
        .feat-card:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26,58,107,.1);
        }
        .feat-card:focus-visible {
          border-color: #1a3a6b;
          box-shadow: 0 0 0 3px rgba(26,58,107,.15);
        }

        /* Icône ronde */
        .feat-icon-circle {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          transition: transform .2s ease;
        }
        .feat-card:hover .feat-icon-circle {
          transform: scale(1.1) rotate(-4deg);
        }

        /* Texte */
        .feat-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f1724;
          margin: 0;
          line-height: 1.3;
        }
        .feat-desc {
          font-size: 12.5px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
          flex: 1;
        }

        /* CTA avec flèche */
        .feat-cta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
          margin-top: 4px;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity .2s ease, transform .2s ease;
        }
        .feat-card:hover .feat-cta {
          opacity: 1;
          transform: translateY(0);
        }
        .feat-arrow {
          transition: transform .2s ease;
        }
        .feat-card:hover .feat-arrow {
          transform: translateX(4px);
        }

        /* Barre colorée bottom */
        .feat-hover-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 0 0 12px 12px;
          opacity: 0;
          transform: scaleX(0);
          transition: opacity .2s ease, transform .25s ease;
          transform-origin: left;
        }
        .feat-card:hover .feat-hover-bar {
          opacity: 1;
          transform: scaleX(1);
        }

        @media (max-width: 680px) {
          .features-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .feat-card { padding: 18px 14px 16px; }
        }
        @media (max-width: 420px) {
          .features-grid { grid-template-columns: 1fr; }
        }

      `}</style>
    </div>
  );
}
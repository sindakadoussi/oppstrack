import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChatPage from './pages/ChatPage';
import BoursesPage from './pages/BoursesPage';
import RoadmapPage from './pages/RoadmapPage';
import DashboardPage from './pages/DashboardPage';
import ProfilPage from './pages/ProfilPage';
import EntretienPage from './pages/EntretienPage';
import CVPage from './pages/CVPage';
import VerifyMagicLink from './pages/VerifyMagicLink';

// ─── CONFIG ─────────────────────────────────────────────────────────────────
// Ajuste ces URLs selon ton environnement :
// • Dev local    : localhost
// • Docker       : host.docker.internal  
const WEBHOOK_URL = 'http://localhost:5678/webhook/payload-webhook';
const API_BASE    = 'http://localhost:3000/api';
// ────────────────────────────────────────────────────────────────────────────

function AppContent() {
  const location = useLocation();
  const [view, setView]                       = useState('accueil');
  const [bourses, setBourses]                 = useState([]);
  const [messages, setMessages]               = useState([]);
  const [input, setInput]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const [currentStep, setCurrentStep]         = useState(0);
  const [user, setUser]                       = useState(null);
  const [entretienScores, setEntretienScores] = useState([]);
  const [serverStatus, setServerStatus]       = useState({ n8n: null, payload: null });
  const chatContainerRef = useRef(null);

  // Conv ID stable par session
  const conversationId = useRef(null);
  if (!conversationId.current) {
    const saved = sessionStorage.getItem('opps_conv_id');
    conversationId.current = saved || `chat-guest-${Date.now()}`;
    if (!saved) sessionStorage.setItem('opps_conv_id', conversationId.current);
  }

  // Charger user sauvegardé
  useEffect(() => {
    const saved = localStorage.getItem('opps_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        conversationId.current = `chat-${u.id}`;
      } catch { localStorage.removeItem('opps_user'); }
    }
  }, []);

  useEffect(() => {
    if (user?.id) conversationId.current = `chat-${user.id}`;
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  // Vérifier si Payload est joignable
  useEffect(() => {
    fetch(`${API_BASE}/bourses?limit=1`, { signal: AbortSignal.timeout(4000) })
      .then(r => setServerStatus(s => ({ ...s, payload: r.ok })))
      .catch(() => setServerStatus(s => ({ ...s, payload: false })));
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/messages?where[conversationId][equals]=${conversationId.current}&limit=100&sort=createdAt`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return;
      const data = await res.json();
      const history = (data.docs || []).map(m => ({
        sender: m.role === 'user' ? 'user' : 'ai',
        text: m.value || m.text || ''
      }));
      setMessages(history);
    } catch { /* silencieux */ }
  }, []);

  const fetchBourses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/bourses`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;
      const data = await res.json();
      setBourses(data.docs || []);
    } catch (e) { console.warn('Bourses:', e.message); }
  }, []);

  const fetchEntretienScores = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `${API_BASE}/entretiens?where[user][equals]=${user.id}&sort=-createdAt&limit=5`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) return;
      const data = await res.json();
      setEntretienScores(data.docs || []);
    } catch (e) { console.warn('Scores:', e.message); }
  }, [user]);

  useEffect(() => { fetchMessages(); fetchBourses(); }, [fetchMessages, fetchBourses]);
  useEffect(() => { fetchEntretienScores(); }, [fetchEntretienScores]);

  // ── Envoi principal ───────────────────────────────────────────────────────
  const handleSend = async (messageText, options = {}) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    setInput('');
    setLoading(true);
    // Affichage immédiat du message utilisateur
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);

    try {
      // 1. Sauvegarder dans Payload (non-bloquant si ça échoue)
      fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend, role: 'user', conversationId: conversationId.current })
      }).catch(e => console.warn('Save user msg:', e.message));

      // 2. Appel n8n (timeout 30s pour laisser l'IA répondre)
      const n8nRes = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          conversationId: conversationId.current,
          id:    user?.id    || null,
          email: user?.email || null,
          context: options.context || null,
          user_profile: user ? {
            pays: user.pays, niveau: user.niveau,
            domaine: user.domaine, name: user.name,
            is_complete: !!(user.pays && user.niveau && user.domaine)
          } : null
        }),
        signal: AbortSignal.timeout(30000)
      });

      setServerStatus(s => ({ ...s, n8n: true }));

      // Parser la réponse (JSON ou texte)
      // Remplace cette partie dans handleSend (autour de la ligne 185)
let data = {};
const text = await n8nRes.text(); // On récupère d'abord le texte brut

if (!text || text.trim() === "") {
    // Si n8n renvoie du vide, on évite l'erreur JSON.parse
    data = { output: "L'assistant est en train de réfléchir, réessaie dans un instant." };
} else {
    try {
        data = JSON.parse(text); // On tente le parse seulement si on a du texte
    } catch (e) {
        // Si ce n'est pas du JSON (ex: erreur 500 HTML), on traite comme du texte
        data = { output: text };
    }
}

      // 3. Appliquer les actions de la réponse
      if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
      if (data.view) setView(data.view);

      if (data.magicUrl) {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: `🔗 **[DEV] Lien de connexion :**\n\n[Cliquer ici pour se connecter](${data.magicUrl})\n\n_En production, ce lien arrive dans ta boîte email._`
        }]);
      }

      if (data.user) {
        const u = data.user;
        localStorage.setItem('opps_user', JSON.stringify(u));
        setUser(u);
        conversationId.current = `chat-${u.id}`;
      }

      // 4. Rafraîchir depuis Payload pour avoir le message IA sauvegardé
      setTimeout(() => fetchMessages(), 800);

    } catch (err) {
      console.error('handleSend error:', err);
      setServerStatus(s => ({ ...s, n8n: false }));

      let msg = '';
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        msg = '⏳ **Temps dépassé.** L\'IA est occupée, réessaie dans quelques secondes.';
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('fetch')) {
        msg = `🔌 **Serveur n8n inaccessible.**\n\nVérifie que :\n- n8n tourne sur \`localhost:5678\`\n- Le workflow est **activé** (bouton ON dans n8n)\n- L'URL du webhook est \`/webhook/payload-webhook\` (pas \`/webhook-test/\`)`;
      } else {
        msg = `⚠️ Erreur : ${err.message}`;
      }
      setMessages(prev => [...prev, { sender: 'ai', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('opps_user');
    localStorage.removeItem('opps_token');
    sessionStorage.removeItem('opps_conv_id');
    setUser(null);
    setMessages([]);
    const newId = `chat-guest-${Date.now()}`;
    sessionStorage.setItem('opps_conv_id', newId);
    conversationId.current = newId;
    setView('accueil');
  };

  const handleQuickReply    = (text) => handleSend(text);
  const askAboutScholarship = (bourse) => {
    handleSend(`Peux-tu me donner plus de détails sur la bourse "${bourse.nom}" et me dire si je suis éligible ?`);
    setView('accueil');
  };

  const sharedProps = {
    user, setUser, messages, setMessages, input, setInput,
    loading, handleSend, handleQuickReply, handleLogout,
    chatContainerRef, currentStep, setCurrentStep,
    bourses, askAboutScholarship, entretienScores,
    fetchEntretienScores, conversationId: conversationId.current,
    view, setView, serverStatus
  };

  if (location.pathname === '/verify') {
    return (
      <Routes>
        <Route path="/verify" element={<VerifyMagicLink setUser={setUser} />} />
      </Routes>
    );
  }

  return (
    <div className="app-root">
      <Navbar view={view} setView={setView} user={user} onLogout={handleLogout} serverStatus={serverStatus} />

      {/* Alerte Payload DOWN */}
      {serverStatus.payload === false && (
        <div className="server-alert">
          ⚠️ <strong>Payload CMS hors ligne</strong> — Lance ton backend sur le port 3000
          &nbsp;·&nbsp;
          <button onClick={() => window.location.reload()} style={{background:'none',border:'none',color:'#fca5a5',cursor:'pointer',textDecoration:'underline'}}>
            Réessayer
          </button>
        </div>
      )}

      <main className="main-content">
        {view === 'accueil'   && <ChatPage      {...sharedProps} />}
        {view === 'bourses'   && <BoursesPage   {...sharedProps} />}
        {view === 'roadmap'   && <RoadmapPage   {...sharedProps} />}
        {view === 'dashboard' && <DashboardPage {...sharedProps} />}
        {view === 'profil'    && <ProfilPage    {...sharedProps} />}
        {view === 'entretien' && <EntretienPage {...sharedProps} />}
        {view === 'cv'        && <CVPage        {...sharedProps} />}
      </main>

      <style>{`
        .server-alert {
          background: rgba(239,68,68,0.1);
          border-bottom: 1px solid rgba(239,68,68,0.25);
          color: #fca5a5; padding: 9px 24px;
          font-size: 13px; text-align: center;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
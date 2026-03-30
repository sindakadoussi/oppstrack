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
import RecommandationsPage from './pages/RecommandationsPage';

const WEBHOOK_URL = 'http://localhost:5678/webhook-test/webhook';
const API_BASE    = 'http://localhost:3001/api';

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
  const historyLoaded    = useRef(false);

  // Conv ID stable par session
  const conversationId = useRef(null);
  if (!conversationId.current) {
    const saved = sessionStorage.getItem('opps_conv_id');
    conversationId.current = saved || `chat-guest-${Date.now()}`;
    if (!saved) sessionStorage.setItem('opps_conv_id', conversationId.current);
  }

  // Charger user sauvegardé au démarrage
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

  // Mettre à jour conversationId quand user change
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

  // ── Fetch messages depuis Payload ──────────────────────────────────────────
  const fetchMessages = useCallback(async (retry = 2) => {
    try {
      // ✅ limit=200 + sort par createdAt pour avoir tous les messages
      const url = `${API_BASE}/messages?where[conversationId][equals]=${conversationId.current}&limit=2000000&sort=createdAt&depth=0`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return;
      const data = await res.json();
      const docs = data.docs || [];

      // ✅ Retry si 0 résultats mais conversationId existe (race condition Payload)
      if (docs.length === 0 && retry > 0) {
        setTimeout(() => fetchMessages(retry - 1), 800);
        return;
      }

      const history = docs.map(m => ({
        sender: m.role === 'user' ? 'user' : 'ai',
        text:   m.text || m.value || '',
        id:     m.id,
      }));
      setMessages(history);
    } catch { /* silencieux */ }
  }, []);

  const fetchBourses = useCallback(async () => {
    try {
const res = await fetch(`${API_BASE}/bourses?limit=200&depth=0`, { signal: AbortSignal.timeout(5000) });
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

  // Charger historique UNE SEULE FOIS au démarrage
  useEffect(() => {
    if (!historyLoaded.current) {
      historyLoaded.current = true;
      fetchMessages();
    }
    fetchBourses();
  }, [fetchMessages, fetchBourses]);

  useEffect(() => { fetchEntretienScores(); }, [fetchEntretienScores]);

  // ── Envoi principal ────────────────────────────────────────────────────────
  const handleSend = async (messageText, options = {}) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    setInput('');
    setLoading(true);

    // Afficher immédiatement le message user
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);

    // Sauvegarder message user dans Payload
    fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text:           textToSend,
        role:           'user',
        conversationId: conversationId.current
      })
    }).catch(e => console.warn('Save user msg:', e.message));

    try {
      // Appel n8n
      const n8nRes = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:           textToSend,
          conversationId: conversationId.current,
          id:             user?.id    || null,
          email:          user?.email || null,
          context:        options.context || null,
          // Profil à la racine ET dans user_profile
          pays:           user?.pays    || '',
          niveau:         user?.niveau  || '',
          domaine:        user?.domaine || '',
          user_profile:   user ? {
            pays:        user.pays,
            niveau:      user.niveau,
            domaine:     user.domaine,
            name:        user.name,
            is_complete: !!(user.pays && user.niveau && user.domaine)
          } : null
        }),
        signal: AbortSignal.timeout(30000)
      });

      setServerStatus(s => ({ ...s, n8n: true }));

      // Parser la réponse
      let data = {};
      const rawText = await n8nRes.text();

      if (!rawText || rawText.trim() === '') {
        data = { output: "L'assistant est en train de réfléchir, réessaie dans un instant." };
      } else {
        try { data = JSON.parse(rawText); }
        catch { data = { output: rawText }; }
      }

      // Actions spéciales
      if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
      if (data.view) setView(data.view);

      // Détecter si l'IA mentionne "profil" → ouvrir la page profil
      const aiText2 = data.output || data.message || data.text || '';
      if (
        aiText2.toLowerCase().includes('accéder à mon profil') ||
        aiText2.toLowerCase().includes('acceder a mon profil') ||
        aiText2.toLowerCase().includes('mettre à jour ton profil') ||
        aiText2.toLowerCase().includes('compléter ton profil') ||
        aiText2.toLowerCase().includes('ton profil :')
      ) {
        setTimeout(() => setView('profil'), 1500);
      }

      if (data.user) {
        const u = data.user;
        localStorage.setItem('opps_user', JSON.stringify(u));
        setUser(u);
        conversationId.current = `chat-${u.id}`;
      }

      // ── Afficher + sauvegarder le message IA ────────────────────────────
      const aiText = data.output || data.message || data.text || '';
      if (aiText) {
        setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);

        fetch(`${API_BASE}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text:           aiText,
            role:           'assistant',
            conversationId: conversationId.current
          })
        })
        .then(() => {
          // ✅ Re-sync depuis Payload après 1.5s pour éviter messages manquants au refresh
          setTimeout(() => fetchMessages(), 1500);
        })
        .catch(e => console.warn('Save AI msg:', e.message));
      }

    } catch (err) {
      console.error('handleSend error:', err);
      setServerStatus(s => ({ ...s, n8n: false }));

      let msg = '';
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        msg = '⏳ **Temps dépassé.** L\'IA est occupée, réessaie dans quelques secondes.';
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        msg = `🔌 **Serveur n8n inaccessible.**\n\nVérifie que :\n- n8n tourne sur \`localhost:5678\`\n- Le workflow est **activé** (bouton ON dans n8n)\n- L'URL du webhook est \`/webhook/payload-webhook\``;
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
    historyLoaded.current = false;
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
      <Navbar
        view={view}
        setView={setView}
        user={user}
        onLogout={handleLogout}
        serverStatus={serverStatus}
      />

      {serverStatus.payload === false && (
        <div className="server-alert">
          ⚠️ <strong>Payload CMS hors ligne</strong> — Lance ton backend sur le port 3000
          &nbsp;·&nbsp;
          <button
            onClick={() => window.location.reload()}
            style={{ background:'none', border:'none', color:'#fca5a5', cursor:'pointer', textDecoration:'underline' }}
          >
            Réessayer
          </button>
        </div>
      )}

      <main className="main-content">
        {view === 'accueil'   && <ChatPage      {...sharedProps} />}
        {view === 'bourses'   && <BoursesPage   {...sharedProps} />}
        {view === 'recommandations' && <RecommandationsPage {...sharedProps} />}
        {view === 'roadmap'   && <RoadmapPage   {...sharedProps} />}
        {view === 'dashboard' && <DashboardPage {...sharedProps} />}
        {view === 'profil'    && <ProfilPage    {...sharedProps} />}
        {view === 'entretien' && <EntretienPage {...sharedProps} />}
        {view === 'cv'        && <CVPage        {...sharedProps} />}
      </main>

  <style>{`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #080812 !important; }
  body {
    font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
    color: #e2e8f0;
    -webkit-font-smoothing: antialiased;
  }
  #root {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,102,241,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 110%, rgba(139,92,246,0.08) 0%, transparent 60%),
      #080812 !important;
  }
  .app-root  { display:flex; flex-direction:column; min-height:100vh; background:transparent; }
  .main-content { flex:1; overflow-x:hidden; background:transparent; }
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.25); border-radius:3px; }
  ::-webkit-scrollbar-thumb:hover { background:rgba(99,102,241,0.4); }
  ::selection { background:rgba(99,102,241,0.3); color:#f1f5f9; }
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

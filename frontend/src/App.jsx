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
import axiosInstance from '@/config/axiosInstance';
import axios from 'axios';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import Footer from './components/Footer';

function AppContent() {
  const location = useLocation();
  const [view, setView]                       = useState('accueil');
  const [bourses, setBourses]                 = useState([]);
  const [initialSelected, setInitialSelected] = useState(null);
  const [messages, setMessages]               = useState([]);
  const [input, setInput]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const [currentStep, setCurrentStep]         = useState(0);
  const [user, setUser]                       = useState(null);
  const [entretienScores, setEntretienScores] = useState([]);
  const [serverStatus, setServerStatus]       = useState({ n8n: null, payload: null });
  const chatContainerRef = useRef(null);
  const historyLoaded    = useRef(false);

  const conversationId = useRef(null);
  if (!conversationId.current) {
    const saved = sessionStorage.getItem('opps_conv_id');
    conversationId.current = saved || `chat-guest-${Date.now()}`;
    if (!saved) sessionStorage.setItem('opps_conv_id', conversationId.current);
  }

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

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    axiosInstance.get(API_ROUTES.bourses.list, {
      params: { limit: 1 },
      signal: AbortSignal.timeout(4000)
    })
      .then(res => setServerStatus(s => ({ ...s, payload: res.status === 200 })))
      .catch(() => setServerStatus(s => ({ ...s, payload: false })));
  }, []);

  const fetchMessages = useCallback(async (retry = 2) => {
    try {
      const res = await axiosInstance.get(API_ROUTES.messages.list, {
        params: {
          'where[conversationId][equals]': conversationId.current,
          limit: 2000000,
          sort:  'createdAt',
          depth: 0,
        },
        signal: AbortSignal.timeout(8000),
      });
      const docs = res.data.docs || [];
      if (docs.length === 0 && retry > 0) {
        setTimeout(() => fetchMessages(retry - 1), 800);
        return;
      }
      setMessages(docs.map(m => ({
        sender: m.role === 'user' ? 'user' : 'ai',
        text:   m.text || m.value || '',
        id:     m.id,
      })));
    } catch {}
  }, []);

  const fetchBourses = useCallback(async () => {
    try {
      const res = await axiosInstance.get(API_ROUTES.bourses.list, {
        params: { limit: 500, depth: 0 },
        signal: AbortSignal.timeout(5000),
      });
      setBourses(res.data.docs || []);
    } catch (e) { console.warn('Bourses:', e.message); }
  }, []);

  const fetchEntretienScores = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await axiosInstance.get(API_ROUTES.entretiens.list, {
        params: { 'where[user][equals]': user.id, sort: '-createdAt', limit: 5 },
        signal: AbortSignal.timeout(5000),
      });
      setEntretienScores(res.data.docs || []);
    } catch (e) { console.warn('Scores:', e.message); }
  }, [user]);

  useEffect(() => {
    if (!historyLoaded.current) {
      historyLoaded.current = true;
      fetchMessages();
    }
    fetchBourses();
  }, [fetchMessages, fetchBourses]);

  useEffect(() => { fetchEntretienScores(); }, [fetchEntretienScores]);

  const handleSend = async (messageText, options = {}) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    axiosInstance.post(API_ROUTES.messages.create, {
      text: textToSend, role: 'user', conversationId: conversationId.current,
    }).catch(e => console.warn('Save user msg:', e.message));

    try {
      const n8nRes = await axios.post('http://localhost:5678/webhook-test/webhook', {
        text: textToSend, conversationId: conversationId.current,
        id: user?.id || null, email: user?.email || null,
        context: options.context || null,
        pays: user?.pays || '', niveau: user?.niveau || '', domaine: user?.domaine || '',
        user_profile: user ? {
          pays: user.pays, niveau: user.niveau, domaine: user.domaine, name: user.name,
          is_complete: !!(user.pays && user.niveau && user.domaine),
        } : null,
      }, { headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(120000) });

      setServerStatus(s => ({ ...s, n8n: true }));
      const data = n8nRes.data || {};
      if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
      if (data.view) setView(data.view);

      const aiText2 = data.output || data.message || data.text || '';
      if (['accéder à mon profil','acceder a mon profil','mettre à jour ton profil','compléter ton profil','ton profil :'].some(p => aiText2.toLowerCase().includes(p))) {
        setTimeout(() => setView('profil'), 1500);
      }
      if (data.user) {
        const u = data.user;
        localStorage.setItem('opps_user', JSON.stringify(u));
        setUser(u);
        conversationId.current = `chat-${u.id}`;
      }
      const aiText = data.output || data.message || data.text || '';
      if (aiText) {
        setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
        axiosInstance.post(API_ROUTES.messages.create, {
          text: aiText, role: 'assistant', conversationId: conversationId.current,
        }).then(() => setTimeout(() => fetchMessages(), 1500))
          .catch(e => console.warn('Save AI msg:', e.message));
      }
    } catch (err) {
      setServerStatus(s => ({ ...s, n8n: false }));
      let msg = '';
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        msg = '⏳ **Temps dépassé.** L\'IA est occupée, réessaie dans quelques secondes.';
      } else if (err.message?.includes('Network Error')) {
        msg = `🔌 **Serveur n8n inaccessible.**\n\nVérifie que n8n tourne sur \`localhost:5678\` et que le workflow est activé.`;
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
    view, setView, serverStatus,
    onOpenBourse: (nom) => { setInitialSelected(nom); setView('bourses'); },
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
        onOpenBourse={(nom) => { setInitialSelected(nom); setView('bourses'); }}
      />

      {serverStatus.payload === false && (
        <div className="server-alert">
          ⚠️ <strong>Payload CMS hors ligne</strong> — Lance ton backend sur le port 3000
          &nbsp;·&nbsp;
          <button onClick={() => window.location.reload()}
            style={{ background:'none', border:'none', color:'#b91c1c', cursor:'pointer', textDecoration:'underline', fontWeight:600 }}>
            Réessayer
          </button>
        </div>
      )}

      <main className="main-content">
        {view === 'accueil'         && <ChatPage             {...sharedProps} />}
        {view === 'bourses'         && <BoursesPage          {...sharedProps} initialSelected={initialSelected} onClearInitialSelected={() => setInitialSelected(null)} />}
        {view === 'recommandations' && <RecommandationsPage  {...sharedProps} />}
        {view === 'roadmap'         && <RoadmapPage          {...sharedProps} />}
        {view === 'dashboard'       && <DashboardPage        {...sharedProps} />}
        {view === 'profil'          && <ProfilPage           {...sharedProps} />}
        {view === 'entretien'       && <EntretienPage        {...sharedProps} />}
        {view === 'cv'              && <CVPage               {...sharedProps} />}
      </main>

      <Footer setView={setView} />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          background: #f8f9fc !important;
        }
        body {
          font-family: 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif;
          color: #1a3a6b;
          -webkit-font-smoothing: antialiased;
        }
        #root {
          min-height: 100vh;
          background: #f8f9fc !important;
        }

        /* ── LAYOUT ─────────────────────────────── */
        .app-root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #f8f9fc;
          padding-top: 97px; /* topbar 29px + mainbar 68px */
        }
        .main-content {
          flex: 1;
          overflow-x: hidden;
          background: #f8f9fc;
        }

        /* ── SERVER ALERT ───────────────────────── */
        .server-alert {
          background: #fff3cd;
          border-bottom: 2px solid #f5a623;
          color: #856404;
          padding: 10px 24px;
          font-size: 13px;
          text-align: center;
          font-weight: 500;
        }

        /* ── SCROLLBAR ──────────────────────────── */
        ::-webkit-scrollbar       { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        ::selection { background: #dbeafe; color: #1a3a6b; }

        /* ── FOOTER ─────────────────────────────── */
        .footer {
          background: #1a3a6b;
          border-top: 3px solid #f5a623;
          padding: 48px 32px 24px;
          margin-top: 0;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
        }
        .footer-col { display: flex; flex-direction: column; gap: 14px; }
        .footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .footer-logo img {
          width: 40px; height: 40px;
          object-fit: contain; border-radius: 6px;
          background: #fff; padding: 2px;
        }
        .footer-logo-text {
          font-size: 1.1rem; font-weight: 800;
          color: #fff; letter-spacing: 1px;
        }
        .footer-logo-sub {
          font-size: 9px; color: #f5a623;
          font-weight: 500; letter-spacing: 0.5px;
          text-transform: uppercase; display: block;
        }
        .footer-desc { color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.6; margin: 0; }
        .footer-social { display: flex; gap: 12px; margin-top: 4px; }
        .social-link {
          width: 32px; height: 32px; border-radius: 6px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.6); font-size: 14px;
          transition: all 0.2s; text-decoration: none;
        }
        .social-link:hover {
          background: #f5a623; border-color: #f5a623; color: #1a3a6b;
        }
        .footer-heading {
          font-size: 12px; font-weight: 700; color: #f5a623;
          margin: 0 0 6px 0; letter-spacing: 1px;
          text-transform: uppercase;
        }
        .footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .footer-links li a {
          color: rgba(255,255,255,0.6); text-decoration: none;
          font-size: 13px; transition: color 0.2s;
        }
        .footer-links li a:hover { color: #f5a623; }
        .footer-bottom {
          max-width: 1200px; margin: 32px auto 0; padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px; font-size: 12px;
          color: rgba(255,255,255,0.4);
        }
        .footer-bottom p { margin: 0; }
        .footer-legal { display: flex; gap: 12px; align-items: center; }
        .footer-legal a { color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.2s; }
        .footer-legal a:hover { color: #f5a623; }
        .footer-legal span { color: rgba(255,255,255,0.15); }

        @media (max-width: 768px) {
          .app-root { padding-top: 68px; }
          .footer { padding: 40px 20px 24px; }
          .footer-container { grid-template-columns: 1fr; gap: 28px; }
          .footer-bottom { flex-direction: column; text-align: center; }
          .footer-legal { justify-content: center; }
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
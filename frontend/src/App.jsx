import React, { useState, useEffect, useRef, useCallback , useMemo} from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar, { ThemeProvider, useTheme } from './components/Navbar'; // ← Ajoutez useTheme ici
import ChatToggleButton from './components/ChatToggleButton'; // ← Import du bouton chat
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
import ContactPage from "./pages/ContactPage";
import { AppProviders, useT } from './i18n';
import StudentFeedback from './components/StudentFeedback';
import GuestPage from './GuestPage';
import HomePage from './pages/HomePage';


const tokens = (theme) => ({
  accent:     theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentInk:  theme === "dark" ? "#8ec1e6" : "#004f8a",
  ink:        theme === "dark" ? "#f2efe7" : "#141414",
  ink2:       theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:       theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:       theme === "dark" ? "#6d6b64" : "#9a9794",
  paper:      theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:     theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule:       theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:   theme === "dark" ? "#24231c" : "#e8e4d9",
  surface:    theme === "dark" ? "#1a1912" : "#ffffff",
  danger:     "#b4321f",
  warn:       "#b06a12",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"DM Sans", monospace`,
});
function AppContent() {
  const { t, lang, setLang } = useT();
  const { theme } = useTheme();  // ← AJOUTE CETTE LIGNE
  const c = tokens(theme);  
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
  const [roadmapData, setRoadmapData] = useState([]);
  const [serverStatus, setServerStatus]       = useState({ n8n: null, payload: null });
  const [cvContext, setCvContext]             = useState('cv');
  const [showFloatChat, setShowFloatChat]     = useState(false); // ← État pour le chat

  const chatContainerRef = useRef(null);
  const historyLoaded    = useRef(false);
  const floatContainerRef = useRef(null);
  const [showFloatScroll, setShowFloatScroll] = useState(false);

  const conversationId = useRef(null);
  if (!conversationId.current) {
    const saved = sessionStorage.getItem('opps_conv_id');
    conversationId.current = saved || `chat-guest-${Date.now()}`;
    if (!saved) sessionStorage.setItem('opps_conv_id', conversationId.current);
  }

  // ... (garde tous tes useEffect existants) ...

  useEffect(() => {
    const saved = localStorage.getItem('opps_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        conversationId.current = `chat-${u.id}`;
        axiosInstance.get(API_ROUTES.users.byId(u.id), { params: { depth: 2 } })
          .then(res => {
            const fullUser = res.data;
            setUser(fullUser);
            localStorage.setItem('opps_user', JSON.stringify(fullUser));
          })
          .catch(() => {});
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

  const fetchRoadmap = useCallback(async () => {
  if (!user?.id) return;
  try {
    const res = await axiosInstance.get(API_ROUTES.roadmap.byUser(user.id), {
      signal: AbortSignal.timeout(5000),
    });
    setRoadmapData(res.data.docs || []);
  } catch (e) { console.warn('Roadmap:', e.message); }
}, [user]);


  useEffect(() => {
    if (!historyLoaded.current) {
      historyLoaded.current = true;
      fetchMessages();
    }
    fetchBourses();
  }, [fetchMessages, fetchBourses]);

  useEffect(() => { fetchEntretienScores(); }, [fetchEntretienScores]);
  useEffect(() => { fetchRoadmap(); }, [fetchRoadmap]);

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
      const n8nRes = await axios.post('http://localhost:5678/webhook/webhook', {
        text: textToSend,
        conversationId: conversationId.current,
        id: user?.id || null,
        email: user?.email || null,
        context: options.context || null,
        pays: user?.pays || '',
        niveau: user?.niveau || '',
        domaine: user?.domaine || '',
        user_profile: user ? {
          pays: user.pays, niveau: user.niveau, domaine: user.domaine, name: user.name,
          is_complete: !!(user.pays && user.niveau && user.domaine),
        } : null,
      }, { headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(120000) });

      setServerStatus(s => ({ ...s, n8n: true }));
      const data = n8nRes.data || {};
      if (data.currentStep !== undefined) setCurrentStep(data.currentStep);
      if (data.view) setView(data.view);

      if (data.user) {
        const u = data.user;
        localStorage.setItem('opps_user', JSON.stringify(u));
        setUser(u);
        conversationId.current = `chat-${u.id}`;
      }

      const aiText = data.output || data.message || data.text || '';

      if (['accéder à mon profil','acceder a mon profil','mettre à jour ton profil',
           'compléter ton profil','ton profil :'].some(p => aiText.toLowerCase().includes(p))) {
        setTimeout(() => setView('profil'), 1500);
      }

      try {
        const parsed = JSON.parse(aiText);
        if (parsed?.action === 'redirect_cv') {
          const msg = parsed.message || aiText;
          setMessages(prev => [...prev, { sender: 'ai', text: msg }]);
          axiosInstance.post(API_ROUTES.messages.create, {
            text: msg, role: 'assistant',
            conversationId: conversationId.current,
          }).catch(e => console.warn('Save AI msg:', e.message));
          setCvContext(parsed.context === 'generate_lm' ? 'lm' : 'cv');
          setTimeout(() => setView('cv'), 2000);
          return;
        }
      } catch (_) {}

      const cvRedirectPhrases = [
        'je vous redirige vers votre espace cv',
        'redirige vers votre espace cv',
        'espace cv & lm',
        'votre espace cv',
      ];
      const isRedirectText = cvRedirectPhrases.some(p =>
        aiText.toLowerCase().includes(p)
      );
      if (isRedirectText) {
        setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
        axiosInstance.post(API_ROUTES.messages.create, {
          text: aiText, role: 'assistant',
          conversationId: conversationId.current,
        }).catch(e => console.warn('Save AI msg:', e.message));
        const isLM = aiText.toLowerCase().includes('lettre de motivation');
        setCvContext(isLM ? 'lm' : 'cv');
        setTimeout(() => setView('cv'), 2000);
        return;
      }

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

  useEffect(() => {
    const handler = (event) => {
      const { message } = event.detail;
      if (!showFloatChat) {
        setShowFloatChat(true);
        setTimeout(() => handleSend(message), 200);
      } else {
        handleSend(message);
      }
    };
    window.addEventListener('openChatWithMessage', handler);
    return () => window.removeEventListener('openChatWithMessage', handler);
  }, [showFloatChat, handleSend]);

  useEffect(() => {
    if (showFloatChat && floatContainerRef.current) {
      floatContainerRef.current.scrollTop = floatContainerRef.current.scrollHeight;
    }
  }, [messages, loading, showFloatChat]);

  useEffect(() => {
    if (!showFloatChat) return;
    const el = floatContainerRef.current;
    if (!el) return;
    const checkScroll = () => {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowFloatScroll(!isNearBottom);
    };
    el.addEventListener('scroll', checkScroll);
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, [showFloatChat]);

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
    view, setView, serverStatus,lang,setLang,roadmapData,
  setRoadmapData,
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
<div className={`app-root ${view === 'contact' || view === 'feedback' ? 'no-navbar' : ''} ${view === 'Home' ? 'view-home' : ''}`}>
        {/* Navbar - avec onToggleChat */}
      {view !== 'contact' && view !== 'feedback' && (
        <Navbar
          view={view}
          setView={setView}
          user={user}
          onLogout={handleLogout}
          serverStatus={serverStatus}
          onOpenBourse={(nom) => { setInitialSelected(nom); setView('bourses'); }}
          onToggleChat={() => setShowFloatChat(prev => !prev)}  // ← AJOUTÉ !
        />
      )}

      {/* Alerte serveur */}
      {serverStatus.payload === false && view !== 'contact' && view !== 'feedback' && (
        <div className="server-alert">
          ⚠️ <strong>Payload CMS hors ligne</strong> — Lance ton backend sur le port 3000
          &nbsp;·&nbsp;
          <button onClick={() => window.location.reload()}
            style={{ background:'none', border:'none', color:'#b91c1c', cursor:'pointer', textDecoration:'underline', fontWeight:600 }}>
            Réessayer
          </button>
        </div>
      )}

<main className={`main-content ${view === 'contact' ? 'contact-main' : ''}`}>
  {/* Accueil : assistant IA pour tous */}
  {view === 'accueil' && <ChatPage {...sharedProps} />}

  {/* Home : GuestPage si invité, HomePage si connecté */}
  {view === 'Home' && (
    user ? (
      <HomePage {...sharedProps} />
    ) : (
      <GuestPage bourses={bourses} onSignup={() => {}} setView={setView} />
    )
  )}

  {/* Autres vues */}
  {view === 'bourses'         && <BoursesPage {...sharedProps} initialSelected={initialSelected} onClearInitialSelected={() => setInitialSelected(null)} />}
  {view === 'recommandations' && <RecommandationsPage {...sharedProps} />}
  {view === 'roadmap'         && <RoadmapPage {...sharedProps} />}
  {view === 'dashboard'       && <DashboardPage {...sharedProps} />}
  {view === 'profil'          && <ProfilPage {...sharedProps} />}
  {view === 'entretien'       && <EntretienPage {...sharedProps} />}
  {view === 'cv'              && <CVPage {...sharedProps} initialTab={cvContext} />}
  {view === 'contact'         && <ContactPage setView={setView} user={user} />}
  {view === 'feedback'        && <StudentFeedback setView={setView} user={user} />}
</main>

      {/* ChatToggleButton - UN SEUL BOUTON */}
      {view !== 'accueil' && (
  <ChatToggleButton
    isOpen={showFloatChat}
    onClick={() => setShowFloatChat(prev => !prev)}
    position="bottom-right"
    offsetX={24}
    offsetY={24}
    showBadge={messages.filter(m => m.sender === 'ai' && !m.read).length > 0}
    badgeCount={messages.filter(m => m.sender === 'ai' && !m.read).length}
  />
)}

      {/* Chat flottant */}
      {showFloatChat && view !== 'accueil' && (
  <div style={{
    position: 'fixed', bottom: 90, right: 24, width: 400,
    maxWidth: 'calc(100vw - 48px)', height: 560,
    background: c.paper,
    borderRadius: 0,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex', flexDirection: 'column', zIndex: 1000,
    overflow: 'hidden',
    border: `1px solid ${c.rule}`,
    fontFamily: c.fSans,
  }}>
    {/* Header */}
    <div style={{
      background: c.accent,
      color: c.paper,
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${c.rule}`,
    }}>
      <div>
        <span style={{
          fontFamily: c.fSerif,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.01em',
        }}>
          Assistant IA
        </span>
        <span style={{
          fontFamily: c.fMono,
          fontSize: 10,
          marginLeft: 12,
          opacity: 0.8,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          OppsTrack
        </span>
      </div>
      <button
        onClick={() => setShowFloatChat(false)}
        style={{
          background: 'none',
          border: 'none',
          color: c.paper,
          fontSize: 20,
          cursor: 'pointer',
          padding: '0 4px',
          opacity: 0.8,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
      >
        ✕
      </button>
    </div>

    {/* Messages */}
    <div
      ref={floatContainerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        position: 'relative',
        background: c.paper,
      }}
    >
      {messages.length === 0 && (
        <div style={{
          textAlign: 'center',
          color: c.ink3,
          marginTop: 60,
          fontFamily: c.fSans,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          <div style={{
            marginBottom: 12,
            fontSize: 32,
            color: c.accent,
            opacity: 0.5,
          }}>
            ⌨️
          </div>
          <div style={{ fontFamily: c.fSerif, fontSize: 16, color: c.ink2, marginBottom: 8 }}>
            Assistant IA OppsTrack
          </div>
          <p>
            Analyse de profil, recommandations de bourses,<br />
            conseils personnalisés.
          </p>
        </div>
      )}
      {messages.map((msg, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: msg.sender === 'user' ? c.accent : c.paper2,
              color: msg.sender === 'user' ? c.paper : c.ink,
              padding: '10px 16px',
              borderRadius: 0,
              maxWidth: '85%',
              fontSize: 13,
              lineHeight: 1.5,
              fontFamily: c.fSans,
              border: msg.sender === 'user' ? 'none' : `1px solid ${c.ruleSoft}`,
              letterSpacing: '0.01em',
            }}
          >
            {msg.text}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
          <div style={{
            background: c.paper2,
            color: c.ink2,
            padding: '10px 16px',
            borderRadius: 0,
            fontSize: 12,
            fontFamily: c.fMono,
            border: `1px solid ${c.ruleSoft}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              background: c.accent,
              borderRadius: '50%',
              animation: 'pulse 1.2s infinite',
            }} />
            <span style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              background: c.accent,
              borderRadius: '50%',
              animation: 'pulse 1.2s infinite 0.2s',
            }} />
            <span style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              background: c.accent,
              borderRadius: '50%',
              animation: 'pulse 1.2s infinite 0.4s',
            }} />
            <span style={{ marginLeft: 4 }}>
              {lang === 'fr' ? 'L\'IA réfléchit...' : 'AI is thinking...'}
            </span>
          </div>
        </div>
      )}
      {showFloatScroll && (
        <button
          onClick={() => floatContainerRef.current?.scrollTo({ top: floatContainerRef.current.scrollHeight, behavior: 'smooth' })}
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 0,
            background: c.accent,
            border: 'none',
            color: c.paper,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
            fontFamily: c.fMono,
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ↓
        </button>
      )}
    </div>

    {/* Input */}
    <div style={{
      padding: '16px 20px',
      borderTop: `1px solid ${c.rule}`,
      background: c.surface,
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend(input)}
          placeholder={lang === 'fr' ? 'Écrivez votre message...' : 'Type your message...'}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: `1px solid ${c.ruleSoft}`,
            borderRadius: 0,
            outline: 'none',
            fontFamily: c.fSans,
            fontSize: 13,
            background: c.paper,
            color: c.ink,
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = c.accent}
          onBlur={e => e.target.style.borderColor = c.ruleSoft}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={loading || !input.trim()}
          style={{
            background: c.accent,
            border: 'none',
            borderRadius: 0,
            padding: '10px 20px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontFamily: c.fMono,
            fontSize: 11,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: c.paper,
            transition: 'all 0.2s',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
          onMouseEnter={e => {
            if (!loading && input.trim()) {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {lang === 'fr' ? 'Envoyer' : 'Send'}
        </button>
      </div>
    </div>

    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }
    `}</style>
  </div>
      )}

      {/* Footer */}
      {view !== 'contact' && view !== 'feedback' && <Footer setView={setView} />}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #f8f9fc !important; }
        body {
          font-family: 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif;
          color: #1a3a6b; -webkit-font-smoothing: antialiased;
        }
        #root { min-height: 100vh; background: #f8f9fc !important; }
.app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8f9fc;
  padding-top: 97px;
}

/* HomePage : le hero doit commencer à top:0 derrière la navbar transparente */
.app-root.view-home {
  padding-top: 0 !important;
}        .main-content { flex: 1; overflow-x: hidden; background: #f8f9fc; }
        .server-alert {
          background: #fff3cd; border-bottom: 2px solid #f5a623;
          color: #856404; padding: 10px 24px; font-size: 13px;
          text-align: center; font-weight: 500;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        ::selection { background: #dbeafe; color: #1a3a6b; }
        .footer { background: #1a3a6b; border-top: 3px solid #f5a623; padding: 48px 32px 24px; margin-top: 0; font-family: 'Segoe UI', system-ui, sans-serif; }
        .footer-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; }
        .footer-col { display: flex; flex-direction: column; gap: 14px; }
        .footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .footer-logo img { width: 40px; height: 40px; object-fit: contain; border-radius: 6px; background: #fff; padding: 2px; }
        .footer-logo-text { font-size: 1.1rem; font-weight: 800; color: #fff; letter-spacing: 1px; }
        .footer-logo-sub { font-size: 9px; color: #f5a623; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; display: block; }
        .footer-desc { color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.6; margin: 0; }
        .footer-social { display: flex; gap: 12px; margin-top: 4px; }
        .social-link { width: 32px; height: 32px; border-radius: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.6); font-size: 14px; transition: all 0.2s; text-decoration: none; }
        .social-link:hover { background: #f5a623; border-color: #f5a623; color: #1a3a6b; }
        .footer-heading { font-size: 12px; font-weight: 700; color: #f5a623; margin: 0 0 6px 0; letter-spacing: 1px; text-transform: uppercase; }
        .footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .footer-links li a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 13px; transition: color 0.2s; }
        .footer-links li a:hover { color: #f5a623; }
        .footer-bottom { max-width: 1200px; margin: 32px auto 0; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; font-size: 12px; color: rgba(255,255,255,0.4); }
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
        .app-root.no-navbar {
          padding-top: 0 !important;
        }
        .main-content.contact-main {
          padding-top: 0 !important;
        }
        .no-navbar .navbar,
        .no-navbar .footer,
        .no-navbar .server-alert {
          display: none !important;
        }
          
      `}</style>
    </div>
  );
}

// ==================== EXPORT PRINCIPAL AVEC THEME PROVIDER ====================
export default function App() {
  return (
    <AppProviders>
      <ThemeProvider>  {/* ← AJOUTÉ ! */}
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </AppProviders>
  );
  
}
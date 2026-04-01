import React, { useState, useEffect } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';

const navItems = [
  { id: 'accueil',         label: 'IA Chat'         },
  { id: 'bourses',         label: 'Bourses'         },
  { id: 'recommandations', label: 'Recommandations' },
  { id: 'roadmap',         label: 'Roadmap'         },
  { id: 'entretien',       label: 'Entretien'       },
  { id: 'cv',              label: 'CV & LM'         },
  { id: 'dashboard',       label: 'Dashboard'       },
  { id: 'profil',          label: 'Profil'          },
];

function useDeadlineAlerts(user) {
  const [alerts,    setAlerts]    = useState([]);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!user?.id) { setAlerts([]); return; }

    const checkDeadlines = async () => {
      try {
        const resUser        = await axiosInstance.get(API_ROUTES.users.byId(user.id), { params: { depth: 0 } });
        const boursesSuivies = resUser.data.bourses_choisies || [];
        const nomsChoisis    = boursesSuivies.map(b => b.nom?.toLowerCase().trim());

        const resBourses = await axiosInstance.get(API_ROUTES.bourses.list, { params: { limit: 100, depth: 0 } });
        const now        = new Date();

        const parseDeadline = (val) => {
          if (!val) return null;
          if (typeof val === 'number') return new Date(val);
          const s = String(val).trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
          const d = new Date(s);
          return isNaN(d) ? null : d;
        };

        const urgent = (resBourses.data.docs || [])
          .filter(b => nomsChoisis.includes(b.nom?.toLowerCase().trim()))
          .map(b => {
            const dl = parseDeadline(b.dateLimite);
            if (!dl || isNaN(dl)) return null;
            const days = Math.round((dl - now) / 86400000);
            return { nom: b.nom, pays: b.pays, deadline: dl, days };
          })
          .filter(b => b && b.days >= 0 && b.days <= 30);

        setAlerts(urgent);

        const critical = urgent.filter(a => a.days <= 7);
        if (critical.length > 0 && !emailSent && user.email) {
          setEmailSent(true);
          axiosInstance.post(WEBHOOK_ROUTES.chat, {
            text:      `Alerte deadline : ${critical.map(a => `${a.nom} (${a.days}j)`).join(', ')}`,
            context:   'deadline_alert',
            id:        user.id,
            email:     user.email,
            deadlines: critical,
          }).catch(() => {});
        }
      } catch {}
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 3600000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return alerts;
}

function useStarredBourses(user) {
  const [starred, setStarred] = useState([]);

  const reload = async () => {
    if (!user?.id) { setStarred([]); return; }
    try {
      const res = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id));
      setStarred(res.data.docs?.[0]?.bourses || []);
    } catch {}
  };

  useEffect(() => { reload(); }, [user?.id]);
  return { starred, reload };
}

function StarPanel({ starred, onClose, setView, starCount }) {
  const displayCount = starCount ?? starred.length;
  return (
    <div style={P.panel}>
      <div style={P.head}>
        <span style={P.title}>★ Mes favoris ({displayCount})</span>
        <button style={P.closeBtn} onClick={onClose}>✕</button>
      </div>
      {starred.length === 0 ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>☆</div>
          Aucun favori — cliquez sur ★ dans les recommandations
        </div>
      ) : (
        <div style={{ padding: '8px 0', maxHeight: 280, overflowY: 'auto' }}>
          {starred.map((b, i) => (
            <div
              key={i}
              style={{ ...P.item, cursor: 'pointer', borderRadius: 8 }}
              onClick={() => { setView('bourses'); onClose(); }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, lineHeight: 1.3 }}>
                  {b.nom}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {b.pays}
                </div>
              </div>
              {b.lienOfficiel && (
                <a
                  href={b.lienOfficiel}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => { e.stopPropagation(); }}
                  style={{ fontSize: 11, color: '#818cf8', textDecoration: 'none', padding: '3px 8px', background: 'rgba(99,102,241,0.12)', borderRadius: 6, flexShrink: 0 }}
                >
                  Voir
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotifPanel({ alerts, onClose, setView }) {
  if (alerts.length === 0) {
    return (
      <div style={P.panel}>
        <div style={P.head}>
          <span style={P.title}>Notifications</span>
          <button style={P.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 13 }}>Aucune deadline urgente</div>
        </div>
      </div>
    );
  }

  return (
    <div style={P.panel}>
      <div style={P.head}>
        <span style={P.title}>Deadlines urgentes</span>
        <button style={P.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={{ padding: '8px 0' }}>
        {alerts.map((a, i) => {
          const color = a.days <= 7 ? '#f87171' : a.days <= 14 ? '#fbbf24' : '#a78bfa';
          const bg    = a.days <= 7 ? 'rgba(239,68,68,0.08)' : a.days <= 14 ? 'rgba(245,158,11,0.08)' : 'rgba(139,92,246,0.08)';
          return (
            <div key={i} style={{ ...P.item, background: bg, borderLeft: `3px solid ${color}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{a.nom}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {a.pays} · {a.deadline.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color }}>{a.days}j</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>restants</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          style={{ width: '100%', padding: '9px', borderRadius: 9, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 13, cursor: 'pointer' }}
          onClick={() => { setView('roadmap'); onClose(); }}
        >
          Voir la roadmap
        </button>
      </div>
    </div>
  );
}

const P = {
  panel:    { position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 300, background: '#0d0d22', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, zIndex: 200, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' },
  head:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  title:    { fontSize: 13, fontWeight: 700, color: '#e2e8f0' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 15 },
  item:     { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', margin: '2px 4px' },
};

export default function Navbar({ view, setView, user, onLogout, serverStatus, starCount }) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [starOpen,  setStarOpen]  = useState(false);

  const alerts              = useDeadlineAlerts(user);
  const { starred, reload } = useStarredBourses(user);
  const notifBadge          = alerts.length;
  const badge               = starCount ?? starred.length;

  useEffect(() => {
    if (!notifOpen && !starOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.notif-wrapper') && !e.target.closest('.star-wrapper')) {
        setNotifOpen(false);
        setStarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen, starOpen]);

  useEffect(() => { reload(); }, [view]);

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setView('accueil')} style={{ cursor: 'pointer' }}>
        <span className="brand-icon">🌍</span>
        <span className="brand-name">OppsTrack</span>
        {user && <span className="brand-badge">Pro</span>}
      </div>

      <div className="nav-items desktop-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${view === item.id ? 'active' : ''} ${item.id === 'recommandations' ? 'nav-item-reco' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>

        {user && (
          <div className="star-wrapper" style={{ position: 'relative' }}>
            <button
              onClick={() => { setStarOpen(o => !o); setNotifOpen(false); }}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 8, color: badge > 0 ? '#fbbf24' : '#64748b', fontSize: 18, lineHeight: 1, transition: 'color 0.2s' }}
              title={`${badge} favori(s)`}
            >
              ★
              {badge > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#f59e0b', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a0a14' }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
            {starOpen && (
              <StarPanel
                starred={starred}
                onClose={() => setStarOpen(false)}
                setView={setView}
                starCount={starCount}
              />
            )}
          </div>
        )}

        {user && (
          <div className="notif-wrapper" style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifOpen(o => !o); setStarOpen(false); }}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 8, color: notifBadge > 0 ? '#fbbf24' : '#64748b', fontSize: 18, lineHeight: 1, transition: 'color 0.2s' }}
              title={notifBadge > 0 ? `${notifBadge} deadline(s) urgente(s)` : 'Notifications'}
            >
              🔔
              {notifBadge > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a0a14', animation: 'pulse 2s infinite' }}>
                  {notifBadge > 9 ? '9+' : notifBadge}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotifPanel
                alerts={alerts}
                onClose={() => setNotifOpen(false)}
                setView={setView}
              />
            )}
          </div>
        )}

        <div className="nav-user">
          {user ? (
            <div className="user-pill">
              <div className="user-avatar">{(user.name || user.email || 'U')[0].toUpperCase()}</div>
              <span className="user-name">{user.name || user.email?.split('@')[0]}</span>
              <button className="logout-btn" onClick={onLogout} title="Déconnexion">↩</button>
            </div>
          ) : (
            <div className="guest-pill">
              <span className="guest-dot"></span>
              <span>Invité</span>
            </div>
          )}
        </div>
      </div>

      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`mobile-nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => { setView(item.id); setMenuOpen(false); }}
            >
              <span>{item.label}</span>
            </button>
          ))}
          {user && (
            <button className="mobile-nav-item logout" onClick={() => { onLogout(); setMenuOpen(false); }}>
              <span>↩</span><span>Déconnexion</span>
            </button>
          )}
        </div>
      )}

      <style>{`
        .navbar { position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:8px;padding:0 24px;height:60px;background:rgba(249, 249, 249, 0.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(99,102,241,0.2);box-shadow:0 4px 30px rgba(0,0,0,0.3); }
        .nav-brand { display:flex;align-items:center;gap:8px;margin-right:16px;flex-shrink:0; }
        .brand-icon { font-size:22px; }
        .brand-name { font-size:1.1rem;font-weight:800;letter-spacing:-0.5px;background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
        .brand-badge { background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px;letter-spacing:1px;text-transform:uppercase; }
        .desktop-nav { display:flex;gap:2px;flex:1; }
        .nav-item { display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:none;background:transparent;color:#94a3b8;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;white-space:nowrap; }
        .nav-item:hover { background:rgba(99,102,241,0.15);color:#e2e8f0; }
        .nav-item.active { background:rgba(99,102,241,0.25);color:#818cf8; }
        .nav-item-reco { color: #94a3b8; background: transparent; border: none; }
        .nav-item-reco:hover { background: rgba(99,102,241,0.15); color: #e2e8f0; }
        .nav-item-reco.active { background: rgba(99,102,241,0.25); color: #818cf8; }
        .nav-user { flex-shrink:0; }
        .user-pill { display:flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:24px; }
        .user-avatar { width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white; }
        .user-name { font-size:13px;color:#c4b5fd;font-weight:500; }
        .logout-btn { background:none;border:none;color:#64748b;cursor:pointer;font-size:14px;padding:2px 4px;border-radius:4px;transition:color 0.2s; }
        .logout-btn:hover { color:#ef4444; }
        .guest-pill { display:flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:24px;font-size:13px;color:#64748b; }
        .guest-dot { width:6px;height:6px;border-radius:50%;background:#64748b; }
        .hamburger { display:none;background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;padding:4px 8px; }
        .mobile-menu { display:none;position:fixed;top:60px;left:0;right:0;background:rgba(10,10,20,0.98);padding:16px;border-bottom:1px solid rgba(99,102,241,0.2);flex-direction:column;gap:4px;z-index:99; }
        .mobile-nav-item { display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;border:none;background:transparent;color:#94a3b8;font-size:15px;cursor:pointer;text-align:left;transition:all 0.2s; }
        .mobile-nav-item:hover,.mobile-nav-item.active { background:rgba(99,102,241,0.2);color:#818cf8; }
        .mobile-nav-item.logout { color:#ef4444; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.15)} }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media (max-width:768px) { .desktop-nav{display:none;} .hamburger{display:block;} .mobile-menu{display:flex;} .nav-user{display:none;} }
      `}</style>
    </nav>
  );
}
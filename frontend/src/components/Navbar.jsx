import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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

// ── Deadlines urgentes depuis roadmap ────────────────────────────────────────
function useDeadlineAlerts(user) {
  const [alerts, setAlerts] = useState([]);
  const sentRef = useRef(new Set());

  useEffect(() => {
    if (!user?.id) { setAlerts([]); return; }

    const check = async () => {
      try {
        const res  = await axiosInstance.get(API_ROUTES.roadmap.byUser(user.id));
        const docs = res.data.docs || [];
        const now  = new Date();

        const urgent = docs
          .map(b => {
            const raw = b.dateLimite || b.deadline || null;
            if (!raw) return null;
            const dl   = new Date(raw);
            if (isNaN(dl)) return null;
            const days = Math.round((dl - now) / 86400000);
            if (days < 0 || days > 30) return null;
            return { nom: b.nom, pays: b.pays || '', deadline: dl, days };
          })
          .filter(Boolean)
          .sort((a, b) => a.days - b.days);

        setAlerts(urgent);

        // ✅ axios direct (pas axiosInstance) pour éviter baseURL Payload + CORS
        for (const b of urgent) {
          const seuil = [1, 7, 14, 30].find(s => b.days <= s);
          if (!seuil) continue;
          const key = `${b.nom}__${seuil}`;
          if (sentRef.current.has(key)) continue;
          sentRef.current.add(key);
          axios.post(WEBHOOK_ROUTES.chat, {
            context:   'deadline_alert',
            id:        user.id,
            email:     user.email,
            userName:  user.name || user.email?.split('@')[0] || '',
            text:      'deadline_alert',
            deadlines: [{ nom: b.nom, pays: b.pays, deadline: b.deadline.toISOString(), days: b.days }],
          }, { headers: { 'Content-Type': 'application/json' } }).catch(() => {});
        }
      } catch {}
    };

    check();
    const t = setInterval(check, 3600000);
    return () => clearInterval(t);
  }, [user?.id]);

  return alerts;
}

// ── Favoris ───────────────────────────────────────────────────────────────────
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

// ── Panel Favoris ─────────────────────────────────────────────────────────────
function StarPanel({ starred, onClose, setView }) {
  return (
    <div style={P.panel}>
      <div style={P.head}>
        <span style={P.title}>★ Mes favoris ({starred.length})</span>
        <button style={P.closeBtn} onClick={onClose}>✕</button>
      </div>
      {starred.length === 0 ? (
        <div style={{ padding:'28px 20px', textAlign:'center', color:'#64748b', fontSize:13 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>☆</div>
          Aucun favori pour l'instant
        </div>
      ) : (
        <div style={{ padding:'8px 0', maxHeight:300, overflowY:'auto' }}>
          {starred.map((b, i) => (
            <div key={i} style={{ ...P.item, cursor:'pointer', borderRadius:8 }}
              onClick={() => { setView('bourses'); onClose(); }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600 }}>{b.nom}</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{b.pays}</div>
              </div>
              {b.lienOfficiel && (
                <a href={b.lienOfficiel} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize:11, color:'#818cf8', textDecoration:'none', padding:'3px 8px', background:'rgba(99,102,241,0.12)', borderRadius:6 }}>
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

// ── Panel Notifications — seulement deadlines ─────────────────────────────────
function NotifPanel({ alerts, onClose, setView, onSelectBourse }) {
  return (
    <div style={{ ...P.panel, width:340 }}>
      <div style={P.head}>
        <span style={P.title}>🔔 Deadlines urgentes {alerts.length > 0 ? `(${alerts.length})` : ''}</span>
        <button style={P.closeBtn} onClick={onClose}>✕</button>
      </div>

      {alerts.length === 0 ? (
        <div style={{ padding:'32px 20px', textAlign:'center', color:'#64748b' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
          <div style={{ fontSize:13 }}>Aucune deadline dans les 30 prochains jours</div>
        </div>
      ) : (
        <>
          <div style={{ maxHeight:380, overflowY:'auto' }}>
            {alerts.map((a, i) => {
              const color = a.days <= 1 ? '#f87171'
                          : a.days <= 7  ? '#fb923c'
                          : a.days <= 14 ? '#fbbf24'
                          : '#a78bfa';
              const bg    = a.days <= 1 ? 'rgba(248,113,113,0.08)'
                          : a.days <= 7  ? 'rgba(251,146,60,0.08)'
                          : a.days <= 14 ? 'rgba(251,191,36,0.08)'
                          : 'rgba(167,139,250,0.08)';
              const label = a.days === 0 ? "Aujourd'hui !"
                          : a.days === 1 ? 'Demain !'
                          : `${a.days} jours restants`;
              return (
                <div key={i}
                  onClick={() => {
                    onSelectBourse(a.nom);
                    setView('bourses');
                    onClose();
                  }}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px', margin:'3px 6px', borderRadius:10,
                    background:bg, borderLeft:`3px solid ${color}`,
                    cursor:'pointer', transition:'filter 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter='brightness(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.filter=''}
                >
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600, lineHeight:1.3 }}>{a.nom}</div>
                    <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>
                      {a.pays} · {a.deadline.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color, lineHeight:1 }}>{label}</div>
                    <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>→ voir détails</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <button style={P.actionBtn} onClick={() => { setView('roadmap'); onClose(); }}>
              Voir la Roadmap →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const P = {
  panel:     { position:'absolute', top:'calc(100% + 8px)', right:0, width:300, background:'#0d0d22', border:'1px solid rgba(99,102,241,0.25)', borderRadius:14, zIndex:200, boxShadow:'0 20px 50px rgba(0,0,0,0.5)', overflow:'hidden' },
  head:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  title:     { fontSize:13, fontWeight:700, color:'#e2e8f0' },
  closeBtn:  { background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:15 },
  item:      { display:'flex', alignItems:'center', gap:12, padding:'10px 16px', margin:'2px 4px' },
  actionBtn: { width:'100%', padding:'9px', borderRadius:8, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:12, cursor:'pointer', fontWeight:600 },
};

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar({ view, setView, user, onLogout, serverStatus, starCount, onOpenBourse }) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [starOpen,  setStarOpen]  = useState(false);

  const alerts              = useDeadlineAlerts(user);
  const { starred, reload } = useStarredBourses(user);

  const notifBadge = alerts.length;
  const badge      = starCount ?? starred.length;

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
      <div className="nav-brand" onClick={() => setView('accueil')} style={{ cursor:'pointer' }}>
        <span className="brand-icon">🌍</span>
        <span className="brand-name">OppsTrack</span>
        {user && <span className="brand-badge">Pro</span>}
      </div>

      <div className="nav-items desktop-nav">
        {navItems.map(item => (
          <button key={item.id}
            className={`nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto', flexShrink:0 }}>

        {/* ★ Favoris */}
        {user && (
          <div className="star-wrapper" style={{ position:'relative' }}>
            <button onClick={() => { setStarOpen(o => !o); setNotifOpen(false); }}
              style={{ position:'relative', background:'none', border:'none', cursor:'pointer', padding:'6px', borderRadius:8, color: badge > 0 ? '#fbbf24' : '#64748b', fontSize:18, lineHeight:1 }}>
              ★
              {badge > 0 && <span style={badgeSt('#f59e0b')}>{badge > 9 ? '9+' : badge}</span>}
            </button>
            {starOpen && <StarPanel starred={starred} onClose={() => setStarOpen(false)} setView={setView} />}
          </div>
        )}

        {/* 🔔 Notifications deadlines */}
        {user && (
          <div className="notif-wrapper" style={{ position:'relative' }}>
            <button onClick={() => { setNotifOpen(o => !o); setStarOpen(false); }}
              style={{ position:'relative', background:'none', border:'none', cursor:'pointer', padding:'6px', borderRadius:8, color: notifBadge > 0 ? '#f87171' : '#64748b', fontSize:18, lineHeight:1 }}>
              🔔
              {notifBadge > 0 && (
                <span style={{ ...badgeSt('#ef4444'), animation:'pulse 2s infinite' }}>
                  {notifBadge > 9 ? '9+' : notifBadge}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotifPanel
                alerts={alerts}
                onClose={() => setNotifOpen(false)}
                setView={setView}
                onSelectBourse={(nom) => {
                  if (onOpenBourse) onOpenBourse(nom);
                  else setView('bourses');
                }}
              />
            )}
          </div>
        )}

        {/* User */}
        <div className="nav-user">
          {user ? (
            <div className="user-pill">
              <div className="user-avatar">{(user.name || user.email || 'U')[0].toUpperCase()}</div>
              <span className="user-name">{user.name || user.email?.split('@')[0]}</span>
              <button className="logout-btn" onClick={onLogout}>↩</button>
            </div>
          ) : (
            <div className="guest-pill">
              <span className="guest-dot" />
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
            <button key={item.id}
              className={`mobile-nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => { setView(item.id); setMenuOpen(false); }}>
              {item.label}
            </button>
          ))}
          {user && (
            <button className="mobile-nav-item logout" onClick={() => { onLogout(); setMenuOpen(false); }}>
              ↩ Déconnexion
            </button>
          )}
        </div>
      )}

      <style>{`
        .navbar{position:sticky;top:0;z-index:100;display:flex;align-items:center;gap:8px;padding:0 24px;height:60px;background:rgba(251, 251, 254, 0.97);backdrop-filter:blur(20px);border-bottom:1px solid rgba(99,102,241,0.2);box-shadow:0 4px 30px rgba(0,0,0,0.3);}
        .nav-brand{display:flex;align-items:center;gap:8px;margin-right:16px;flex-shrink:0;}
        .brand-icon{font-size:22px;}
        .brand-name{font-size:1.1rem;font-weight:800;background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .brand-badge{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;}
        .desktop-nav{display:flex;gap:2px;flex:1;}
        .nav-item{display:flex;align-items:center;padding:6px 12px;border-radius:8px;border:none;background:transparent;color:#94a3b8;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
        .nav-item:hover{background:rgba(99,102,241,0.15);color:#e2e8f0;}
        .nav-item.active{background:rgba(99,102,241,0.25);color:#818cf8;}
        .user-pill{display:flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:24px;}
        .user-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;}
        .user-name{font-size:13px;color:#c4b5fd;font-weight:500;}
        .logout-btn{background:none;border:none;color:#64748b;cursor:pointer;font-size:14px;padding:2px 4px;}
        .logout-btn:hover{color:#ef4444;}
        .guest-pill{display:flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:24px;font-size:13px;color:#64748b;}
        .guest-dot{width:6px;height:6px;border-radius:50%;background:#64748b;}
        .hamburger{display:none;background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;padding:4px 8px;}
        .mobile-menu{display:none;position:fixed;top:60px;left:0;right:0;background:rgba(10,10,20,0.98);padding:16px;border-bottom:1px solid rgba(99,102,241,0.2);flex-direction:column;gap:4px;z-index:99;}
        .mobile-nav-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;border:none;background:transparent;color:#94a3b8;font-size:15px;cursor:pointer;text-align:left;transition:all 0.2s;}
        .mobile-nav-item:hover,.mobile-nav-item.active{background:rgba(99,102,241,0.2);color:#818cf8;}
        .mobile-nav-item.logout{color:#ef4444;}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.8;transform:scale(1.2)}}
        @media(max-width:768px){.desktop-nav{display:none;}.hamburger{display:block;}.mobile-menu{display:flex;}.nav-user{display:none;}}
      `}</style>
    </nav>
  );
}

const badgeSt = (bg) => ({
  position:'absolute', top:2, right:2, width:16, height:16,
  borderRadius:'50%', background:bg, color:'#fff',
  fontSize:9, fontWeight:800, display:'flex',
  alignItems:'center', justifyContent:'center',
  border:'2px solid #0a0a14',
});
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';

// Nav items avec traduction
const getNavItems = (t) => [
  { id: 'accueil',         label: t('navbar', 'chat') },
  { id: 'bourses',         label: t('navbar', 'bourses') },
  { id: 'recommandations', label: 'Recommandations' },
  { id: 'roadmap',         label: t('navbar', 'roadmap') },
  { id: 'entretien',       label: t('navbar', 'entretien') },
  { id: 'cv',              label: 'CV & LM' },
  { id: 'dashboard',       label: t('navbar', 'dashboard') },
  { id: 'profil',          label: t('navbar', 'profil') },
];

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
        const urgent = docs.map(b => {
          const raw = b.dateLimite || b.deadline || null;
          if (!raw) return null;
          const dl   = new Date(raw);
          if (isNaN(dl)) return null;
          const days = Math.round((dl - now) / 86400000);
          if (days < 0 || days > 30) return null;
          return { nom: b.nom, pays: b.pays || '', deadline: dl, days };
        }).filter(Boolean).sort((a, b) => a.days - b.days);
        setAlerts(urgent);
        for (const b of urgent) {
          const seuil = [1, 7, 14, 30].find(s => b.days <= s);
          if (!seuil) continue;
          const key = `${b.nom}__${seuil}`;
          if (sentRef.current.has(key)) continue;
          sentRef.current.add(key);
          axios.post(WEBHOOK_ROUTES.chat, {
            context: 'deadline_alert', id: user.id, email: user.email,
            userName: user.name || user.email?.split('@')[0] || '',
            text: 'deadline_alert',
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

  // 👇 Écoute l'événement personnalisé
  useEffect(() => {
    const handleFavorisUpdate = () => reload();
    window.addEventListener('favoris-updated', handleFavorisUpdate);
    return () => window.removeEventListener('favoris-updated', handleFavorisUpdate);
  }, [reload]);

  return { starred, reload };
}

function StarPanel({ starred, onClose, setView, lang }) {
  return (
    <div style={P.panel}>
      <div style={P.head}>
        <span style={P.title}>★ {lang === 'fr' ? 'Mes favoris' : 'My favorites'} ({starred.length})</span>
        <button style={P.closeBtn} onClick={onClose}>✕</button>
      </div>
      {starred.length === 0 ? (
        <div style={{ padding:'28px 20px', textAlign:'center', color:'#64748b', fontSize:13 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>☆</div>
          {lang === 'fr' ? 'Aucun favori pour l\'instant' : 'No favorites yet'}
        </div>
      ) : (
        <div style={{ padding:'8px 0', maxHeight:300, overflowY:'auto' }}>
          {starred.map((b, i) => (
            <div key={i} style={{ ...P.item, cursor:'pointer', borderRadius:8 }}
              onClick={() => { setView('bourses'); onClose(); }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(26,58,107,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'#255cae', fontWeight:600 }}>{b.nom}</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{b.pays}</div>
              </div>
              {b.lienOfficiel && (
                <a href={b.lienOfficiel} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize:11, color:'#255cae', textDecoration:'none', padding:'3px 8px', background:'rgba(26,58,107,0.08)', borderRadius:6, border:'1px solid rgba(26,58,107,0.15)' }}>
                  {lang === 'fr' ? 'Voir' : 'View'}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotifPanel({ alerts, onClose, setView, onSelectBourse, lang }) {
  return (
    <div style={{ ...P.panel, width:340 }}>
      <div style={P.head}>
        <span style={P.title}>🔔 {lang === 'fr' ? 'Deadlines urgentes' : 'Urgent deadlines'} {alerts.length > 0 ? `(${alerts.length})` : ''}</span>
        <button style={P.closeBtn} onClick={onClose}>✕</button>
      </div>
      {alerts.length === 0 ? (
        <div style={{ padding:'32px 20px', textAlign:'center', color:'#64748b' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
          <div style={{ fontSize:13 }}>{lang === 'fr' ? 'Aucune deadline dans les 30 prochains jours' : 'No deadline in the next 30 days'}</div>
        </div>
      ) : (
        <>
          <div style={{ maxHeight:380, overflowY:'auto' }}>
            {alerts.map((a, i) => {
              const color = a.days <= 1 ? '#dc2626' : a.days <= 7 ? '#ea580c' : a.days <= 14 ? '#d97706' : '#255cae';
              const bg    = a.days <= 1 ? 'rgba(220,38,38,0.06)' : a.days <= 7 ? 'rgba(234,88,12,0.06)' : a.days <= 14 ? 'rgba(217,119,6,0.06)' : 'rgba(26,58,107,0.06)';
              const label = a.days === 0 ? (lang === 'fr' ? "Aujourd'hui !" : 'Today!') : a.days === 1 ? (lang === 'fr' ? 'Demain !' : 'Tomorrow!') : `${a.days} ${lang === 'fr' ? 'jours restants' : 'days left'}`;
              return (
                <div key={i}
                  onClick={() => { onSelectBourse(a.nom); setView('bourses'); onClose(); }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', margin:'3px 6px', borderRadius:8, background:bg, borderLeft:`3px solid ${color}`, cursor:'pointer', transition:'filter 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.filter='brightness(0.96)'}
                  onMouseLeave={e => e.currentTarget.style.filter=''}
                >
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'#255cae', fontWeight:600, lineHeight:1.3 }}>{a.nom}</div>
                    <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>
                      {a.pays} · {a.deadline.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color, lineHeight:1 }}>{label}</div>
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>→ {lang === 'fr' ? 'voir détails' : 'view details'}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding:'10px 14px', borderTop:'1px solid #e8ecf0' }}>
            <button style={P.actionBtn} onClick={() => { setView('roadmap'); onClose(); }}>
              {lang === 'fr' ? 'Voir la Roadmap →' : 'See Roadmap →'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const P = {
  panel:     { position:'absolute', top:'calc(100% + 8px)', right:0, width:300, background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, zIndex:200, boxShadow:'0 8px 30px rgba(0,0,0,0.12)', overflow:'hidden' },
  head:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', borderBottom:'1px solid #e8ecf0', background:'#f8fafc' },
  title:     { fontSize:13, fontWeight:700, color:'#255cae' },
  closeBtn:  { background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:15 },
  item:      { display:'flex', alignItems:'center', gap:12, padding:'10px 16px', margin:'2px 4px' },
  actionBtn: { width:'100%', padding:'9px', borderRadius:6, background:'#255cae', border:'none', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 },
};

export default function Navbar({ view, setView, user, onLogout, serverStatus, starCount, onOpenBourse }) {
  const { t, lang } = useT();
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [starOpen,  setStarOpen]  = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const alerts              = useDeadlineAlerts(user);
  const { starred, reload } = useStarredBourses(user);
  const navItems = getNavItems(t);

  const notifBadge = alerts.length;
  const badge      = starCount ?? starred.length;

  // Chargement de l'avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.avatar) {
        setAvatarUrl(null);
        return;
      }
      try {
        const avatarId = typeof user.avatar === 'string' ? user.avatar : user.avatar?.id;
        if (!avatarId) {
          setAvatarUrl(null);
          return;
        }
        const res = await axiosInstance.get(`/api/media/${avatarId}`);
        if (res.data?.url) {
          setAvatarUrl(res.data.url);
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        console.warn('Erreur chargement avatar', err);
        setAvatarUrl(null);
      }
    };
    fetchAvatar();
  }, [user?.avatar]);

  useEffect(() => {
    if (!notifOpen && !starOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.notif-wrapper') && !e.target.closest('.star-wrapper')) {
        setNotifOpen(false); setStarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen, starOpen]);

  useEffect(() => { reload(); }, [view]);

  return (
    <nav className="navbar">
      {/* Barre principale */}
      <div className="mainbar">
        {/* Logo + Nom */}
        <div className="nav-brand" onClick={() => setView('accueil')}>
          <img
            src="/logo.png"
            alt="OppsTrack Logo"
            className="brand-logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="brand-text">
            <span className="brand-name">OPPSTRACK</span>
            <span className="brand-tagline">{t('navbar', 'tagline')}</span>
          </div>
        </div>

        {/* Nav items */}
        <div className="desktop-nav">
          {navItems.map(item => (
            <button key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {/* Actions droite */}
        <div className="nav-actions">
          {user && (
            <div className="star-wrapper" style={{ position:'relative' }}>
              <button onClick={() => { setStarOpen(o => !o); setNotifOpen(false); }}
                className="icon-btn" title={`${badge} ${lang === 'fr' ? 'favori(s)' : 'favorite(s)'}`}>
                ★
                {badge > 0 && <span className="badge badge-gold">{badge > 9 ? '9+' : badge}</span>}
              </button>
              {starOpen && <StarPanel starred={starred} onClose={() => setStarOpen(false)} setView={setView} lang={lang} />}
            </div>
          )}

          {user && (
            <div className="notif-wrapper" style={{ position:'relative' }}>
              <button onClick={() => { setNotifOpen(o => !o); setStarOpen(false); }}
                className="icon-btn" title={lang === 'fr' ? 'Notifications' : 'Notifications'}>
                🔔
                {notifBadge > 0 && (
                  <span className="badge badge-red" style={{ animation:'pulse 2s infinite' }}>
                    {notifBadge > 9 ? '9+' : notifBadge}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotifPanel alerts={alerts} onClose={() => setNotifOpen(false)} setView={setView}
                  onSelectBourse={(nom) => { if (onOpenBourse) onOpenBourse(nom); else setView('bourses'); }} lang={lang} />
              )}
            </div>
          )}

          {user ? (
            <div className="user-pill">
              <div className="user-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  (user.name || user.email || 'U')[0].toUpperCase()
                )}
              </div>
              <span className="user-name">{user.name || user.email?.split('@')[0]}</span>
              <button className="logout-btn" onClick={onLogout} title={lang === 'fr' ? 'Déconnexion' : 'Sign out'}>↩</button>
            </div>
          ) : (
            <div className="guest-pill">
              <span className="guest-dot" />
              <span>{t('navbar', 'guest')}</span>
            </div>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Menu mobile */}
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
              ↩ {t('navbar', 'logout')}
            </button>
          )}
        </div>
      )}

      <style>{`
        /* ── MAINBAR ────────────────────────────── */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          flex-direction: column;
          padding: 0;
          height: auto;
          background: transparent;
          border: none;
          box-shadow: none;
          display: flex;
        }
        .mainbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 24px;
          height: 68px;
          background: #255cae;
          border-bottom: 3px solid #f5af3e;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
          margin-top: 0;
        }

        /* ── LOGO ───────────────────────────────── */
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          flex-shrink: 0;
          margin-right: 20px;
          text-decoration: none;
        }
        .brand-logo {
          width: 46px;
          height: 46px;
          object-fit: contain;
          border-radius: 6px;
          padding: 2px;
        }
        .brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .brand-name {
          font-size: 1rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 1px;
        }
        .brand-tagline {
          font-size: 9px;
          color: #f5a623;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        /* ── NAV ITEMS ──────────────────────────── */
        .desktop-nav { display: flex; gap: 2px; flex: 1; }
        .nav-item {
          padding: 6px 11px;
          border-radius: 0;
          border: none;
          border-bottom: 3px solid transparent;
          background: transparent;
          color: rgba(255, 255, 255, 0.86);
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          height: 68px;
          display: flex;
          align-items: center;
          font-family: 'Segoe UI', sans-serif;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-bottom-color: rgba(245,166,35,0.5);
        }
        .nav-item.active {
          background: rgba(245,166,35,0.15);
          color: #f5a623;
          border-bottom-color: #f5a623;
          font-weight: 700;
        }

        /* ── ACTIONS ────────────────────────────── */
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .icon-btn {
          position: relative;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          cursor: pointer;
          padding: 7px 9px;
          border-radius: 8px;
          color: rgba(255,255,255,0.8);
          font-size: 16px;
          line-height: 1;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          background: rgba(245,166,35,0.2);
          border-color: rgba(245,166,35,0.4);
          color: #f5a623;
        }
        .badge {
          position: absolute;
          top: 1px; right: 1px;
          width: 15px; height: 15px;
          border-radius: 50%;
          font-size: 8px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #255cae;
        }
        .badge-gold { background: #f5a623; color: #255cae; }
        .badge-red  { background: #ef4444; color: #fff; }

        /* ── USER PILL ──────────────────────────── */
        .user-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 12px 4px 4px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 24px;
        }
        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f5a623;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #255cae;
          overflow: hidden;
        }
        .user-name { font-size: 13px; color: #fff; font-weight: 500; }
        .logout-btn {
          background: none; border: none; color: rgba(255,255,255,0.5);
          cursor: pointer; font-size: 14px; padding: 2px 4px;
          transition: color 0.2s;
        }
        .logout-btn:hover { color: #f87171; }
        .guest-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 12px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 24px; font-size: 13px; color: rgba(255,255,255,0.6);
        }
        .guest-dot { width: 6px; height: 6px; border-radius: 50%; background: #f5a623; }

        /* ── HAMBURGER ──────────────────────────── */
        .hamburger {
          display: none; background: none; border: none;
          color: #fff; font-size: 22px; cursor: pointer; padding: 4px 8px;
        }

        /* ── MOBILE MENU ────────────────────────── */
        .mobile-menu {
          display: none; position: fixed;
          top: 68px; left: 0; right: 0;
          background: #255cae;
          padding: 12px; border-bottom: 3px solid #f5a623;
          flex-direction: column; gap: 2px; z-index: 99;
        }
        .mobile-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 6px; border: none;
          background: transparent; color: rgba(255, 255, 255, 0.86);
          font-size: 14px; cursor: pointer; text-align: left; transition: all 0.2s;
        }
        .mobile-nav-item:hover, .mobile-nav-item.active {
          background: rgba(245,166,35,0.15); color: #f5a623;
        }
        .mobile-nav-item.logout { color: #f87171; }

        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.2)} }
        @media(max-width:900px) {
          .desktop-nav { display: none; }
          .hamburger { display: block; }
          .mobile-menu { display: flex; }
          .nav-actions .user-pill, .nav-actions .guest-pill { display: none; }
        }
      `}</style>
    </nav>
  );
}
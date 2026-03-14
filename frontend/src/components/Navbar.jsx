import React, { useState } from 'react';

const navItems = [
  { id: 'accueil',    icon: '💬', label: 'IA Chat'    },
  { id: 'bourses',    icon: '🎓', label: 'Bourses'    },
  { id: 'roadmap',    icon: '🗺️', label: 'Roadmap'   },
  { id: 'entretien',  icon: '🎙️', label: 'Entretien' },
  { id: 'cv',         icon: '📄', label: 'CV & LM'   },
  { id: 'dashboard',  icon: '📊', label: 'Dashboard'  },
  { id: 'profil',     icon: '👤', label: 'Profil'    },
];

export default function Navbar({ view, setView, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => setView('accueil')} style={{ cursor: 'pointer' }}>
        <span className="brand-icon">🌍</span>
        <span className="brand-name">OppsTrack</span>
        {user && <span className="brand-badge">Pro</span>}
      </div>

      {/* Desktop nav */}
      <div className="nav-items desktop-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* User status */}
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

      {/* Mobile hamburger */}
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`mobile-nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => { setView(item.id); setMenuOpen(false); }}
            >
              <span>{item.icon}</span>
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
        .navbar {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; gap: 8px;
          padding: 0 24px; height: 60px;
          background: rgba(10, 10, 20, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 4px 30px rgba(0,0,0,0.3);
        }
        .nav-brand {
          display: flex; align-items: center; gap: 8px;
          margin-right: 16px; flex-shrink: 0;
        }
        .brand-icon { font-size: 22px; }
        .brand-name {
          font-size: 1.1rem; font-weight: 800; letter-spacing: -0.5px;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .brand-badge {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; font-size: 9px; font-weight: 700;
          padding: 2px 6px; border-radius: 8px; letter-spacing: 1px;
          text-transform: uppercase;
        }
        .desktop-nav { display: flex; gap: 2px; flex: 1; }
        .nav-item {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 8px; border: none;
          background: transparent; color: #94a3b8;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .nav-item:hover { background: rgba(99,102,241,0.15); color: #e2e8f0; }
        .nav-item.active { background: rgba(99,102,241,0.25); color: #818cf8; }
        .nav-icon { font-size: 15px; }
        .nav-user { margin-left: auto; flex-shrink: 0; }
        .user-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 12px 4px 4px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 24px;
        }
        .user-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: white;
        }
        .user-name { font-size: 13px; color: #c4b5fd; font-weight: 500; }
        .logout-btn {
          background: none; border: none; color: #64748b;
          cursor: pointer; font-size: 14px; padding: 2px 4px;
          border-radius: 4px; transition: color 0.2s;
        }
        .logout-btn:hover { color: #ef4444; }
        .guest-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 12px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
          font-size: 13px; color: #64748b;
        }
        .guest-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #64748b;
        }
        .hamburger {
          display: none; background: none; border: none;
          color: #94a3b8; font-size: 20px; cursor: pointer;
          padding: 4px 8px;
        }
        .mobile-menu {
          display: none; position: fixed; top: 60px; left: 0; right: 0;
          background: rgba(10,10,20,0.98); padding: 16px;
          border-bottom: 1px solid rgba(99,102,241,0.2);
          flex-direction: column; gap: 4px; z-index: 99;
        }
        .mobile-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 10px; border: none;
          background: transparent; color: #94a3b8;
          font-size: 15px; cursor: pointer; text-align: left;
          transition: all 0.2s;
        }
        .mobile-nav-item:hover, .mobile-nav-item.active {
          background: rgba(99,102,241,0.2); color: #818cf8;
        }
        .mobile-nav-item.logout { color: #ef4444; }
        @media (max-width: 768px) {
          .desktop-nav { display: none; }
          .hamburger { display: block; }
          .mobile-menu { display: flex; }
          .nav-user { display: none; }
        }
      `}</style>
    </nav>
  );
}

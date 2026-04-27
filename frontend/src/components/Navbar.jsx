// components/Navbar.jsx
// Navbar transparente sur le hero (navbar + section 1 = une seule image)
// Devient solide quand on dépasse la section 1 (scroll > 100vh)
// exports : default Navbar, ThemeProvider, useTheme
//
// POLICES : 2 polices uniquement
//   fSerif  → "Playfair Display"  (titres, brand, noms)
//   fSans   → "DM Sans"           (UI, labels, corps, badges, mono-like)

"use client";

import React, {
  useState, useEffect, useRef,
  createContext, useContext, useCallback,
} from "react";
import axiosInstance from "@/config/axiosInstance";
import { API_ROUTES } from "@/config/routes";
import { useT } from "../i18n";

/* ==================== THEME ==================== */
const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app-theme");
      if (saved) return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });
  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
export const useTheme = () => useContext(ThemeContext);

/* ==================== HOOKS ==================== */
function useDeadlineAlerts(user) {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    if (!user?.id) { setAlerts([]); return; }
    let cancelled = false;
    const check = async () => {
      try {
        const res = await axiosInstance.get(API_ROUTES.roadmap.byUser(user.id));
        const now = new Date();
        const urgent = (res.data.docs || [])
          .map((b) => {
            const raw = b.dateLimite || b.deadline || null;
            if (!raw) return null;
            const dl = new Date(raw);
            if (isNaN(dl)) return null;
            const days = Math.round((dl - now) / 86400000);
            if (days < 0 || days > 30) return null;
            return { nom: b.nom, pays: b.pays || "", deadline: dl, days };
          })
          .filter(Boolean)
          .sort((a, b) => a.days - b.days);
        if (!cancelled) setAlerts(urgent);
      } catch (err) { console.error(err); }
    };
    check();
    const iv = setInterval(check, 3600000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [user?.id]);
  return alerts;
}

function useStarredBourses(user) {
  const [starred, setStarred] = useState([]);
  const reload = useCallback(async () => {
    if (!user?.id) { setStarred([]); return; }
    try {
      const res = await axiosInstance.get(API_ROUTES.favoris.byUser(user.id));
      setStarred(res.data.docs?.[0]?.bourses || []);
    } catch (err) { console.error(err); }
  }, [user?.id]);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    const h = () => reload();
    window.addEventListener("favoris-updated", h);
    return () => window.removeEventListener("favoris-updated", h);
  }, [reload]);
  return { starred, reload };
}

/* ==================== TOKENS ==================== */
// Deux polices professionnelles uniquement :
//   fSerif → Playfair Display  (titres, brand)
//   fSans  → DM Sans           (tout le reste : UI, corps, labels, chiffres)
const tokens = (theme) => ({
  accent:    theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentInk: theme === "dark" ? "#8ec1e6" : "#004f8a",
  ink:       theme === "dark" ? "#f2efe7" : "#141414",
  ink2:      theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:      theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:      theme === "dark" ? "#6d6b64" : "#9a9794",
  paper:     theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:    theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule:      theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:  theme === "dark" ? "#24231c" : "#e8e4d9",
  surface:   theme === "dark" ? "#1a1912" : "#ffffff",
  danger:    "#b4321f",
  warn:      "#b06a12",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
});

/* ==================== ICONS ==================== */
const Icon = {
  Star: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" {...p}>
      <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.6 6.6 20.4l1-6.1L3.2 10l6.1-.9z"/>
    </svg>
  ),
  StarFill: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" {...p}>
      <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.6 6.6 20.4l1-6.1L3.2 10l6.1-.9z"/>
    </svg>
  ),
  Bell: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16z"/><path d="M10 20a2 2 0 0 0 4 0"/>
    </svg>
  ),
  Moon: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>
    </svg>
  ),
  Sun: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>
    </svg>
  ),
  Globe: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>
    </svg>
  ),
  Close: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  Arrow: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  Chev: (p) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  Logout: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h12"/>
    </svg>
  ),
  Menu: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16"/>
    </svg>
  ),
};

/* ==================== NAV ITEMS ==================== */
const getNavItems = (t) => [
  { id: "Home",            label: t("navbar","Home")      || "Home" },
  { id: "accueil",         label: t("navbar","chat")       || "Chat" },
  { id: "bourses",         label: t("navbar","bourses")    || "Bourses" },
  { id: "recommandations", label: "Recommandations" },
  { id: "roadmap",         label: t("navbar","roadmap")    || "Roadmap" },
  { id: "entretien",       label: t("navbar","entretien")  || "Entretien" },
  { id: "cv",              label: "CV & LM" },
  { id: "dashboard",       label: t("navbar","dashboard")  || "Dashboard" },
  { id: "profil",          label: t("navbar","profil")     || "Profil" },
];

/* ==================== DROPDOWN PANELS ==================== */
function StarPanel({ starred, onClose, setView, lang, c }) {
  return (
    <div style={{
      position:"absolute", top:"calc(100% + 6px)", right:0, width:380,
      background:c.surface, border:`1px solid ${c.rule}`,
      boxShadow:"0 20px 50px rgba(0,0,0,.18)", zIndex:400,
    }}>
      <div style={{ padding:"14px 18px", borderBottom:`1px solid ${c.rule}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:c.fSans, fontSize:10, color:c.ink3, fontWeight:600, letterSpacing:".16em", textTransform:"uppercase" }}>
            {lang==="fr"?"Favoris":"Favorites"}
          </div>
          <div style={{ fontFamily:c.fSerif, fontSize:17, fontWeight:700, marginTop:2, color:c.ink }}>
            {starred.length} {lang==="fr"?"opportunités suivies":"tracked opportunities"}
          </div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:c.ink3 }}>
          <Icon.Close/>
        </button>
      </div>
      {starred.length === 0 ? (
        <div style={{ padding:"28px 20px", textAlign:"center", color:c.ink3, fontSize:13, fontFamily:c.fSans }}>
          {lang==="fr"?"Aucun favori pour l'instant":"No favorites yet"}
        </div>
      ) : (
        <div style={{ maxHeight:340, overflowY:"auto" }}>
          {starred.map((b,i) => (
            <div key={i} onClick={() => { setView("bourses"); onClose(); }}
              style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 18px", borderBottom: i<starred.length-1?`1px solid ${c.ruleSoft}`:"none", cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.background=c.paper2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ color:c.accent, marginTop:2 }}><Icon.StarFill/></span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:c.fSerif, fontSize:14, fontWeight:700, color:c.ink, lineHeight:1.3 }}>{b.nom}</div>
                <div style={{ fontSize:10, color:c.ink3, marginTop:4, letterSpacing:".12em", textTransform:"uppercase", fontWeight:500, fontFamily:c.fSans }}>{b.pays}</div>
              </div>
              {b.lienOfficiel && (
                <a href={b.lienOfficiel} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                  style={{ fontSize:10, color:c.accent, textDecoration:"none", letterSpacing:".16em", textTransform:"uppercase", fontWeight:600, padding:"4px 8px", border:`1px solid ${c.rule}`, fontFamily:c.fSans }}>
                  {lang==="fr"?"Voir":"View"}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotifPanel({ alerts, onClose, setView, onSelectBourse, lang, c }) {
  const tone = (d) =>
    d<=1 ? { col:c.danger, label:lang==="fr"?"critique":"critical" }
    : d<=7 ? { col:c.warn, label:lang==="fr"?"urgent":"urgent" }
    : { col:c.accent, label:lang==="fr"?"à venir":"upcoming" };
  const dayTxt = (a) =>
    a.days===0 ? (lang==="fr"?"Aujourd'hui":"Today")
    : a.days===1 ? (lang==="fr"?"Demain":"Tomorrow")
    : `${a.days} ${lang==="fr"?"jours":"days"}`;

  return (
    <div style={{
      position:"absolute", top:"calc(100% + 6px)", right:0, width:400,
      background:c.surface, border:`1px solid ${c.rule}`,
      boxShadow:"0 20px 50px rgba(0,0,0,.18)", zIndex:400,
    }}>
      <div style={{ padding:"14px 18px", borderBottom:`1px solid ${c.rule}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:c.fSans, fontSize:10, color:c.ink3, fontWeight:600, letterSpacing:".16em", textTransform:"uppercase" }}>
            {lang==="fr"?"Échéances":"Deadlines"}
          </div>
          <div style={{ fontFamily:c.fSerif, fontSize:17, fontWeight:700, marginTop:2, color:c.ink }}>
            {alerts.length} {lang==="fr"?"dans les 30 jours":"within 30 days"}
          </div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:c.ink3 }}>
          <Icon.Close/>
        </button>
      </div>
      {alerts.length===0 ? (
        <div style={{ padding:"32px 20px", textAlign:"center", color:c.ink3, fontSize:13, fontFamily:c.fSans }}>
          {lang==="fr"?"Aucune deadline dans les 30 prochains jours":"No deadline in the next 30 days"}
        </div>
      ) : (
        <div style={{ maxHeight:400, overflowY:"auto" }}>
          {alerts.map((a,i) => {
            const tn = tone(a.days);
            return (
              <div key={i}
                onClick={() => { onSelectBourse(a.nom); setView("bourses"); onClose(); }}
                style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"16px 18px", borderBottom:i<alerts.length-1?`1px solid ${c.ruleSoft}`:"none", cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.background=c.paper2}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ width:3, alignSelf:"stretch", background:tn.col }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontFamily:c.fSans, fontSize:9.5, fontWeight:700, color:tn.col, letterSpacing:".16em", textTransform:"uppercase" }}>{tn.label}</span>
                    <span style={{ width:3, height:3, background:c.ink4, borderRadius:"50%" }}/>
                    <span style={{ fontSize:9.5, color:c.ink3, letterSpacing:".14em", fontWeight:500, textTransform:"uppercase", fontFamily:c.fSans }}>{a.pays}</span>
                  </div>
                  <div style={{ fontFamily:c.fSerif, fontSize:14, fontWeight:700, color:c.ink, lineHeight:1.3 }}>{a.nom}</div>
                  <div style={{ fontSize:11, color:c.ink3, marginTop:4, fontFamily:c.fSans }}>
                    {a.deadline.toLocaleDateString(lang==="fr"?"fr-FR":"en-GB",{day:"2-digit",month:"short",year:"numeric"})}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, minWidth:78 }}>
                  <div style={{ fontFamily:c.fSerif, fontSize:18, fontWeight:700, color:tn.col, lineHeight:1 }}>{dayTxt(a)}</div>
                  <div style={{ fontSize:9, color:c.ink4, marginTop:4, letterSpacing:".14em", textTransform:"uppercase", fontFamily:c.fSans }}>
                    {lang==="fr"?"restants":"remaining"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ==================== NAVBAR ==================== */
export default function Navbar({
  view, setView, user, onLogout,
  serverStatus, starCount, onOpenBourse, onToggleChat,
}) {
  const { t, lang, setLang } = useT();
  const { theme, toggleTheme } = useTheme();
  const c = tokens(theme);

  /* ─── SCROLL : transparent dans le hero (< 100vh), solide après ─── */
 /* ─── SCROLL : transparent uniquement sur Home ─── */
const [pastHero, setPastHero] = useState(false);

useEffect(() => {
  if (view !== "Home") {
    setPastHero(true);
    return;
  }
  const check = () => {
    setPastHero(window.scrollY > window.innerHeight - 120);
  };
  check();
  window.addEventListener("scroll", check, { passive: true });
  return () => window.removeEventListener("scroll", check);
}, [view]);

const solid = view !== "Home" ? true : pastHero;
  const fg      = solid ? c.ink    : "#ffffff";
  const fgMuted = solid ? c.ink3   : "rgba(255,255,255,.6)";
  const ruleLine = solid ? c.rule  : "rgba(255,255,255,.1)";
  const accent  = solid ? c.accent : "#4c9fd9";

  /* ─── Panels state ─── */
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [starOpen,  setStarOpen]  = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const alerts = useDeadlineAlerts(user);
  const { starred, reload } = useStarredBourses(user);
  const navItems   = getNavItems(t);
  const notifBadge = alerts.length;
  const badge      = starCount ?? starred.length;

  const wrapRef = useRef(null);
  const closeAll = () => { setStarOpen(false); setNotifOpen(false); setUserOpen(false); };

  /* Avatar */
  useEffect(() => {
    (async () => {
      if (!user?.avatar) { setAvatarUrl(null); return; }
      try {
        const id = typeof user.avatar === "string" ? user.avatar : user.avatar?.id;
        if (!id) { setAvatarUrl(null); return; }
        const res = await axiosInstance.get(`/api/media/${id}`);
        setAvatarUrl(res.data?.url || null);
      } catch { setAvatarUrl(null); }
    })();
  }, [user?.avatar]);

  /* Outside click */
  useEffect(() => {
    if (!notifOpen && !starOpen && !userOpen) return;
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) closeAll(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [notifOpen, starOpen, userOpen]);

  useEffect(() => { reload(); }, [view, reload]);

  const userDisplay = user?.name || user?.email?.split("@")[0] || "";
  const userInitial = ((user?.name || user?.email || "U")[0] || "U").toUpperCase();

  const utilBase = {
    background: "transparent", border: "none", cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "0 11px", height: 34, fontSize: 11, fontWeight: 500,
    letterSpacing: ".08em", textTransform: "uppercase",
    fontFamily: c.fSans, color: fgMuted,
    borderLeft: `1px solid ${ruleLine}`,
    transition: "color .35s, border-color .35s",
  };

  const chip = (bg) => ({
    marginLeft: 3, fontFamily: c.fSans, fontSize: 10,
    padding: "1px 6px", background: bg, color: "#fff",
    borderRadius: 2, fontWeight: 700,
  });

  return (
    <>
      {/* ── Google Fonts : Playfair Display + DM Sans ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        .ot-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          transition: background .45s ease, box-shadow .45s ease;
          will-change: background;
        }
        .ot-nav.solid {
          background: ${c.paper} !important;
          box-shadow: 0 1px 0 ${c.rule};
        }
        .ot-nav.ghost {
          background: transparent !important;
          box-shadow: none;
        }

        .ot-strip {
          transition: background .45s ease, border-color .45s ease;
          border-bottom: 1px solid;
        }
        .ot-strip.solid { background:${c.paper2} !important; border-color:${c.rule} !important; }
        .ot-strip.ghost { background:rgba(0,0,0,.28) !important; border-color:rgba(255,255,255,.1) !important; }

        .ot-main-tier {
          border-bottom: 1px solid;
          transition: border-color .45s ease, background .45s ease;
        }
        .ot-main-tier.solid { border-color:${c.rule}; background: ${c.paper}; }
        .ot-main-tier.ghost { border-color:rgba(255,255,255,.1); background: transparent; }

        .ot-item {
          position: relative; background: transparent; border: none; cursor: pointer;
          padding: 0 17px; height: 100%;
          font-family: ${c.fSans}; font-size: 14px; font-weight: 400; letter-spacing: .01em;
          display: inline-flex; align-items: center;
          white-space: nowrap;
          transition: color .3s ease;
        }
        .ot-item .ul {
          position: absolute; left: 17px; right: 17px; bottom: 0;
          height: 2px; background: #4c9fd9;
          transform: scaleX(0); transform-origin: left;
          transition: transform .22s ease;
        }
        .ot-item:hover .ul, .ot-item.on .ul { transform: scaleX(1); }
        .ot-item.on { font-weight: 600; }

        .ot-util:hover { color: ${fg} !important; }

        .ot-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 20px; border: none; cursor: pointer;
          font-family: ${c.fSans}; font-size: 11px; font-weight: 700;
          letter-spacing: .18em; text-transform: uppercase;
          background: ${c.accent}; color: #fff;
          transition: background .2s, transform .15s, opacity .4s;
        }
        .ot-cta:hover { background: ${c.accentInk}; transform: translateY(-1px); }

        @media(max-width:1080px){
          .ot-desktop-nav { display:none!important; }
          .ot-util-label  { display:none!important; }
          .ot-hamburger   { display:inline-flex!important; }
        }
      `}</style>

      <header ref={wrapRef} className={`ot-nav ${solid ? "solid" : "ghost"}`}>

        {/* ══════════ STRIP ══════════ */}
        <div className={`ot-strip ${solid ? "solid" : "ghost"}`}>
          <div style={{
            maxWidth:1440, margin:"0 auto", padding:"0 40px",
            display:"flex", alignItems:"center", height:34,
          }}>
       
            

            {/* right utils */}
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center" }}>

              {/* Lang */}
              <button className="ot-util" style={utilBase} onClick={()=>setLang(lang==="fr"?"en":"fr")}>
                <Icon.Globe style={{opacity:.85}}/>
                <span className="ot-util-label">{lang.toUpperCase()} / {lang==="fr"?"EN":"FR"}</span>
              </button>

              {/* Theme */}
              <button className="ot-util" style={utilBase} onClick={toggleTheme}>
                {theme==="light" ? <Icon.Moon/> : <Icon.Sun/>}
                <span className="ot-util-label">
                  {theme==="light" ? (lang==="fr"?"Sombre":"Dark") : (lang==="fr"?"Clair":"Light")}
                </span>
              </button>

              {/* Favoris */}
              {user && (
                <div style={{ position:"relative" }}>
                  <button className="ot-util" style={utilBase}
                    onClick={()=>{ closeAll(); setStarOpen(o=>!o); }}>
                    <Icon.Star/>
                    <span className="ot-util-label">{lang==="fr"?"Favoris":"Favorites"}</span>
                    {badge>0 && <span style={chip(solid?c.ink:"rgba(255,255,255,.35)")}>{badge>99?"99+":badge}</span>}
                  </button>
                  {starOpen && <StarPanel starred={starred} onClose={()=>setStarOpen(false)} setView={setView} lang={lang} c={c}/>}
                </div>
              )}

              {/* Notifications */}
              {user && (
                <div style={{ position:"relative" }}>
                  <button className="ot-util" style={utilBase}
                    onClick={()=>{ closeAll(); setNotifOpen(o=>!o); }}>
                    <Icon.Bell/>
                    <span className="ot-util-label">{lang==="fr"?"Alertes":"Alerts"}</span>
                    {notifBadge>0 && <span style={chip(c.danger)}>{notifBadge>99?"99+":notifBadge}</span>}
                  </button>
                  {notifOpen && (
                    <NotifPanel alerts={alerts} onClose={()=>setNotifOpen(false)} setView={setView}
                      onSelectBourse={nom=>{ if(onOpenBourse)onOpenBourse(nom); else setView("bourses"); }}
                      lang={lang} c={c}/>
                  )}
                </div>
              )}

              {/* User / Guest */}
              {user ? (
                <div style={{ position:"relative" }}>
                  <button className="ot-util" style={{ ...utilBase, paddingRight:14 }}
                    onClick={()=>{ closeAll(); setUserOpen(o=>!o); }}>
                    <span style={{
                      width:22, height:22, borderRadius:"50%", background:accent, color:"#fff",
                      display:"inline-flex", alignItems:"center", justifyContent:"center",
                      overflow:"hidden", fontFamily:c.fSans, fontWeight:700, fontSize:10,
                    }}>
                      {avatarUrl
                        ? <img src={avatarUrl} alt={userDisplay} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                        : userInitial}
                    </span>
                    <span className="ot-util-label" style={{ textTransform:"none", letterSpacing:0, fontWeight:500, color:fgMuted }}>
                      {userDisplay.split(" ")[0]}
                    </span>
                    <Icon.Chev style={{ color:fgMuted }}/>
                  </button>

                  {userOpen && (
                    <div style={{
                      position:"absolute", top:"calc(100% + 6px)", right:0, width:260,
                      background:c.surface, border:`1px solid ${c.rule}`,
                      boxShadow:"0 20px 50px rgba(0,0,0,.18)", zIndex:400,
                    }}>
                      <div style={{ padding:"16px 18px", borderBottom:`1px solid ${c.rule}`, display:"flex", gap:12, alignItems:"center" }}>
                        <div style={{ width:42, height:42, borderRadius:"50%", background:accent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:c.fSans, fontWeight:700, fontSize:16, overflow:"hidden" }}>
                          {avatarUrl ? <img src={avatarUrl} alt={userDisplay} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : userInitial}
                        </div>
                        <div style={{ minWidth:0, flex:1 }}>
                          <div style={{ fontFamily:c.fSerif, fontSize:14, fontWeight:700, color:c.ink }}>{userDisplay}</div>
                          <div style={{ fontSize:11, color:c.ink3, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:c.fSans }}>{user.email}</div>
                        </div>
                      </div>
                      <div style={{ padding:"6px 0" }}>
                        {(lang==="fr"
                          ? ["Mon profil","Mes candidatures","Préférences","Confidentialité"]
                          : ["My profile","My applications","Preferences","Privacy"]
                        ).map((x,i) => (
                          <a key={i} href="#"
                            onClick={e=>{ e.preventDefault(); setView("profil"); setUserOpen(false); }}
                            onMouseEnter={e=>e.currentTarget.style.background=c.paper2}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", fontSize:13, color:c.ink2, textDecoration:"none", fontFamily:c.fSans }}>
                            <span>{x}</span><Icon.Arrow style={{color:c.ink4}}/>
                          </a>
                        ))}
                      </div>
                      <div style={{ borderTop:`1px solid ${c.ruleSoft}` }}>
                        <button onClick={()=>{ setUserOpen(false); onLogout?.(); }}
                          onMouseEnter={e=>e.currentTarget.style.background=c.paper2}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", border:"none", background:"transparent", fontSize:13, color:c.danger, cursor:"pointer", fontFamily:c.fSans }}>
                          <span>{lang==="fr"?"Déconnexion":"Sign out"}</span><Icon.Logout/>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ ...utilBase, cursor:"default" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:accent }}/>
                  <span className="ot-util-label" style={{ color:fgMuted }}>{t("navbar","guest")||"Visiteur"}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ MAIN TIER ══════════ */}
        <div className={`ot-main-tier ${solid?"solid":"ghost"}`}
          style={{ maxWidth:1440, margin:"0 auto", padding:"0 40px", display:"flex", alignItems:"stretch", height:76, background:"transparent", width:"100%" }}>

          {/* Brand */}
          <a href="#" onClick={e=>{ e.preventDefault(); setView("Home"); }}
            style={{
              display:"flex", alignItems:"center", gap:14, textDecoration:"none",
              paddingRight:32,
              borderRight:`1px solid ${ruleLine}`,
              transition:"border-color .5s",
            }}>
            <div style={{ width:44, height:44, display:"grid", placeItems:"center", flexShrink:0 }}>
              <img src="/LOGO (2).png" alt="OppsTrack"
                style={{
                  maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
                  filter: solid ? "none" : "brightness(0) invert(1)",
                  transition:"filter .5s",
                }}
                onError={e=>{ e.target.style.display="none"; }}
              />
            </div>
            <div style={{ display:"flex", flexDirection:"column", lineHeight:1.15 }}>
              <span style={{
                fontFamily:c.fSerif, fontSize:24, fontWeight:700, letterSpacing:"-.01em",
                color:fg, transition:"color .5s",
              }}>OppsTrack</span>
              <span style={{
                fontSize:9.5, fontWeight:600, letterSpacing:".18em",
                textTransform:"uppercase", marginTop:3,
                color:fgMuted, transition:"color .5s",
                fontFamily:c.fSans,
              }}>
                {t(lang==="fr"?"Opportunités · Bourses · Mobilité":"Opportunities · Scholarships · Mobility")}
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="ot-desktop-nav" style={{ display:"flex", alignItems:"stretch", marginLeft:28, flex:1 }}>
            {navItems.map(item => (
              <button key={item.id}
                className={`ot-item${view===item.id?" on":""}`}
                style={{ color: view===item.id ? (solid?c.ink:"#fff") : fgMuted }}
                onClick={()=>{ setView(item.id); closeAll(); }}>
                <span>{item.label}</span>
                <span className="ul"/>
              </button>
            ))}
          </nav>

          {/* Right: CTA + hamburger */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:"auto" }}>
            

            <button className="ot-hamburger"
              onClick={()=>setMenuOpen(!menuOpen)}
              style={{
                display:"none", alignItems:"center", justifyContent:"center",
                background:"transparent", border:`1px solid ${ruleLine}`,
                color:fg, cursor:"pointer", width:36, height:36, padding:0,
                transition:"border-color .5s, color .5s",
              }}
              aria-label="menu">
              {menuOpen ? <Icon.Close/> : <Icon.Menu/>}
            </button>
          </div>
        </div>

        {/* ══════════ MOBILE MENU ══════════ */}
        {menuOpen && (
          <div style={{
            background:c.paper, borderBottom:`1px solid ${c.rule}`,
            padding:"16px 24px 24px",
            display:"flex", flexDirection:"column", gap:2,
            boxShadow:"0 16px 40px rgba(20,15,5,.12)",
          }}>
            {navItems.map(item => (
              <button key={item.id}
                onClick={()=>{ setView(item.id); setMenuOpen(false); }}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"14px 4px", border:"none", borderBottom:`1px solid ${c.ruleSoft}`,
                  background:"transparent",
                  color:view===item.id?c.accent:c.ink,
                  fontFamily:c.fSans, fontSize:16,
                  fontWeight:view===item.id?700:400,
                  cursor:"pointer", textAlign:"left",
                }}>
                <span>{item.label}</span><Icon.Arrow style={{color:c.ink4}}/>
              </button>
            ))}
            {user && (
              <button onClick={()=>{ onLogout?.(); setMenuOpen(false); }}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 4px", border:"none", background:"transparent", color:c.danger, fontSize:14, cursor:"pointer", marginTop:8, letterSpacing:".08em", textTransform:"uppercase", fontWeight:600, fontFamily:c.fSans }}>
                <Icon.Logout/>{t("navbar","logout")||"Déconnexion"}
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
}
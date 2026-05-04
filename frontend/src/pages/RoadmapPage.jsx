// RoadmapPage.jsx — Scholarship Cockpit (Kanban + Focus Mode)
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES, WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

/* ═══════════════════════════════════════════════════════════════════════════
   TOKENS — identiques à la homepage et BoursesPage
═══════════════════════════════════════════════════════════════════════════ */
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
  fSerif: `"Libre Caslon Text", "Times New Roman", Georgia, serif`,
  fSans:  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"JetBrains Mono", ui-monospace, Menlo, monospace`,
});

/* ═══════════════════════════════════════════════════════════════════════════
   REMIX ICONS — inline SVG helper (pure B&W, no emoji)
═══════════════════════════════════════════════════════════════════════════ */
const RI_PATHS = {
  trophy:        'M12 2a1 1 0 0 1 1 1v1h4a1 1 0 0 1 1 1v4c0 2.21-1.79 4-4 4h-.32A6.01 6.01 0 0 1 9 17.91V20h2a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h2v-2.09A6.01 6.01 0 0 1 4.32 13H4a4 4 0 0 1-4-4V5a1 1 0 0 1 1-1h4V3a1 1 0 0 1 1-1h6zm5 3h-3v7a2 2 0 0 0 2-2V5zm-8 0H6v4a2 2 0 0 0 2 2V5zm1 0v8a4 4 0 0 0 4-4V5h-4z',
  fire:          'M12 23a7.5 7.5 0 0 1-5.138-12.963C8.204 8.774 11.5 6.5 11 1.5c3.147.757 4.3 3.273 4.0 5.5 1.798-1.747 1.798-4.5 1.5-6 2.5 2.5 2.5 6.5 0 9.5.5-1 .5-2.5 0-3.5-1 2-3 3.5-4 6.5-.5-1.5-.5-3 0-4.5C8.5 11 6.5 14 6.5 16c0 3.038 2.462 5.5 5.5 5.5z',
  checkCircle:   'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z',
  medal:         'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z',
  calendar:      'M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2v2h6V1h2v2zm-2 2H9v2H7V5H4v4h16V5h-3v2h-2V5zm5 6H4v8h16v-8z',
  bell:          'M12 22a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  map:           'M2 5l7-3 6 3 6-3v16l-6 3-6-3-7 3V5zm7-1.18v14.36l6 3V6.82l-6-3zM15 6.82v14.36l4-2V4.82l-4 2zM5 4.82L1 6.82v12.36l4-2V4.82z',
  search:        'M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15z',
  edit:          'M6.414 16L16.556 5.858l-1.414-1.414L5 14.586V16h1.414zm.829 2H3v-4.243L14.435 2.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 18zM3 20h18v2H3v-2z',
  robot:         'M12 2a2 2 0 0 1 2 2v1h3a1 1 0 0 1 1 1v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a1 1 0 0 1 1-1h3V4a2 2 0 0 1 2-2zm5 5H7v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7zm-5 7a6 6 0 0 1 6 6v1H6v-1a6 6 0 0 1 6-6zm-3.5-5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0z',
  send:          'M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z',
  delete:        'M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z',
  refresh:       'M18.537 19.567A9.961 9.961 0 0 1 12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10c0 2.136-.67 4.116-1.81 5.74L17 12h3a8 8 0 1 0-2.46 5.772l1 1.795z',
  arrowLeft:     'M7.828 11H20v2H7.828l4.95 4.95-1.414 1.414L4 12l7.364-7.364 1.414 1.414z',
  arrowRight:    'M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z',
  sparkle:       'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z',
  warning:       'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z',
  file:          'M9 2.003V2h10.998C20.55 2 21 2.455 21 2.992v18.016a.993.993 0 0 1-.993.992H3.993A1 1 0 0 1 3 20.993V8l6-5.997zM5.828 8H9V4.828L5.828 8zM11 4v5a1 1 0 0 1-1 1H5v10h14V4h-8z',
  upload:        'M4 19h16v2H4v-2zm9-4.828l6.071-6.071 1.414 1.414L12 18 3.515 9.515 4.929 8.1 11 14.172V2h2v12.172z',
  target:        'M12 2C6.477 22 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0-12a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',
  rocket:        'M6.69 8.44l3.637-7.273A1 1 0 0 1 11.23 1h1.54a1 1 0 0 1 .903.567L17.31 8.44l3.47 1.155a1 1 0 0 1 .67 1.254l-3.085 9.255A2 2 0 0 1 16.468 21H7.532a2 2 0 0 1-1.897-1.896L2.55 10.85a1 1 0 0 1 .67-1.255L6.69 8.44zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  pin:           'M11 21l-1-8H4l8-12 1 8h6L11 21z',
  time:          'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-8h4v2h-6V7h2v5z',
  star:          'M12 18.26l-7.053 3.948 1.575-7.928-5.93-5.408 7.984-.814L12 2.5l3.424 5.56 7.984.814-5.93 5.408 1.575 7.928z',
  check:         'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  close:         'M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95 1.414-1.414z',
  user:          'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  users:         'M2 22a8 8 0 1 1 16 0H2zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm10 4.243A8.007 8.007 0 0 1 22 22h-2a6.007 6.007 0 0 0-1.5-3.93l1.5-1.827zm-3.241-6.207A5.99 5.99 0 0 0 18 7a5.99 5.99 0 0 0-1.241-3.664 3.999 3.999 0 1 1 0 7.328z',
  chart:         'M5 3v16h16v2H3V3h2zm15.293 3.293l1.414 1.414L16 13.414l-3-2.999-4.293 4.292-1.414-1.414L13 7.586l3 2.999 4.293-4.292z',
  lock:          'M18 8h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2V7a6 6 0 1 1 12 0v1zm-2 0V7a4 4 0 1 0-8 0v1h8zm-5 6v2h2v-2h-2z',
  clipboard:     'M6 4v4h12V4h2.007c.548 0 .993.445.993.993v16.014a.994.994 0 0 1-.993.993H3.993A.994.994 0 0 1 3 21.007V4.993C3 4.445 3.445 4 3.993 4H6zm2-2h8v4H8V2z',
  lightning:     'M13 10h7l-9 13v-9H4l9-13z',
  link:          'M17.657 14.828l-1.414-1.414L17.657 12A4 4 0 1 0 12 6.343l-1.414 1.414-1.414-1.414 1.414-1.414a6 6 0 0 1 8.485 8.485l-1.414 1.414zm-2.829 2.829l-1.414 1.414a6 6 0 1 1-8.485-8.485l1.414-1.414 1.414 1.414L6.343 12A4 4 0 1 0 12 17.657l1.414-1.414 1.414 1.414zm-.707-10.607l1.414 1.414-7.071 7.07-1.414-1.413 7.071-7.071z',
  eye:           'M12 3c5.392 0 9.878 3.88 10.819 9-.94 5.12-5.427 9-10.819 9-5.392 0-9.878-3.88-10.819-9C2.121 6.88 6.608 3 12 3zm0 16a9.005 9.005 0 0 0 8.777-7 9.005 9.005 0 0 0-17.554 0A9.005 9.005 0 0 0 12 19zm0-2.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  focus:         'M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm0 2a7 7 0 1 0 0 14A7 7 0 0 0 12 5zm0 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  bookOpen:      'M21 4H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h9v-1H4V6h7v13h2V6h7v13h-8v1h9a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z',
  more:          'M12 3c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 7c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 7c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
  apps:          'M4 3h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM4 13h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1zM14 13h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1zM14 3h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
  mail:          'M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z',
  circle:        'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
};

function RI({ name, size = 16, color = 'currentColor', style = {} }) {
  const d = RI_PATHS[name];
  if (!d) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}
    >
      <path d={d} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const formatDate = (dateStr, lang) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US');
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dl = new Date(dateStr); dl.setHours(0, 0, 0, 0);
  return Math.ceil((dl - today) / 86400000);
};

const computePriority = (deadline, progress) => {
  const days = daysUntil(deadline);
  if (days === null) return 'LOW';
  if (days < 0) return 'EXPIRED';
  if (days <= 4) return 'URGENT';
  if (days <= 7) return 'HIGH';
  if (days <= 14) return 'MEDIUM';
  if (progress < 30 && days <= 21) return 'HIGH';
  if (progress > 70 && days > 14) return 'LOW';
  return 'MEDIUM';
};

const priorityMeta = (p, c) => ({
  URGENT:  { label: 'URGENT',     bg: '#fef2f2', color: c.danger,  border: '#fecaca' },
  HIGH:    { label: 'PRIORITAIRE',bg: '#fffbeb', color: c.warn,    border: '#fde68a' },
  MEDIUM:  { label: 'BIENTÔT',    bg: '#eff6ff', color: c.accent,  border: '#bfdbfe' },
  LOW:     { label: 'OK',         bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  EXPIRED: { label: 'EXPIRÉ',     bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
})[p] || { label: p, bg: '#f1f5f9', color: '#555', border: '#ddd' };

/* ═══════════════════════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════════════════════ */
function useBourses(userId) {
  const [bourses, setBourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);
  const pollTimeoutRef = useRef(null);
  const retryDelay = useRef(5000);

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const res = await axiosInstance.get(API_ROUTES.roadmap.byUser(userId), {
        params: { limit: 50, depth: 1 },
        signal: AbortSignal.timeout(8000),
      });
      const docs = (res.data.docs || []).map(d => ({
        notes: d.notes || '',
        _id: d.id,
        nom: d.nom,
        pays: d.pays || '',
        url: d.lienOfficiel || '',
        deadline: d.dateLimite || d.deadlineFinale || '',
        financement: d.financement || '',
        etapeCourante: d.etapeCourante ?? 0,
        statut: d.statut || 'en_cours',
        etapes: d.etapes || [],
        conseilGlobal: d.conseilGlobal || '',
        langue: d.langue || '',
        match: d.match || 0,
        matchLabel: d.matchLabel || '',
        montant: d.montant || d.financement || '',
        org: d.org || d.organisation || '',
        col: d.col || d.colonne || 'recherche',
      }));
      const uniqueMap = new Map();
      docs.forEach(b => {
        const key = `${b.nom?.toLowerCase().trim()}|${b.pays?.toLowerCase().trim()}|${b.deadline}`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, b);
      });
      setBourses(Array.from(uniqueMap.values()));
      retryDelay.current = 5000;
      if (pollingActive) pollTimeoutRef.current = setTimeout(fetchData, retryDelay.current);
    } catch (err) {
      console.error('Erreur chargement bourses:', err);
      if (pollingActive) {
        retryDelay.current = Math.min(retryDelay.current * 1.5, 30000);
        pollTimeoutRef.current = setTimeout(fetchData, retryDelay.current);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, pollingActive]);

  useEffect(() => {
    if (userId) { setPollingActive(true); fetchData(); }
    else { setLoading(false); setBourses([]); }
    return () => { setPollingActive(false); if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current); };
  }, [userId, fetchData]);

  const reload = useCallback(() => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    setLoading(true);
    retryDelay.current = 5000;
    fetchData();
  }, [fetchData]);

  return { bourses, loading, reload };
}

function useTranslatedEtapes(etapes, lang) {
  const [translated, setTranslated] = useState(null);
  const [translating, setTranslating] = useState(false);
  const cacheKey = useMemo(() => {
    if (!etapes?.length) return null;
    return 'tr_' + lang + '_' + etapes.map(e => e.titre?.slice(0, 10)).join('|');
  }, [etapes, lang]);

  useEffect(() => {
    if (lang === 'fr' || !etapes?.length) { setTranslated(null); return; }
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setTranslated(JSON.parse(cached)); return; }
    } catch {}
    setTranslating(true);
    const prompt = `Translate these scholarship steps from French to English. Return ONLY a JSON array with same structure: titre, description, documents (array), duree, deadline.\n\nInput: ${JSON.stringify(etapes.map(e => ({ titre: e.titre || '', description: e.description || '', documents: e.documents || [], duree: e.duree || '', deadline: e.deadline || '' })))}`;
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
    })
      .then(r => r.json())
      .then(data => {
        const text = data.content?.[0]?.text || '';
        const m = text.match(/\[[\s\S]*\]/);
        if (m) {
          const parsed = JSON.parse(m[0]);
          setTranslated(parsed);
          try { localStorage.setItem(cacheKey, JSON.stringify(parsed)); } catch {}
        }
      })
      .catch(err => console.warn('Translation error:', err))
      .finally(() => setTranslating(false));
  }, [cacheKey, lang, etapes]);

  return { translated, translating };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

// TopBar – hero style identique à MiniHero (BoursesPage)
function TopBar({ lang, c, totalCount, onTabChange, activeTab, focusMode }) {
  return (
    <div>
      {/* Hero section – background c.paper2 */}
      <div
        style={{
          background: c.paper2,
          padding: '40px 32px',
          textAlign: 'center',
          borderBottom: `1px solid ${c.rule}`,
          animation: 'fadeIn 0.6s ease',
        }}
      >
        <h1
          style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: c.ink,
            margin: 0,
          }}
        >
          {lang === 'fr' ? (
            <>
              Ma{' '}
              <em style={{ color: c.accent, fontStyle: 'italic' }}>
                Roadmap Bourses
              </em>
              .
            </>
          ) : (
            <>
              My{' '}
              <em style={{ color: c.accent, fontStyle: 'italic' }}>
                Scholarship Roadmap
              </em>
              .
            </>
          )}
        </h1>
        <p
          style={{
            fontFamily: c.fSans,
            fontSize: 16,
            color: c.ink2,
            marginTop: 12,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {lang === 'fr'
            ? `${totalCount} bourses suivies, progression personnalisée par l’IA.`
            : `${totalCount} scholarships tracked, AI‑powered progress.`}
        </p>
      </div>

      {/* Section des boutons - utilise les couleurs du thème */}
      <div
        style={{
          background: c.surface,
          borderBottom: `1px solid ${c.rule}`,
          padding: '0 32px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 8, marginTop: 24, marginBottom: 24 }}>
          {[
            { id: 'kanban', labelFr: 'Suivi', labelEn: 'Tracking' },
            { id: 'progression', labelFr: 'Progression', labelEn: 'Progress' },
          ].map((tab) => {
            const isActive = !focusMode && activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: isActive ? c.accent : 'transparent',
                  color: isActive ? '#ffffff' : c.ink3,
                  border: isActive ? 'none' : `1px solid ${c.rule}`,
                  borderRadius: 0,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  fontFamily: c.fMono,
                  transition: 'all 0.2s ease',
                }}
              >
                {lang === 'fr' ? tab.labelFr : tab.labelEn}
              </button>
            );
          })}
          {focusMode && (
            <button
              style={{
                flex: 1,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: c.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: 0,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: c.fMono,
                transition: 'all 0.2s ease',
              }}
            >
              {lang === 'fr' ? 'Mode Focus' : 'Focus Mode'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PriorityTag({ priority, c, style = {} }) {
  const meta = priorityMeta(priority, c);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20, background: meta.bg, color: meta.color,
      border: `1px solid ${meta.border}`, letterSpacing: '0.03em', fontFamily: c.fMono,
      ...style
    }}>
      {meta.label}
    </span>
  );
}

function BourseCard({ bourse, onClick, onDelete, onRegenerate, c, lang }) {
  const total = bourse.etapes?.length || 1;
  const done = bourse.etapeCourante || 0;
  const pct = Math.round((done / total) * 100);
  const priority = computePriority(bourse.deadline, pct);
  const daysLeft = daysUntil(bourse.deadline);
  const matchColor = bourse.match >= 85 ? '#10b981' : bourse.match >= 75 ? c.accent : c.warn;

  return (
    <div
      onClick={onClick}
      style={{
        background: c.surface,
        border: `1px solid ${c.ruleSoft}`,
        padding: 16,
        marginBottom: 12,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: c.ink, marginBottom: 2 }}>{bourse.nom}</div>
          <div style={{ fontSize: 11, color: c.ink3 }}>{bourse.org || bourse.pays}</div>
        </div>
        <PriorityTag priority={priority} c={c} style={{ marginLeft: 8, flexShrink: 0 }} />
      </div>

      {bourse.match > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, margin: '6px 0' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: matchColor, flexShrink: 0 }} />
          <span style={{ fontWeight: 500, color: c.ink2 }}>Match : {bourse.match}%</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.ink3, margin: '6px 0 4px' }}>
        <span>Deadline dans <b style={{ color: daysLeft && daysLeft <= 7 ? c.danger : c.ink2 }}>{daysLeft}j</b></span>
        <span>{formatDate(bourse.deadline, lang)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: c.ink3, margin: '6px 0 4px' }}>
        <span>Progression</span>
        <span style={{ fontWeight: 600, color: pct === 100 ? '#10b981' : c.accent }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: c.ruleSoft, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10b981' : c.accent }} />
      </div>

      <div style={{ fontSize: 11, color: c.ink3, marginBottom: 8 }}>
        {done}/{total} tâches
        {pct === 100 && <span style={{ color: '#10b981', fontWeight: 600, marginLeft: 6 }}><RI name="check" size={10} /> Complet</span>}
      </div>

      {bourse.conseilGlobal && (
        <div style={{ background: c.paper2, padding: '6px 10px', fontSize: 11, color: c.ink2, marginBottom: 8, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <RI name="lightning" size={12} style={{ marginTop: 1 }} />
          <span>{bourse.conseilGlobal}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: c.ink }}>{bourse.montant}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: c.ink3, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <RI name="pin" size={12} /> {bourse.pays}
          </span>
          <button onClick={e => { e.stopPropagation(); onRegenerate(); }} title="Régénérer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.warn, padding: '0 2px' }}>
            <RI name="refresh" size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Supprimer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.danger, padding: '0 2px' }}>
            <RI name="delete" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TodayBanner({ bourses, onFocusBourse, c, lang }) {
  const urgent = useMemo(() => {
    const list = bourses
      .filter(b => b.etapes?.length > 0 && b.etapeCourante < b.etapes.length)
      .map(b => {
        const step = b.etapes[Math.min(b.etapeCourante, b.etapes.length - 1)];
        return { bourse: b, step, daysLeft: daysUntil(b.deadline) };
      })
      .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));
    return list[0] || null;
  }, [bourses]);

  if (!urgent) return null;
  const remaining = urgent.bourse.etapes.length - urgent.bourse.etapeCourante;

  return (
    <div style={{ margin: '16px 0', background: '#fffbeb', border: `1px solid #fde68a`, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 36, height: 36, background: c.warn, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <RI name="calendar" size={18} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            {lang === 'fr' ? 'À FAIRE AUJOURD\'HUI' : 'DO TODAY'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: c.ink }}>{urgent.bourse.nom}</div>
              <div style={{ fontSize: 12, color: c.ink3, marginTop: 2 }}>
                {lang === 'fr' ? `Prochaine tâche : ${urgent.step?.titre}` : `Next task: ${urgent.step?.titre}`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: c.ink3 }}>{remaining} {lang === 'fr' ? 'restante' : 'remaining'}</span>
              <button
                onClick={() => onFocusBourse(urgent.bourse._id)}
                style={{ padding: '6px 14px', background: c.accent, color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RI name="rocket" size={12} /> {lang === 'fr' ? 'COMMENCER' : 'START'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanView({ bourses, loading, onFocusBourse, onDelete, onRegenerate, onReload, c, lang }) {
  // ✅ FONCTION DE TRI PAR DEADLINE
  const sortByDeadline = (a, b) => {
    const dateA = a.deadline ? new Date(a.deadline) : null;
    const dateB = b.deadline ? new Date(b.deadline) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bourses sans deadline vont à la fin
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    // Vérifier si expirées
    const isExpiredA = dateA < today;
    const isExpiredB = dateB < today;

    // Les expirées vont à la fin, triées par date (plus récemment expirée en premier)
    if (isExpiredA && isExpiredB) return dateB - dateA;
    if (isExpiredA) return 1;
    if (isExpiredB) return -1;

    // Les actives sont triées par deadline croissante (plus proche en premier)
    return dateA - dateB;
  };

  // ✅ FILTRAGE + TRI
  const activeBourses = bourses
    .filter(b => b.col !== 'rejetees' && b.col !== 'acceptees')
    .sort(sortByDeadline);
  
  const rejected = bourses.filter(b => b.col === 'rejetees');
  const accepted = bourses.filter(b => b.col === 'acceptees');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      <TodayBanner bourses={bourses} onFocusBourse={onFocusBourse} c={c} lang={lang} />

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0', color: c.ink3 }}>
          <div style={{ width: 22, height: 22, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13 }}>{lang === 'fr' ? 'Chargement…' : 'Loading…'}</span>
        </div>
      )}

      {!loading && (
        <>
          {activeBourses.length === 0 ? (
            <div style={{ border: `1.5px dashed ${c.rule}`, padding: 32, textAlign: 'center', fontSize: 14, color: c.ink3, marginBottom: 24 }}>
              {lang === 'fr' ? 'Aucune bourse active pour le moment' : 'No active scholarships at the moment'}
            </div>
          ) : (
            activeBourses.map(b => (
              <BourseCard
                key={b._id}
                bourse={b}
                onClick={() => onFocusBourse(b._id)}
                onDelete={() => onDelete(b)}
                onRegenerate={() => onRegenerate(b)}
                c={c}
                lang={lang}
              />
            ))
          )}

          

          <button onClick={onReload} style={{ marginTop: 24, padding: '6px 14px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.ink3, fontSize: 11, cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RI name="refresh" size={12} /> {lang === 'fr' ? 'Actualiser' : 'Refresh'}
          </button>
        </>
      )}
    </div>
  );
}

function StepBlock({ etape, index, isOpen, onToggle, completedDocs, onUploadDoc, tasksState, onToggleTask, c, lang }) {
  const hasTaches = (etape.taches?.length || 0) > 0;
  const totalT = hasTaches ? etape.taches.length : (etape.documents?.length || 0);
  const doneCount = hasTaches
    ? etape.taches.filter((_, ti) => tasksState[`${index}_${ti}`]).length
    : (completedDocs || []).length;

  return (
    <div style={{ background: c.surface, border: `1px solid ${c.ruleSoft}`, padding: '12px 16px', marginBottom: 8 }}>
      {/* En-tête de l'étape */}
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: totalT > 0 && doneCount >= totalT ? c.accent : c.ruleSoft,
            color: totalT > 0 && doneCount >= totalT ? '#fff' : c.ink3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {totalT > 0 && doneCount >= totalT ? <RI name="check" size={12} color="#fff" /> : index + 1}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: c.ink }}>{etape.titre}</span>
          {etape.deadline && (
            <span style={{ fontSize: 10, color: c.warn, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <RI name="time" size={10} /> {etape.deadline}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: c.ink3 }}>
  {doneCount}/{totalT} {!hasTaches && totalT > 0 ? (lang === 'fr' ? 'docs' : 'docs') : ''}
</span>          <span style={{ transform: isOpen ? 'rotate(90deg)' : 'none', display: 'inline-block' }}>
            <RI name="arrowRight" size={12} />
          </span>
        </div>
      </div>

      {/* Contenu détaillé (visible si isOpen) */}
      {isOpen && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${c.ruleSoft}` }}>
          {etape.description && (
            <div style={{ fontSize: 12, color: c.ink2, marginBottom: 10, lineHeight: 1.6 }}>{etape.description}</div>
          )}

          {/* Liste des tâches */}
          {etape.taches?.map((t, ti) => {
            const isDone = tasksState[`${index}_${ti}`];
            return (
              <div key={ti} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${c.ruleSoft}` }}>
                <div
                  onClick={() => onToggleTask(ti)}
                  style={{
                    width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${isDone ? c.accent : c.rule}`,
                    background: isDone ? c.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: 10, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {isDone && <RI name="check" size={10} color="#fff" />}
                </div>
                <span style={{ fontSize: 12, color: isDone ? c.ink3 : c.ink, textDecoration: isDone ? 'line-through' : 'none' }}>
                  {t.label}
                </span>
              </div>
            );
          })}

          {/* Documents requis */}
          {etape.documents?.length > 0 && (
            <div style={{ margin: '12px 0', padding: '10px 12px', background: c.paper2, borderLeft: `2px solid ${c.accent}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <RI name="file" size={10} /> {lang === 'fr' ? 'Documents requis' : 'Required documents'}
              </div>
              {etape.documents.map((doc, di) => {
                const done = completedDocs?.includes(doc);
                return (
                  <div key={di} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: c.ink2 }}>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {done ? <RI name="checkCircle" size={12} color="#10b981" /> : <RI name="circle" size={12} color={c.danger} />}
                      {doc}
                    </span>
                    {!done && (
                      <button onClick={() => onUploadDoc(doc)}
                        style={{ fontSize: 10, padding: '3px 10px', background: c.accent, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <RI name="upload" size={10} /> {lang === 'fr' ? 'Ajouter' : 'Upload'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FocusModeView({ bourse, completedDocs, onUploadDocument, onSetStep, onGenerateDraft, onAskAI, onRegenerate, onDelete, onBack, c, lang }) {
  const [expandedSteps, setExpandedSteps] = useState(() => ({ [bourse.etapeCourante || 0]: true }));
  const { translated, translating } = useTranslatedEtapes(bourse.etapes, lang);
  const etapesDisplay = lang === 'en' && translated ? translated : (bourse.etapes || []);
  const total = etapesDisplay.length || 1;
  const currentIdx = Math.min(bourse.etapeCourante || 0, total - 1);
  const pct = Math.round(((bourse.etapeCourante || 0) / total) * 100);
  const daysLeft = daysUntil(bourse.deadline);
  const priority = computePriority(bourse.deadline, pct);
  const currentStep = etapesDisplay[currentIdx];

  const goToStep = (idx) => {
  onSetStep(idx, bourse._id);
  setExpandedSteps({ [idx]: true }); // ouvre l'étape cible, ferme les autres
};
  // Charger l'état initial des tâches
  const STORAGE_KEY = `roadmap_tasks_${bourse._id}`;
  const DOCS_KEY = `roadmap_docs_${bourse._id}`;
const [localDocs, setLocalDocs] = useState(() => {
  try { return JSON.parse(localStorage.getItem(DOCS_KEY) || '{}'); } catch { return {}; }
});
useEffect(() => {
  localStorage.setItem(DOCS_KEY, JSON.stringify(localDocs));
}, [localDocs]);

const handleUploadDoc = (stepTitle, docName) => {
  setLocalDocs(prev => ({
    ...prev,
    [stepTitle]: [...(prev[stepTitle] || []), docName],
  }));
  // Aussi appeler le parent pour la session courante
  onUploadDocument(stepTitle, docName);
};
  const [tasksState, setTasksState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Sauvegarder à chaque modification
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksState));
  }, [tasksState]);

  // Fonction pour basculer une tâche
  const toggleTask = (stepIndex, taskIndex) => {
    setTasksState(prev => ({
      ...prev,
      [`${stepIndex}_${taskIndex}`]: !prev[`${stepIndex}_${taskIndex}`]
    }));
  };

  const toggleStep = (idx) => setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));

  const risks = [];
  if (daysLeft !== null && daysLeft < 7 && daysLeft >= 0)
    risks.push(lang === 'fr' ? `Deadline dans ${daysLeft} jours` : `Deadline in ${daysLeft} days`);
  if (daysLeft !== null && daysLeft < 0)
    risks.push(lang === 'fr' ? 'Bourse expirée' : 'Scholarship expired');
  if ((bourse.etapeCourante || 0) === 0 && daysLeft !== null && daysLeft < 14)
    risks.push(lang === 'fr' ? 'Aucune étape commencée' : 'No step started');

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>MODE FOCUS</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.ink2, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <RI name="arrowLeft" size={12} /> {lang === 'fr' ? 'Retour' : 'Back'}
          </button>
        </div>
      </div>

      <div style={{ background: c.surface, border: `1px solid ${c.ruleSoft}`, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, color: c.ink }}>{bourse.nom}</div>
            <div style={{ fontSize: 12, color: c.ink3, marginTop: 3 }}>{bourse.org || bourse.pays}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              {bourse.montant && <span style={{ fontSize: 13, fontWeight: 500, color: c.ink }}>{bourse.montant}</span>}
              {bourse.pays && <span style={{ fontSize: 10, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 20, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <RI name="pin" size={10} /> {bourse.pays}
              </span>}
              <PriorityTag priority={priority} c={c} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {daysLeft !== null && (
              <>
                <div style={{ fontSize: 36, fontWeight: 700, color: daysLeft <= 7 ? c.danger : c.accent, lineHeight: 1 }}>{daysLeft}</div>
                <div style={{ fontSize: 11, color: c.ink3 }}>{lang === 'fr' ? 'jours' : 'days'}</div>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.ink3, marginBottom: 6 }}>
            <span>{lang === 'fr' ? 'Progression globale' : 'Overall progress'}</span>
            <span style={{ fontWeight: 600, color: c.ink }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: c.ruleSoft, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10b981' : c.accent }} />
          </div>
        </div>

        {bourse.match > 0 && (
          <div style={{ marginTop: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <RI name="target" size={14} color="#166534" />
            <span style={{ fontSize: 12, color: '#166534' }}>
              {lang === 'fr'
                ? `Score de compatibilité: ${bourse.match}%`
                : `Compatibility score: ${bourse.match}%`}
            </span>
          </div>
        )}
      </div>

      {currentStep && (
        <div style={{ background: '#eff6ff', border: `1px solid #bfdbfe`, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <RI name="rocket" size={14} color="#1e40af" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'fr' ? 'Prochaine action' : 'Next action'}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: c.ink, marginBottom: 10 }}>{currentStep.titre}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => goToStep(currentIdx + 1 < etapesDisplay.length ? currentIdx + 1 : currentIdx)}
              style={{ padding: '7px 16px', background: c.accent, color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RI name="sparkle" size={12} /> {lang === 'fr' ? 'COMMENCER' : 'START'}
            </button>
            <button style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.ink2, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono }}>
              {lang === 'fr' ? 'Plus tard' : 'Later'}
            </button>
          </div>
        </div>
      )}

      {risks.length > 0 && (
        <div style={{ background: '#fef2f2', border: `1px solid #fecaca`, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.danger, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <RI name="warning" size={12} /> {lang === 'fr' ? 'Risques' : 'Risks'}
          </div>
          {risks.map((r, i) => <div key={i} style={{ fontSize: 12, color: c.ink2, marginBottom: 4 }}>• {r}</div>)}
        </div>
      )}

      {etapesDisplay.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RI name="clipboard" size={12} /> {lang === 'fr' ? 'Étapes détaillées' : 'Detailed steps'}
          </div>
          {translating && <div style={{ fontSize: 12, color: c.ink3, marginBottom: 8 }}>⏳ {lang === 'fr' ? 'Traduction…' : 'Translating…'}</div>}
          {etapesDisplay.map((etape, idx) => (
            <StepBlock
              key={idx}
              etape={etape}
              index={idx}
              isOpen={!!expandedSteps[idx]}
              onToggle={() => toggleStep(idx)}
              completedDocs={localDocs?.[etape.titre] || []}
onUploadDoc={(docName) => handleUploadDoc(etape.titre, docName)}
              tasksState={tasksState}
              onToggleTask={(taskIdx) => toggleTask(idx, taskIdx)}
              c={c}
              lang={lang}
            />
          ))}
        </div>
      )}

      {etapesDisplay.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {currentIdx > 0 && (
            <button onClick={() => goToStep(currentIdx - 1)}
              style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${c.ruleSoft}`, color: c.ink2, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <RI name="arrowLeft" size={12} /> {lang === 'fr' ? 'Précédent' : 'Previous'}
            </button>
          )}
          {currentIdx < etapesDisplay.length - 1 && (
            <button onClick={() => goToStep(currentIdx + 1)}
              style={{ padding: '7px 16px', background: c.accent, color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {lang === 'fr' ? 'Suivant' : 'Next'} <RI name="arrowRight" size={12} />
            </button>
          )}
          <button onClick={() => onGenerateDraft(currentStep?.titre, bourse.nom)}
            style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${c.accent}`, color: c.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <RI name="edit" size={12} /> {lang === 'fr' ? 'Brouillon' : 'Draft'}
          </button>
          <button onClick={() => onAskAI(currentStep?.titre, bourse.nom)}
            style={{ padding: '7px 16px', background: c.accent, color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <RI name="robot" size={12} /> {lang === 'fr' ? 'Demander à l\'IA' : 'Ask AI'}
          </button>
        </div>
      )}
    </div>
  );
}


function ProgressionView({ bourses = [], avgProgress, streak, c, lang }) {
  const submitted = (bourses || []).filter(b => b.col === 'soumises' || b.col === 'acceptees').length;
  const badgesCount = BADGES_UNLOCKED.length;
  const statCards = [
    {      label: lang==='fr'?'Progression globale':'Global progress',     value: `${avgProgress}%`, tag: lang==='fr'?'Total':'Total',         tagBg: '#e0f2fe', tagColor: '#0369a1', bg: '#fef9f0',  },
    {  label: lang==='fr'?'Jours consécutifs':'Streak days',           value: streak,            tag: 'Streak',                            tagBg: '#fee2e2', tagColor: '#dc2626', bg: '#fff7f5',  },
    { label: lang==='fr'?'Candidatures soumises':'Submitted',         value: submitted,         tag: lang==='fr'?'Complétées':'Done',      tagBg: '#dcfce7', tagColor: '#16a34a', bg: '#f0fdf4'},
    {    label: lang==='fr'?`sur 9 débloqués`:'of 9 unlocked',          value: badgesCount,       tag: lang==='fr'?'Badges':'Badges',       tagBg: '#fef9c3', tagColor: '#854d0e', bg: '#fffef5' },
  ];
  const currentLevelIdx = avgProgress < 20 ? 0 : avgProgress < 40 ? 1 : avgProgress < 60 ? 2 : avgProgress < 80 ? 3 : 4;
  const nextLevelTarget = [20, 40, 60, 80, 100][currentLevelIdx] || 100;
  const levelPct = Math.min(Math.round((avgProgress / nextLevelTarget) * 100), 100);

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${c.ruleSoft}`, borderRadius: 12, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RI name={s.icon} size={18} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: s.tagBg, color: s.tagColor }}>{s.tag}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: c.ink, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: c.ink3, marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Niveau */}
      <div style={{ background: c.surface, border: `1px solid ${c.ruleSoft}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.ink }}>{lang==='fr'?'Niveau :':'Level:'} {LEVELS[currentLevelIdx]}</div>
            <div style={{ fontSize: 13, color: c.ink3, marginTop: 4 }}>{lang==='fr'?'Continue comme ça pour débloquer le niveau suivant !':'Keep going to unlock the next level!'}</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RI name="trophy" size={22} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.ink3, marginBottom: 6, marginTop: 12 }}>
          <span>{lang==='fr'?`Progression vers ${LEVELS[Math.min(currentLevelIdx+1,4)]}`:`Progress to ${LEVELS[Math.min(currentLevelIdx+1,4)]}`}</span>
          <span style={{ fontWeight: 600, color: c.ink }}>{avgProgress}/{nextLevelTarget}</span>
        </div>
        <div style={{ height: 10, background: c.ruleSoft, borderRadius: 5, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ width: `${levelPct}%`, height: '100%', background: c.accent, borderRadius: 5, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LEVELS.map((lv, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 20, background: i < currentLevelIdx ? c.accent : i === currentLevelIdx ? c.ink : c.ruleSoft, color: i <= currentLevelIdx ? '#fff' : c.ink3, border: `1px solid ${i === currentLevelIdx ? c.accent : 'transparent'}` }}>{lv}</span>
          ))}
        </div>
      </div>

      {/* Badges débloqués */}
     {/* Badges débloqués */}
<div style={{ background: c.surface, border: `1px solid ${c.ruleSoft}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
  <div style={{ fontSize: 15, fontWeight: 700, color: c.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
    {lang === 'fr' ? `Badges débloqués (${badgesCount})` : `Unlocked badges (${badgesCount})`}
  </div>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
    {BADGES_UNLOCKED.map((b, i) => (
      <div key={i} style={{ background: b.bg, border: `1px solid ${b.border}`, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.ink, marginBottom: 2 }}>{b.label}</div>
          <div style={{ fontSize: 11, color: c.ink3 }}>{b.desc}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: b.color, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <RI name="check" size={10} /> {lang === 'fr' ? 'Débloqué ✓' : 'Unlocked ✓'}
        </span>
      </div>
    ))}
  </div>
</div>
      {/* Badges à débloquer */}
      <div style={{ background: c.surface, border: `1px solid ${c.ruleSoft}`, borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: c.ink, marginBottom: 16 }}>
        {lang==='fr'?'Prochains badges à débloquer':'Next badges to unlock'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BADGES_LOCKED.map((b, i) => {
            const pct = Math.min(Math.round((b.current / b.target) * 100), 100);
            return (
              <div key={i} style={{ background: c.paper2, border: `1px solid ${c.ruleSoft}`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: c.ruleSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <RI name={b.icon} size={16} color={c.ink3} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: c.ink }}>{b.label}</span>
                      <span style={{ fontSize: 11, color: c.ink3 }}>{b.current}/{b.target}</span>
                    </div>
                    <div style={{ fontSize: 11, color: c.ink3, marginBottom: 8 }}>{b.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: c.ink3, minWidth: 70 }}>Progression</span>
                      <div style={{ flex: 1, height: 6, background: c.ruleSoft, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: c.accent, borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const BADGES_UNLOCKED = [
  {     label: 'Première candidature', desc: 'Soumettre ta première candidature',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  {   label: 'Perfectionniste',       desc: 'Atteindre 100% sur une candidature', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  {  label: 'Semaine productive',    desc: '7 jours consécutifs actifs',          color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
];
const BADGES_LOCKED = [
  { icon: 'user',   label: 'Triple menace',  desc: 'Soumettre 3 candidatures',             current: 2,  target: 3,  color: '#6b7280' },
  { icon: 'circle', label: 'Mi-parcours',    desc: 'Atteindre 50% de progression globale', current: 32, target: 50, color: '#6b7280' },
  { icon: 'users',  label: 'Expert bourses', desc: 'Soumettre 5 candidatures',             current: 2,  target: 5,  color: '#6b7280' },
  { icon: 'chart',  label: 'Presque là',     desc: 'Atteindre 80% de progression globale', current: 32, target: 80, color: '#6b7280' },
];
const LEVELS = ['Débutant', 'Novice', 'Intermédiaire', 'Avancé', 'Expert'];


function LoginModal({ onClose, c, lang }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');
  const send = async () => {
    if (!email || !email.includes('@')) { setErrMsg(lang === 'fr' ? 'Email invalide' : 'Invalid email'); return; }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Erreur serveur' : 'Server error'));
    }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'relative', zIndex: 2001, width: 420, maxWidth: '92vw', background: c.surface, borderTop: `3px solid ${c.accent}`, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', background: c.paper2, borderBottom: `1px solid ${c.rule}` }}>
          <RI name="lock" size={20} />
          <span style={{ fontFamily: c.fSerif, fontWeight: 700, fontSize: 16, color: c.ink }}>{lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: c.ink3 }}>
            <RI name="close" size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {status === 'idle' && (
            <>
              <p style={{ color: c.ink2, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                {lang === 'fr' ? 'Entrez votre email pour recevoir un lien magique.' : 'Enter your email to receive a magic link.'}
              </p>
              <input type="email" placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'} value={email} autoFocus
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${c.ruleSoft}`, background: c.paper, color: c.ink, fontSize: 13, outline: 'none', fontFamily: c.fSans }}
              />
              {errMsg && <div style={{ color: c.danger, fontSize: 11, marginTop: 6 }}>{errMsg}</div>}
              <button onClick={send} style={{ width: '100%', marginTop: 16, padding: 10, background: c.accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: c.fMono, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <RI name="mail" size={14} /> {lang === 'fr' ? 'Envoyer le lien magique' : 'Send magic link'}
              </button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ color: c.ink2, marginTop: 14 }}>{lang === 'fr' ? 'Envoi…' : 'Sending…'}</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}><RI name="mail" size={48} /></div>
              <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>{lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}</div>
              <p style={{ color: c.ink2, fontSize: 12 }}>{lang === 'fr' ? 'Vérifiez votre boîte mail.' : 'Check your inbox.'}</p>
              <button onClick={onClose} style={{ width: '100%', marginTop: 16, padding: 10, background: '#166534', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <RI name="check" size={12} /> {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <RI name="warning" size={40} color={c.danger} />
              <p style={{ color: c.danger, marginTop: 12 }}>{errMsg}</p>
              <button onClick={() => { setStatus('idle'); setErrMsg(''); }} style={{ width: '100%', marginTop: 16, padding: 10, background: c.accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function RoadmapPage({ user, handleQuickReply }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);

  const [activeTab, setActiveTab] = useState('kanban');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [focusBourseId, setFocusBourseId] = useState(null);
  const [completedDocs, setCompletedDocs] = useState({});
  const [focusBourse, setFocusBourse] = useState(null);

  const { bourses, loading, reload } = useBourses(user?.id);

  const activeCount = bourses.filter(b => b.col !== 'rejetees' && b.col !== 'acceptees').length;

  const avgProgress = useMemo(() => {
    if (!bourses.length) return 0;
    const sum = bourses.reduce((acc, b) => {
      const total = b.etapes?.length || 1;
      return acc + ((b.etapeCourante || 0) / total) * 100;
    }, 0);
    return Math.round(sum / bourses.length);
  }, [bourses]);

  const handleFocusBourse = useCallback((id) => {
  const found = bourses.find(b => b._id === id);
  if (found) {
    setFocusBourse({ ...found });
    setFocusBourseId(id);
    setActiveTab('kanban');
    // Restaurer les docs depuis notes
    try {
      const saved = found.notes ? JSON.parse(found.notes) : {};
      setCompletedDocs(prev => ({ ...prev, [id]: saved }));
    } catch {}
  }
}, [bourses]);

  const handleBackToKanban = useCallback(() => {
  setFocusBourseId(null);
  setFocusBourse(null);
}, []);

  const handleUploadDocument = useCallback(async (scholarshipId, stepTitle, docName) => {
  setCompletedDocs(prev => {
    const updated = {
      ...prev,
      [scholarshipId]: {
        ...prev[scholarshipId],
        [stepTitle]: [...(prev[scholarshipId]?.[stepTitle] || []), docName],
      },
    };
    // Persist en base
    const docsPayload = updated[scholarshipId] || {};
    axiosInstance.patch(API_ROUTES.roadmap.update(scholarshipId), {
      notes: JSON.stringify(docsPayload), // stocke dans le champ notes
    }).catch(err => console.error('Docs save error:', err));
    return updated;
  });
}, []);

  const handleSetStep = useCallback(async (bourseId, newStepIndex) => {
  if (!bourseId) return;
  const etapesCount = focusBourse?.etapes?.length || 1;
  const clamped = Math.min(Math.max(newStepIndex, 0), etapesCount - 1);
  console.log('[handleSetStep] bourseId:', bourseId, '| newStep:', newStepIndex, '| clamped:', clamped, '| etapesCount:', etapesCount);
  setFocusBourse(prev => prev ? { ...prev, etapeCourante: clamped } : null);
  try {
    const res = await axiosInstance.patch(`/api/roadmap/${bourseId}`, { etapeCourante: clamped });
    console.log('[PATCH response]', res.data);
  } catch (err) {
    console.error('Step update error:', err);
  }
}, [focusBourse]);

// Synchronise focusBourse quand le polling ramène des données fraîches
useEffect(() => {
  if (!focusBourseId || !bourses.length) return;
  const fresh = bourses.find(b => b._id === focusBourseId);
  if (!fresh) return;
  setFocusBourse(prev => {
    if (!prev) return { ...fresh };
    // Garde l'etapeCourante locale si elle est plus récente
    return { ...fresh, etapeCourante: prev.etapeCourante };
  });
}, [bourses, focusBourseId]);


  const handleAskAI = useCallback((stepTitle, bourseNom) => {
    const message = lang === 'fr'
      ? `Aide-moi pour l'étape "${stepTitle}" de la bourse "${bourseNom}"`
      : `Help me with step "${stepTitle}" for "${bourseNom}" scholarship`;
    window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
  }, [lang]);

  const handleGenerateDraft = useCallback((stepTitle, bourseNom) => {
    const message = lang === 'fr'
      ? `Génère un brouillon pour l'étape "${stepTitle}" de la bourse "${bourseNom}"`
      : `Generate a draft for step "${stepTitle}" for "${bourseNom}"`;
    window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
  }, [lang]);

  const handleRegenerate = useCallback(async (bourse) => {
    if (!bourse._id) return;
    try {
      await axiosInstance.post(WEBHOOK_ROUTES.generateRoadmap, {
        roadmapId: bourse._id,
        bourse: { nom: bourse.nom, pays: bourse.pays, url: bourse.url, deadline: bourse.deadline, financement: bourse.financement },
      });
      setTimeout(() => reload(), 2000);
    } catch (err) { console.error('Regeneration error:', err); }
  }, [reload]);

  const handleDelete = useCallback(async (bourse) => {
    if (!bourse._id) return;
    try {
      await axiosInstance.delete(API_ROUTES.roadmap.delete(bourse._id));
      reload();
      if (focusBourseId === bourse._id) setFocusBourseId(null);
    } catch (err) { console.error('Delete error:', err); }
  }, [reload, focusBourseId]);

  if (!user) {
    return (
      <>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.paper, padding: 24 }}>
          <div style={{ background: c.surface, border: `1px solid ${c.ruleSoft}`, padding: '48px 40px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <RI name="map" size={56} color={c.ink3} />
            <h3 style={{ fontFamily: c.fSerif, fontSize: 20, fontWeight: 700, color: c.ink, margin: '16px 0 8px' }}>
              {lang === 'fr' ? 'Roadmap non disponible' : 'Roadmap unavailable'}
            </h3>
            <p style={{ color: c.ink2, fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>
              {lang === 'fr' ? 'Connectez-vous pour suivre vos candidatures.' : 'Sign in to track your applications.'}
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{ padding: '10px 28px', background: c.accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, fontFamily: c.fMono, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RI name="lock" size={14} /> {lang === 'fr' ? 'Se connecter' : 'Sign in'}
            </button>
          </div>
        </div>
        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} c={c} lang={lang} />}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }


  const isFocusMode = !!focusBourse;


  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <TopBar
        lang={lang}
        c={c}
        totalCount={activeCount}
        onTabChange={(tab) => { setActiveTab(tab); setFocusBourseId(null); setFocusBourse(null); }}
        activeTab={activeTab}
        focusMode={isFocusMode}
      />

      {isFocusMode ? (
        <FocusModeView
  key={`focus-${focusBourse._id}`}
  bourse={focusBourse}
          completedDocs={completedDocs[focusBourse._id] || {}}
          onUploadDocument={(stepTitle, docName) => handleUploadDocument(focusBourse._id, stepTitle, docName)}
          onSetStep={(idx) => handleSetStep(focusBourse._id, idx)}
          onGenerateDraft={handleGenerateDraft}
          onAskAI={handleAskAI}
          onRegenerate={() => handleRegenerate(focusBourse)}
          onDelete={() => handleDelete(focusBourse)}
          onBack={handleBackToKanban}
          c={c}
          lang={lang}
        />
      ) : (
        <>
          {activeTab === 'kanban' && (
            <KanbanView
              bourses={bourses}
              loading={loading}
              onFocusBourse={handleFocusBourse}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
              onReload={reload}
              c={c}
              lang={lang}
            />
          )}
          {activeTab === 'progression' && (
            <ProgressionView bourses={bourses} avgProgress={avgProgress} streak={0} c={c} lang={lang} />
          )}

          {!loading && bourses.length === 0 && activeTab === 'kanban' && (
            <div style={{ textAlign: 'center', padding: 48, margin: 24, border: `1px solid ${c.ruleSoft}`, background: c.surface }}>
              <RI name="map" size={48} color={c.ink3} />
              <div style={{ fontFamily: c.fSerif, fontSize: 18, fontWeight: 700, color: c.ink, marginTop: 16, marginBottom: 8 }}>
                {lang === 'fr' ? 'Aucune candidature en cours' : 'No active applications'}
              </div>
              <div style={{ color: c.ink2, fontSize: 13, maxWidth: 360, margin: '0 auto 20px' }}>
                {lang === 'fr'
                  ? <>Allez dans <strong style={{ color: c.accent }}>Recommandations</strong> et cliquez sur <strong style={{ color: c.warn }}>Postuler</strong> pour démarrer.</>
                  : <>Go to <strong style={{ color: c.accent }}>Recommendations</strong> and click <strong style={{ color: c.warn }}>Apply</strong> to start.</>}
              </div>
              <button
                onClick={() => handleQuickReply?.(lang === 'fr' ? 'Recommande moi des bourses' : 'Recommend me scholarships')}
                style={{ padding: '8px 20px', background: c.accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RI name="target" size={14} /> {lang === 'fr' ? 'Voir les recommandations' : 'See recommendations'}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </main>
  );
}
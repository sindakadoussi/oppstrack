// src/providers/TranslationProvider.jsx
// ═══════════════════════════════════════════════════════════════════
// Traduit TOUTES les données BDD via DeepL FREE au chargement
// Cache localStorage — rien n'est traduit deux fois
// Usage : entoure ton <App> avec <TranslationProvider>
// ═══════════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// ── Config ─────────────────────────────────────────────────────────
// 🔑 Mets ta clé DeepL ici : https://www.deepl.com/fr/pro#developer
const DEEPL_KEY = import.meta.env.VITE_DEEPL_KEY || 'YOUR_DEEPL_FREE_API_KEY';
const DEEPL_URL = 'https://api-free.deepl.com/v2/translate';
const CACHE_V   = 'v2'; // incrémenter pour invalider le cache

// ── Context ────────────────────────────────────────────────────────
const TranslationContext = createContext({
  tr:        (text) => text,   // traduit un texte
  trObj:     (obj, fields) => obj, // traduit des champs d'un objet
  trBourse:  (bourse) => bourse,   // traduit une bourse complète
  isReady:   false,
  isLoading: false,
});

export const useTranslation = () => useContext(TranslationContext);

// ── DeepL : 1 appel pour N textes ─────────────────────────────────
async function deeplBatch(texts, targetLang) {
  const nonEmpty = texts.map((t, i) => ({ i, t: (t || '').trim() })).filter(x => x.t.length > 1);
  if (!nonEmpty.length) return texts;

  const params = new URLSearchParams();
  params.append('auth_key', DEEPL_KEY);
  params.append('target_lang', targetLang.toUpperCase());
  params.append('source_lang', 'FR');
  nonEmpty.forEach(({ t }) => params.append('text', t));

  const res = await fetch(DEEPL_URL, { method: 'POST', body: params });
  if (!res.ok) throw new Error(`DeepL ${res.status}`);
  const data = await res.json();

  const result = [...texts];
  nonEmpty.forEach(({ i }, idx) => {
    result[i] = data.translations[idx]?.text || texts[i];
  });
  return result;
}

// ── Cache localStorage ─────────────────────────────────────────────
const CACHE_KEY = `opps_translations_${CACHE_V}`;

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

// ── Provider ───────────────────────────────────────────────────────
export function TranslationProvider({ children, lang }) {
  const [cache, setCache]       = useState(() => loadCache());
  const [isLoading, setLoading] = useState(false);
  const [isReady, setReady]     = useState(false);
  const pendingRef              = useRef(new Set());

  // Traduire un texte (depuis le cache ou DeepL)
  const tr = useCallback((text, targetLang = lang) => {
    if (!text || typeof text !== 'string' || targetLang === 'fr') return text;
    const key = `${targetLang}::${text.trim()}`;
    return cache[key] || text; // fallback FR si pas encore traduit
  }, [cache, lang]);

  // Traduire plusieurs textes en batch
  const translateBatch = useCallback(async (texts, targetLang = lang) => {
    if (targetLang === 'fr' || !texts.length) return;

    const toTranslate = texts.filter(t => {
      if (!t || t.trim().length < 2) return false;
      const key = `${targetLang}::${t.trim()}`;
      return !cache[key] && !pendingRef.current.has(key);
    });

    if (!toTranslate.length) return;

    // Marquer comme "en cours"
    toTranslate.forEach(t => pendingRef.current.add(`${targetLang}::${t.trim()}`));

    setLoading(true);
    try {
      // DeepL accepte max 50 textes par appel
      const BATCH_SIZE = 50;
      const newCache = { ...loadCache() };

      for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
        const batch = toTranslate.slice(i, i + BATCH_SIZE);
        const translated = await deeplBatch(batch, targetLang);
        batch.forEach((orig, idx) => {
          const key = `${targetLang}::${orig.trim()}`;
          newCache[key] = translated[idx];
          pendingRef.current.delete(key);
        });
      }

      saveCache(newCache);
      setCache(newCache);
    } catch (err) {
      console.warn('[DeepL]', err.message);
      toTranslate.forEach(t => pendingRef.current.delete(`${targetLang}::${t.trim()}`));
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [cache, lang]);

  // Traduit les champs texte d'un objet
  const trObj = useCallback((obj, fields = []) => {
    if (!obj || lang === 'fr') return obj;
    const result = { ...obj };
    fields.forEach(f => { if (result[f]) result[f] = tr(result[f]); });
    return result;
  }, [tr, lang]);

  // Traduit une bourse complète
  const trBourse = useCallback((bourse) => {
    if (!bourse || lang === 'fr') return bourse;
    return {
      ...bourse,
      pays:        tr(bourse.pays),
      niveau:      tr(bourse.niveau),
      domaine:     tr(bourse.domaine),
      financement: tr(bourse.financement),
      description: tr(bourse.description),
      statut:      tr(bourse.statut),
      documents: (bourse.documents || []).map(doc => ({
        ...doc,
        nom:         tr(doc.nom || doc.name || ''),
        description: tr(doc.description || ''),
      })),
    };
  }, [tr, lang]);

  // Exposer translateBatch pour que les pages puissent envoyer leurs données
  return (
    <TranslationContext.Provider value={{ tr, trObj, trBourse, translateBatch, isReady, isLoading, lang }}>
      {children}
    </TranslationContext.Provider>
  );
}
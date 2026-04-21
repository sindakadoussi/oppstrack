// src/hooks/usePageTranslation.js
// ═══════════════════════════════════════════════════════════════════
// Hook utilisé dans chaque page pour envoyer ses données à DeepL
// et récupérer les traductions
// ═══════════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import { useTranslation } from '../providers/TranslationProvider';

// ── Extrait tous les textes d'un tableau de bourses ───────────────
function extractBourseTexts(bourses) {
  const texts = new Set();
  (bourses || []).forEach(b => {
    [b.pays, b.niveau, b.domaine, b.financement, b.description, b.statut].forEach(t => {
      if (t && typeof t === 'string' && t.trim().length > 1) texts.add(t.trim());
    });
    (b.documents || []).forEach(doc => {
      [doc.nom, doc.name, doc.description].forEach(t => {
        if (t && typeof t === 'string' && t.trim().length > 1) texts.add(t.trim());
      });
    });
  });
  return [...texts];
}

// ── Extrait les textes d'un objet quelconque ─────────────────────
function extractObjectTexts(obj, fields) {
  const texts = new Set();
  (fields || Object.keys(obj || {})).forEach(f => {
    const v = obj?.[f];
    if (v && typeof v === 'string' && v.trim().length > 1) texts.add(v.trim());
  });
  return [...texts];
}

// ── Hook principal ─────────────────────────────────────────────────
export function usePageTranslation(data, type = 'bourses') {
  const { translateBatch, trBourse, trObj, tr, lang, isLoading, isReady } = useTranslation();

  useEffect(() => {
    if (!data || lang === 'fr') return;

    let texts = [];
    if (type === 'bourses' && Array.isArray(data)) {
      texts = extractBourseTexts(data);
    } else if (type === 'bourse' && typeof data === 'object') {
      texts = extractBourseTexts([data]);
    } else if (type === 'texts' && Array.isArray(data)) {
      texts = data.filter(t => t && typeof t === 'string');
    } else if (type === 'object' && typeof data === 'object') {
      texts = extractObjectTexts(data);
    }

    if (texts.length) translateBatch(texts, lang);
  }, [lang, Array.isArray(data) ? data.length : data?.id || data?.nom]);

  return { trBourse, trObj, tr, isLoading, isReady };
}
// components/BourseCard.jsx
import React, { useState } from 'react';
import { calcMatch, getScoreColor, getScoreLabel, countryFlag } from '../utils/Calcmatch';

const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.round((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return { label: 'Expirée',       color: '#ef4444' };
  if (diff === 0) return { label: "Aujourd'hui !",  color: '#ef4444' };
  if (diff <= 30) return { label: `${diff} jours`,  color: '#f97316' };
  return               { label: `${diff} jours`,    color: '#16a34a' };
};

const isUrgent = (deadline) => {
  if (!deadline) return false;
  const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
  return diff < 30 && diff >= 0;
};

const formatDate = (d) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
};

export default function BourseCard({ bourse, user, onAskAI, onClick, starred, onStar, applied, onApply }) {
  const pct        = calcMatch(bourse, user);
  const scoreColor = getScoreColor(pct);
  const dl         = daysLeft(bourse.dateLimite);
  const urgent     = isUrgent(bourse.dateLimite);
  const niveaux    = bourse.niveau ? bourse.niveau.split(',').map(s => s.trim()).filter(Boolean) : [];

  const [starLoading,  setStarLoading]  = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  return (
    <div
      style={{ background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden', display:'flex', flexDirection:'column', transition:'transform .2s, box-shadow .2s', boxShadow:'0 2px 8px rgba(26,58,107,0.06)' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(26,58,107,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.boxShadow='0 2px 8px rgba(26,58,107,0.06)'; }}
    >
      {/* Barre score */}
      <div style={{ height:4, background: pct !== null ? `linear-gradient(90deg,${scoreColor}88,${scoreColor})` : '#e2e8f0' }}/>

      {/* Header */}
      <div style={{ padding:'14px 16px 10px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, cursor:'pointer' }} onClick={onClick}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>{countryFlag(bourse.pays)}</span>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
              {bourse.pays || 'International'}
              {urgent && (
                <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, background:'#fef2f2', color:'#ef4444', fontWeight:700, textTransform:'uppercase', border:'1px solid #fecaca' }}>
                  Urgent
                </span>
              )}
            </div>
            <div style={{ fontSize:'0.95rem', fontWeight:700, color:'#1a3a6b', lineHeight:1.3, marginTop:2 }}>{bourse.nom}</div>
          </div>
        </div>
        {pct !== null && (
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:'1.2rem', fontWeight:800, color:scoreColor, lineHeight:1 }}>{pct}%</div>
            <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{getScoreLabel(pct)}</div>
          </div>
        )}
      </div>

      <div style={{ height:1, background:'#f1f5f9', margin:'0 16px' }}/>

      {/* Body */}
      <div style={{ padding:'12px 16px', flex:1, display:'flex', flexDirection:'column', gap:8, cursor:'pointer' }} onClick={onClick}>
        {niveaux.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {niveaux.map((n, i) => (
              <span key={i} style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontWeight:500 }}>{n}</span>
            ))}
          </div>
        )}
        {bourse.financement && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
            <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>💰</span>
            <span style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>{bourse.financement}</span>
          </div>
        )}
        {bourse.description && (
          <p style={{ fontSize:12, color:'#64748b', lineHeight:1.5, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {bourse.description}
          </p>
        )}
        {(formatDate(bourse.dateLimite) || dl) && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:2, padding:'8px 10px', borderRadius:6, background:'#f8fafc', border:'1px solid #f1f5f9' }}>
            {formatDate(bourse.dateLimite) && (
              <div>
                <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>Date limite</div>
                <div style={{ fontSize:12, color:dl?.color || '#475569', fontWeight:700 }}>{formatDate(bourse.dateLimite)}</div>
              </div>
            )}
            {dl && (
              <div style={{ fontSize:12, color:dl.color, fontWeight:600, padding:'2px 8px', borderRadius:4, background:dl.color+'12', border:`1px solid ${dl.color}30` }}>
                {dl.label} restants
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding:'10px 16px 14px', display:'flex', gap:6, borderTop:'1px solid #f1f5f9' }}>
        <button
          style={{ flex:1, padding:'9px 10px', borderRadius:6, background:'#1a3a6b', border:'none', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}
          onClick={e => { e.stopPropagation(); onClick(); }}
        >
          Voir les détails
        </button>
        <button
          style={{ flex:1, padding:'9px 10px', borderRadius:6, background:applied?'#eff6ff':'#f5a623', border:applied?'1px solid #bfdbfe':'none', color:'#1a3a6b', fontSize:12, fontWeight:600, cursor:applied?'default':'pointer' }}
          onClick={!applied ? async e => { e.stopPropagation(); setApplyLoading(true); await onApply(bourse); setApplyLoading(false); } : undefined}
          disabled={applied || applyLoading}
        >
          {applyLoading ? '⏳' : applied ? '✅ Roadmap' : '🗺️ Postuler'}
        </button>
        <button
          style={{ width:38, height:38, borderRadius:6, background:starred?'#fefce8':'#f8fafc', border:starred?'1px solid #fde68a':'1px solid #e2e8f0', color:starred?'#d97706':'#94a3b8', fontSize:16, cursor:starLoading?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={async e => { e.stopPropagation(); setStarLoading(true); await onStar(bourse, starred); setStarLoading(false); }}
          disabled={starLoading}
        >
          {starred ? '★' : '☆'}
        </button>
        <button
          style={{ width:38, height:38, borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { e.stopPropagation(); onAskAI(bourse); }}
        >
          🤖
        </button>
      </div>
    </div>
  );
}
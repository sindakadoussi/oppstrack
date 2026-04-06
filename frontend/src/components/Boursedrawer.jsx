import React, { useState } from 'react';

function countryFlag(pays) {
  const flags = {
    'France':'🇫🇷','Allemagne':'🇩🇪','Royaume-Uni':'🇬🇧','États-Unis':'🇺🇸',
    'Canada':'🇨🇦','Japon':'🇯🇵','Chine':'🇨🇳','Australie':'🇦🇺',
    'Suisse':'🇨🇭','Pays-Bas':'🇳🇱','Maroc':'🇲🇦','Hongrie':'🇭🇺',
    'Corée du Sud':'🇰🇷','Nouvelle-Zélande':'🇳🇿','Turquie':'🇹🇷',
    'Belgique':'🇧🇪','Espagne':'🇪🇸','Italie':'🇮🇹','Portugal':'🇵🇹',
    'Roumanie':'🇷🇴','Arabie Saoudite':'🇸🇦','Brunei':'🇧🇳',
  };
  return flags[pays] || '🌍';
}

const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.round((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0)   return { label: 'Expirée',       color: '#dc2626' };
  if (diff === 0) return { label: "Aujourd'hui !",  color: '#dc2626' };
  if (diff <= 30) return { label: `${diff} jours`,  color: '#d97706' };
  return               { label: `${diff} jours`,    color: '#16a34a' };
};

const D = {
  tag:      { fontSize:11, padding:'3px 10px', borderRadius:4, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b' },
  tagLight: { fontSize:11, padding:'3px 10px', borderRadius:4, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff' },
  label:    { fontSize:10, fontWeight:700, color:'#1a3a6b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, paddingBottom:6, borderBottom:'2px solid #f5a623', display:'inline-block' },
  infoRow:  { display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:6, background:'#f8fafc', border:'1px solid #e2e8f0' },
  infoIcon: { fontSize:16, flexShrink:0, marginTop:2, color:'#1a3a6b' },
};

export default function BourseDrawer({ bourse, onClose, onAskAI, onChoose, starred, onStar, applied, onApply }) {
  if (!bourse) return null;

  const dl = daysLeft(bourse.dateLimite);
  const [starLoading,  setStarLoading]  = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(26,58,107,0.4)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Panneau latéral */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 901,
        width: 500, maxWidth: '95vw',
        background: '#ffffff',
        borderLeft: '3px solid #f5a623',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.25s ease',
        overflowY: 'auto',
        boxShadow: '-8px 0 32px rgba(26,58,107,0.15)',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 22px 16px', background: '#1a3a6b', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              fontSize: 28, width: 52, height: 52, borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {countryFlag(bourse.pays)}
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 16 }}
            >✕</button>
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: 8, lineHeight: 1.3 }}>
            {bourse.nom}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={D.tagLight}>{countryFlag(bourse.pays)} {bourse.pays}</span>
            {bourse.niveau && <span style={D.tagLight}>🎓 {bourse.niveau}</span>}
            <span style={{ ...D.tagLight, background: 'rgba(245,166,35,0.2)', color: '#f5a623', borderColor: 'rgba(245,166,35,0.3)' }}>
              💰 {bourse.financement || '100% financée'}
            </span>
          </div>
        </div>

        {/* ── Deadline banner ── */}
        {dl && (
          <div style={{
            padding: '10px 22px',
            background: dl.color === '#dc2626' ? '#fef2f2' : dl.color === '#d97706' ? '#fffbeb' : '#f0fdf4',
            borderBottom: `2px solid ${dl.color}30`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>⏰</span>
            <div>
              <div style={{ fontSize: 12, color: dl.color, fontWeight: 700 }}>
                {dl.label === 'Expirée' ? 'Deadline expirée' : `Deadline dans ${dl.label}`}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {bourse.dateLimite && new Date(bourse.dateLimite).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ padding: '20px 22px', flex: 1 }}>

          {/* Description */}
          {bourse.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={D.label}>À propos</div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>{bourse.description}</p>
            </div>
          )}

          {/* Éligibilité */}
          {bourse.eligibilite && Object.values(bourse.eligibilite).some(v => v) && (
            <div style={{ marginBottom: 20 }}>
              <div style={D.label}>Critères d'éligibilité</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bourse.eligibilite.nationalitesEligibles && (
                  <div style={D.infoRow}>
                    <span style={D.infoIcon}>🌍</span>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Nationalités éligibles</div>
                      <div style={{ fontSize: 13, color: '#1a3a6b', fontWeight: 500 }}>{bourse.eligibilite.nationalitesEligibles}</div>
                    </div>
                  </div>
                )}
                {bourse.eligibilite.niveauRequis && (
                  <div style={D.infoRow}>
                    <span style={D.infoIcon}>🎓</span>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Niveau requis</div>
                      <div style={{ fontSize: 13, color: '#1a3a6b', fontWeight: 500 }}>{bourse.eligibilite.niveauRequis}</div>
                    </div>
                  </div>
                )}
                {bourse.eligibilite.ageMax && (
                  <div style={D.infoRow}>
                    <span style={D.infoIcon}>📅</span>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Âge maximum</div>
                      <div style={{ fontSize: 13, color: '#1a3a6b', fontWeight: 500 }}>{bourse.eligibilite.ageMax} ans</div>
                    </div>
                  </div>
                )}
                {bourse.eligibilite.conditionsSpeciales && (
                  <div style={D.infoRow}>
                    <span style={D.infoIcon}>📋</span>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Conditions spéciales</div>
                      <div style={{ fontSize: 13, color: '#1a3a6b', fontWeight: 500 }}>{bourse.eligibilite.conditionsSpeciales}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents requis */}
          {bourse.documentsRequis?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={D.label}>Documents requis ({bourse.documentsRequis.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {bourse.documentsRequis.map((doc, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '8px 12px', borderRadius: 6,
                    background: doc.obligatoire ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${doc.obligatoire ? '#bfdbfe' : '#e2e8f0'}`,
                  }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1, color: doc.obligatoire ? '#1a3a6b' : '#94a3b8' }}>
                      {doc.obligatoire ? '✓' : '○'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: doc.obligatoire ? '#1a3a6b' : '#475569', fontWeight: doc.obligatoire ? 600 : 400 }}>
                        {doc.nom}
                        {!doc.obligatoire && <span style={{ fontSize: 10, marginLeft: 6, color: '#94a3b8' }}>optionnel</span>}
                      </div>
                      {doc.description && doc.description !== 'empty' && (
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{doc.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Détails */}
          <div style={{ marginBottom: 20 }}>
            <div style={D.label}>Détails</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: '📍', label: 'Pays',        val: bourse.pays        },
                { icon: '🎓', label: 'Niveau',      val: bourse.niveau      },
                { icon: '💰', label: 'Financement', val: bourse.financement },
                { icon: '📚', label: 'Domaine',     val: bourse.domaine     },
              ].filter(r => r.val).map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{row.icon}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', width: 80 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: '#1a3a6b', fontWeight: 600, flex: 1 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lien officiel */}
          {bourse.lienOfficiel && (
            <div style={{ marginBottom: 20 }}>
              <div style={D.label}>Lien officiel</div>
              <a
                href={bourse.lienOfficiel} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1a3a6b', fontSize: 13, textDecoration: 'none', wordBreak: 'break-all', fontWeight: 500 }}
              >
                <span>🔗</span><span style={{ flex: 1 }}>{bourse.lienOfficiel}</span><span>↗</span>
              </a>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div style={{ padding: '16px 22px 24px', borderTop: '1px solid #e2e8f0', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' }}>
          <button
            style={{
              width: '100%', padding: 13, borderRadius: 8, border: 'none',
              background: applied ? '#eff6ff' : '#1a3a6b',
              color: applied ? '#1a3a6b' : '#fff',
              fontSize: 14, fontWeight: 700,
              cursor: applied ? 'default' : 'pointer',
              boxShadow: applied ? 'none' : '0 4px 12px rgba(26,58,107,0.25)',
            }}
            onClick={!applied ? async () => { setApplyLoading(true); await onApply(bourse); setApplyLoading(false); onClose(); } : undefined}
            disabled={applied || applyLoading}
          >
            {applyLoading ? '⏳' : applied ? '✅ Déjà dans la roadmap' : '🗺️ Postuler maintenant'}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                flex: 1, padding: 10, borderRadius: 8,
                background: starred ? '#fefce8' : '#ffffff',
                border: starred ? '1px solid #fde68a' : '1px solid #e2e8f0',
                color: starred ? '#d97706' : '#475569',
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}
              onClick={async () => { setStarLoading(true); await onStar(bourse, starred); setStarLoading(false); }}
              disabled={starLoading}
            >
              {starLoading ? '⏳' : starred ? '★ Favori' : '☆ Ajouter aux favoris'}
            </button>
            <button
              style={{ flex: 1, padding: 10, borderRadius: 8, background: '#f5a623', border: 'none', color: '#1a3a6b', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
              onClick={() => { onAskAI(bourse); onClose(); }}
            >
              🤖 Demander à l'IA
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }             to { opacity: 1 }           }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}
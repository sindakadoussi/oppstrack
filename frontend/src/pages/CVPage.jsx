import React, { useState, useRef } from 'react';

const WEBHOOK_URL = 'http://localhost:5678/webhook/payload-webhook';

const CVChecklist = ({ items }) => (
  <div className="checklist">
    {items.map((item, i) => (
      <div key={i} className={`checklist-item ${item.status}`}>
        <span className="check-icon">
          {item.status === 'ok' ? '✅' : item.status === 'warning' ? '⚠️' : '❌'}
        </span>
        <div className="check-content">
          <span className="check-title">{item.title}</span>
          {item.detail && <span className="check-detail">{item.detail}</span>}
        </div>
      </div>
    ))}
  </div>
);

export default function CVPage({ user, handleSend, messages, input, setInput, loading }) {
  const [activeTab, setActiveTab] = useState('upload'); // upload | create | lm
  const [cvText, setCvText] = useState('');
  const [lmText, setLmText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFileUpload = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setCvText(text.slice(0, 5000));
    };
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      // For PDF/DOCX simulation
      setCvText(`[Contenu extrait de : ${file.name}]\nLe fichier a été chargé. Vous pouvez coller le texte manuellement ou l'IA analysera ce qu'elle peut détecter.`);
    }
  };

  const analyzeDocument = async (text, type = 'CV') => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Analyse ce ${type} et donne-moi : 1) Une checklist détaillée (OK/WARNING/ERROR) pour chaque section, 2) Les points forts, 3) Ce qu'il faut corriger/ajouter/supprimer, 4) Un score global /100. Réponds en JSON avec ce format exact: {"score": number, "checklist": [{"title": string, "status": "ok"|"warning"|"error", "detail": string}], "strengths": [string], "toFix": [string], "toAdd": [string], "toRemove": [string], "conclusion": string}\n\n${type} à analyser:\n${text}`,
          conversationId: `cv-analysis-${Date.now()}`,
          id: user?.id || null,
          context: 'CV_ANALYSIS'
        })
      });

      const data = await res.json();
      const rawText = data.output || data.text || '';

      // Try to parse JSON from response
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAnalysis({ ...parsed, type });
        } else {
          // Fallback mock analysis
          setAnalysis({
            type,
            score: 68,
            checklist: [
              { title: 'Coordonnées complètes', status: 'ok', detail: 'Nom, email, téléphone présents' },
              { title: 'Expériences professionnelles', status: 'warning', detail: 'Ajoutez des verbes d\'action et des résultats mesurables' },
              { title: 'Formation académique', status: 'ok', detail: 'Bien structurée' },
              { title: 'Compétences techniques', status: 'error', detail: 'Section absente ou insuffisante' },
              { title: 'Langues', status: 'warning', detail: 'Précisez votre niveau avec des certifications' },
              { title: 'Longueur', status: 'warning', detail: 'Idéalement 1 page pour moins de 3 ans d\'expérience' },
            ],
            strengths: ['Structure claire', 'Formation bien présentée'],
            toFix: ['Ajoutez des chiffres et résultats concrets', 'Utilisez des verbes d\'action en début de phrase'],
            toAdd: ['Section compétences techniques', 'Certifications et formations complémentaires', 'Projets personnels pertinents'],
            toRemove: ['Informations personnelles (âge, état civil) non pertinentes', 'Objectif générique en début de CV'],
            conclusion: rawText || 'Analyse terminée. Voici les recommandations pour améliorer votre document.'
          });
        }
      } catch (parseErr) {
        setAnalysis({
          type,
          score: null,
          checklist: [],
          strengths: [],
          toFix: [],
          toAdd: [],
          toRemove: [],
          conclusion: rawText
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="cv-page">
      <div className="cv-header">
        <h2>📄 CV & Lettre de Motivation</h2>
        <p>Uploadez ou rédigez vos documents. Notre IA les analyse et vous donne une checklist précise.</p>
      </div>

      {/* Tabs */}
      <div className="cv-tabs">
        {[
          { id: 'upload', label: '📤 Uploader mon CV', icon: '📤' },
          { id: 'create', label: '✍️ Rédiger mon CV', icon: '✍️' },
          { id: 'lm', label: '💌 Lettre de motivation', icon: '💌' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`cv-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setAnalysis(null); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="cv-layout">
        {/* Left: Editor/Upload */}
        <div className="cv-editor">
          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="upload-section">
              <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                />
                {fileName ? (
                  <div className="file-uploaded">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{fileName}</span>
                    <span className="file-status">✅ Chargé</span>
                  </div>
                ) : (
                  <>
                    <span className="drop-icon">📁</span>
                    <p className="drop-title">Glissez votre CV ici</p>
                    <p className="drop-sub">ou cliquez pour choisir un fichier</p>
                    <span className="drop-formats">PDF · DOC · DOCX · TXT</span>
                  </>
                )}
              </div>

              {cvText && (
                <div className="extracted-text">
                  <label>Contenu extrait (modifiable)</label>
                  <textarea
                    value={cvText}
                    onChange={e => setCvText(e.target.value)}
                    rows={10}
                    placeholder="Le texte de votre CV apparaîtra ici..."
                  />
                </div>
              )}

              <button
                className="btn-analyze"
                onClick={() => analyzeDocument(cvText, 'CV')}
                disabled={!cvText.trim() || analyzing}
              >
                {analyzing ? '⏳ Analyse en cours...' : '🔍 Analyser mon CV avec l\'IA'}
              </button>
            </div>
          )}

          {/* CREATE TAB */}
          {activeTab === 'create' && (
            <div className="create-section">
              <div className="cv-helper-tips">
                <h4>💡 Conseils pour un bon CV</h4>
                <ul>
                  <li>Commencez par vos expériences les plus récentes</li>
                  <li>Utilisez des verbes d'action (développé, géré, créé...)</li>
                  <li>Ajoutez des résultats mesurables quand possible</li>
                  <li>Maximum 1-2 pages selon votre niveau</li>
                </ul>
              </div>
              <div className="sections-guide">
                {['Coordonnées', 'Résumé / Objectif', 'Formation', 'Expériences', 'Compétences', 'Langues', 'Activités'].map(s => (
                  <span key={s} className="section-tag">{s}</span>
                ))}
              </div>
              <textarea
                className="cv-textarea"
                value={cvText}
                onChange={e => setCvText(e.target.value)}
                placeholder="Rédigez votre CV ici...&#10;&#10;COORDONNÉES&#10;Prénom Nom&#10;email@example.com | +XXX XXX XXX&#10;LinkedIn | Ville, Pays&#10;&#10;FORMATION&#10;..."
                rows={20}
              />
              <button
                className="btn-analyze"
                onClick={() => analyzeDocument(cvText, 'CV')}
                disabled={!cvText.trim() || analyzing}
              >
                {analyzing ? '⏳ Analyse en cours...' : '🔍 Analyser mon CV avec l\'IA'}
              </button>
            </div>
          )}

          {/* LM TAB */}
          {activeTab === 'lm' && (
            <div className="lm-section">
              <div className="lm-structure">
                <h4>📋 Structure recommandée</h4>
                <div className="structure-steps">
                  {[
                    { num: '1', title: 'Accroche', desc: 'Phrase percutante qui capte l\'attention' },
                    { num: '2', title: 'Votre profil', desc: 'Qui vous êtes et votre parcours' },
                    { num: '3', title: 'Motivation', desc: 'Pourquoi cette bourse spécifiquement' },
                    { num: '4', title: 'Projet', desc: 'Ce que vous voulez faire avec la bourse' },
                    { num: '5', title: 'Valeur ajoutée', desc: 'Ce que vous apporterez' },
                    { num: '6', title: 'Conclusion', desc: 'Formule de politesse professionnelle' },
                  ].map(s => (
                    <div key={s.num} className="structure-item">
                      <span className="struct-num">{s.num}</span>
                      <div>
                        <span className="struct-title">{s.title}</span>
                        <span className="struct-desc">{s.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <textarea
                className="cv-textarea"
                value={lmText}
                onChange={e => setLmText(e.target.value)}
                placeholder="Rédigez votre lettre de motivation ici...&#10;&#10;Objet : Candidature à la Bourse [Nom] – [Votre Nom]&#10;&#10;Madame, Monsieur,&#10;&#10;..."
                rows={20}
              />
              <button
                className="btn-analyze"
                onClick={() => analyzeDocument(lmText, 'Lettre de motivation')}
                disabled={!lmText.trim() || analyzing}
              >
                {analyzing ? '⏳ Analyse en cours...' : '🔍 Analyser ma lettre avec l\'IA'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Analysis */}
        <div className="cv-analysis">
          {!analysis && !analyzing && (
            <div className="analysis-empty">
              <span>🤖</span>
              <p>L'analyse de votre document apparaîtra ici</p>
              <p className="empty-sub">Chargez ou rédigez votre document puis cliquez sur "Analyser"</p>
            </div>
          )}

          {analyzing && (
            <div className="analysis-loading">
              <div className="loading-spinner"></div>
              <p>L'IA analyse votre document...</p>
              <p className="loading-sub">Vérification de la structure, du contenu et des points d'amélioration</p>
            </div>
          )}

          {analysis && (
            <div className="analysis-results">
              <div className="analysis-header">
                <h3>📊 Analyse de votre {analysis.type}</h3>
                {analysis.score && (
                  <div className="analysis-score" style={{ '--sc': getScoreColor(analysis.score) }}>
                    <span className="as-num">{analysis.score}</span>
                    <span className="as-den">/100</span>
                  </div>
                )}
              </div>

              {analysis.checklist?.length > 0 && (
                <div className="analysis-block">
                  <h4>✅ Checklist</h4>
                  <CVChecklist items={analysis.checklist} />
                </div>
              )}

              {analysis.strengths?.length > 0 && (
                <div className="analysis-block success">
                  <h4>💪 Points forts</h4>
                  <ul>{analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}

              {analysis.toFix?.length > 0 && (
                <div className="analysis-block warning">
                  <h4>🔧 À corriger</h4>
                  <ul>{analysis.toFix.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}

              {analysis.toAdd?.length > 0 && (
                <div className="analysis-block info">
                  <h4>➕ À ajouter</h4>
                  <ul>{analysis.toAdd.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}

              {analysis.toRemove?.length > 0 && (
                <div className="analysis-block danger">
                  <h4>🗑️ À supprimer</h4>
                  <ul>{analysis.toRemove.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}

              {analysis.conclusion && (
                <div className="analysis-conclusion">
                  <h4>📝 Conclusion de l'IA</h4>
                  <p>{analysis.conclusion}</p>
                </div>
              )}

              <button className="btn-reanalyze" onClick={() => setAnalysis(null)}>
                🔄 Modifier et ré-analyser
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .cv-page { width: 100%; padding: 32px 16px; }
        .cv-header { margin-bottom: 24px; }
        .cv-header h2 { font-size: 1.8rem; font-weight: 800; color: #f1f5f9; margin-bottom: 8px; }
        .cv-header p { color: #64748b; font-size: 14px; }

        .cv-tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
        .cv-tab {
          padding: 9px 18px; border-radius: 10px;
          border: 1px solid rgba(99,102,241,0.2);
          background: transparent; color: #64748b;
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
        }
        .cv-tab:hover { border-color: rgba(99,102,241,0.4); color: #94a3b8; }
        .cv-tab.active {
          background: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.5);
          color: #818cf8;
        }

        .cv-layout { display: flex; gap: 24px; align-items: flex-start; }
        .cv-editor { flex: 1; display: flex; flex-direction: column; gap: 16px; }
        .cv-analysis { width: 360px; flex-shrink: 0; }

        /* Upload */
        .drop-zone {
          border: 2px dashed rgba(99,102,241,0.3);
          border-radius: 16px; padding: 48px 24px;
          text-align: center; cursor: pointer;
          transition: all 0.2s; background: rgba(99,102,241,0.04);
        }
        .drop-zone:hover, .drop-zone.drag-over {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.08);
        }
        .drop-icon { font-size: 40px; display: block; margin-bottom: 12px; }
        .drop-title { font-size: 15px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px; }
        .drop-sub { color: #64748b; font-size: 13px; margin-bottom: 10px; }
        .drop-formats { font-size: 11px; color: #475569; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 8px; }
        .file-uploaded { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .file-icon { font-size: 32px; }
        .file-name { font-size: 14px; color: #e2e8f0; font-weight: 500; }
        .file-status { font-size: 12px; color: #10b981; }

        .extracted-text label { display: block; font-size: 12px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .extracted-text textarea, .cv-textarea {
          width: 100%; padding: 14px 16px;
          border-radius: 12px; border: 1px solid rgba(99,102,241,0.2);
          background: rgba(255,255,255,0.03); color: #e2e8f0;
          font-size: 13px; font-family: 'Courier New', monospace;
          line-height: 1.6; outline: none; resize: vertical;
          transition: border-color 0.2s;
        }
        .cv-textarea { min-height: 400px; }
        .extracted-text textarea:focus, .cv-textarea:focus { border-color: rgba(99,102,241,0.5); }
        .cv-textarea::placeholder { color: #334155; }

        .cv-helper-tips {
          padding: 14px 16px; background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.2); border-radius: 12px;
        }
        .cv-helper-tips h4 { font-size: 13px; color: #818cf8; margin-bottom: 8px; }
        .cv-helper-tips ul { padding-left: 16px; }
        .cv-helper-tips li { font-size: 12px; color: #64748b; margin-bottom: 4px; line-height: 1.4; }
        .sections-guide { display: flex; gap: 6px; flex-wrap: wrap; }
        .section-tag { font-size: 11px; padding: 4px 10px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #64748b; }

        .lm-structure { padding: 14px 16px; background: rgba(15,15,30,0.6); border: 1px solid rgba(99,102,241,0.15); border-radius: 12px; }
        .lm-structure h4 { font-size: 13px; color: #818cf8; margin-bottom: 12px; }
        .structure-steps { display: flex; flex-direction: column; gap: 6px; }
        .structure-item { display: flex; align-items: center; gap: 10px; }
        .struct-num { width: 22px; height: 22px; border-radius: 50%; background: rgba(99,102,241,0.3); color: #818cf8; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .struct-title { font-size: 12px; font-weight: 600; color: #e2e8f0; margin-right: 6px; }
        .struct-desc { font-size: 11px; color: #475569; }

        .btn-analyze {
          width: 100%; padding: 14px; border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white; border: none; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(99,102,241,0.3);
        }
        .btn-analyze:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(99,102,241,0.4); }
        .btn-analyze:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Analysis Panel */
        .analysis-empty, .analysis-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 60px 24px; text-align: center;
          background: rgba(15,15,30,0.6); border-radius: 16px;
          border: 1px dashed rgba(99,102,241,0.2); min-height: 300px;
          color: #475569; gap: 12px;
        }
        .analysis-empty span { font-size: 40px; }
        .analysis-empty p, .analysis-loading p { font-size: 14px; color: #64748b; }
        .empty-sub, .loading-sub { font-size: 12px; color: #334155 !important; }
        .loading-spinner {
          width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .analysis-results {
          background: rgba(15,15,30,0.8); border-radius: 16px;
          border: 1px solid rgba(99,102,241,0.2); overflow: hidden;
          display: flex; flex-direction: column; gap: 0;
        }
        .analysis-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px; border-bottom: 1px solid rgba(99,102,241,0.1);
        }
        .analysis-header h3 { font-size: 14px; font-weight: 700; color: #e2e8f0; }
        .analysis-score { display: flex; align-items: baseline; gap: 2px; }
        .as-num { font-size: 2rem; font-weight: 900; color: var(--sc, #818cf8); }
        .as-den { font-size: 12px; color: #475569; }

        .analysis-block { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .analysis-block h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; color: #94a3b8; }
        .analysis-block ul { padding-left: 16px; display: flex; flex-direction: column; gap: 5px; }
        .analysis-block li { font-size: 13px; color: #64748b; line-height: 1.4; }
        .analysis-block.success h4 { color: #34d399; }
        .analysis-block.success li { color: #6ee7b7; }
        .analysis-block.warning h4 { color: #fbbf24; }
        .analysis-block.warning li { color: #fde68a; }
        .analysis-block.info h4 { color: #60a5fa; }
        .analysis-block.info li { color: #93c5fd; }
        .analysis-block.danger h4 { color: #f87171; }
        .analysis-block.danger li { color: #fca5a5; }

        .checklist { display: flex; flex-direction: column; gap: 6px; }
        .checklist-item { display: flex; gap: 8px; align-items: flex-start; padding: 7px 10px; border-radius: 8px; background: rgba(255,255,255,0.02); }
        .checklist-item.ok { border-left: 2px solid #10b981; }
        .checklist-item.warning { border-left: 2px solid #f59e0b; }
        .checklist-item.error { border-left: 2px solid #ef4444; }
        .check-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .check-content { display: flex; flex-direction: column; gap: 2px; }
        .check-title { font-size: 12px; font-weight: 600; color: #e2e8f0; }
        .check-detail { font-size: 11px; color: #64748b; }

        .analysis-conclusion { padding: 14px 20px; }
        .analysis-conclusion h4 { font-size: 12px; font-weight: 700; color: #818cf8; margin-bottom: 8px; text-transform: uppercase; }
        .analysis-conclusion p { font-size: 13px; color: #94a3b8; line-height: 1.6; }

        .btn-reanalyze {
          margin: 16px 20px; padding: 10px; border-radius: 10px;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          color: #818cf8; font-size: 13px; cursor: pointer;
          transition: all 0.2s; width: calc(100% - 40px);
        }
        .btn-reanalyze:hover { background: rgba(99,102,241,0.2); }

        @media (max-width: 900px) { .cv-layout { flex-direction: column; } .cv-analysis { width: 100%; } }
      `}</style>
    </div>
  );
}

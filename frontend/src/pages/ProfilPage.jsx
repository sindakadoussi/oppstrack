import React, { useState, useEffect } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { WEBHOOK_ROUTES } from '@/config/routes';

const emptyProfile = {
  name: '', email: '', phone: '', dateOfBirth: '',
  nationality: '', countryOfResidence: '',
  linkedin: '', github: '', portfolio: '',
  currentLevel: '', fieldOfStudy: '', institution: '',
  gpa: '', graduationYear: '',
  academicHistory: [], workExperience: [],
  academicProjects: [],
  certifications: [],
  volunteerWork: [],
  publications: [],
  awards: [],
  languages: [], skills: [],
  targetDegree: '', targetCountries: [], targetFields: [],
  motivationSummary: '',
};

// Suggestions pour l'autocomplete
const LANGUAGE_SUGGESTIONS = [
  'Anglais', 'Français', 'Arabe', 'Espagnol', 'Allemand', 'Italien', 
  'Chinois', 'Russe', 'Portugais', 'Japonais', 'Coréen', 'Néerlandais',
  'Turc', 'Polonais', 'Suédois', 'Grec', 'Vietnamien', 'Hindi'
];

const COUNTRY_SUGGESTIONS = [
  'France', 'Canada', 'Belgique', 'Suisse', 'Allemagne', 'Italie', 'Espagne',
  'Royaume-Uni', 'États-Unis', 'Australie', 'Suède', 'Norvège', 'Danemark',
  'Pays-Bas', 'Irlande', 'Autriche', 'Portugal', 'Finlande', 'Tunisie',
  'Maroc', 'Algérie', 'Sénégal', 'Côte d\'Ivoire', 'Cameroun', 'Liban', 'Égypte'
];

const FIELD_SUGGESTIONS = [
  'Informatique', 'Génie logiciel', 'Intelligence Artificielle', 'Data Science',
  'Cybersécurité', 'Réseaux et Télécommunications', 'Systèmes embarqués',
  'Gestion', 'Marketing', 'Finance', 'Comptabilité', 'Ressources Humaines',
  'Droit', 'Sciences politiques', 'Relations internationales',
  'Médecine', 'Pharmacie', 'Biologie', 'Chimie', 'Physique', 'Mathématiques',
  'Architecture', 'Génie civil', 'Génie mécanique', 'Génie électrique',
  'Design', 'Arts', 'Lettres', 'Philosophie', 'Sociologie', 'Psychologie'
];

const SKILL_SUGGESTIONS = {
  language: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin'],
  framework: ['React', 'Angular', 'Vue.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Express.js', 'Next.js', 'Node.js', 'TensorFlow', 'PyTorch'],
  database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server', 'Firebase', 'Cassandra', 'Elasticsearch'],
  tool: ['Git', 'Docker', 'Kubernetes', 'Jenkins', 'Jira', 'Trello', 'Figma', 'Adobe XD', 'Photoshop', 'Premiere Pro'],
  devops: ['AWS', 'Azure', 'Google Cloud', 'Terraform', 'Ansible', 'Prometheus', 'Grafana', 'Linux'],
  method: ['Agile', 'Scrum', 'Kanban', 'Waterfall', 'DevOps', 'CI/CD', 'TDD', 'BDD'],
  design: ['UI/UX Design', 'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'InDesign'],
  other: ['Microsoft Office', 'Excel', 'PowerPoint', 'Word', 'Google Suite', 'Salesforce', 'SAP', 'Oracle']
};

// ── Composant Autocomplete ─────────────────────────────────────────────────
function AutocompleteInput({ value, onChange, suggestions, placeholder, label, type = 'text' }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    if (newValue.trim()) {
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions(suggestions.slice(0, 8));
      setShowSuggestions(true);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  if (type === 'date') {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={S.lbl}>{label}</div>
        <input
          style={S.inp}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={S.lbl}>{label}</div>
      <input
        style={S.inp}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          setFilteredSuggestions(suggestions.slice(0, 8));
          setShowSuggestions(true);
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={S.suggestionsDropdown}>
          {filteredSuggestions.map((s, idx) => (
            <div
              key={idx}
              style={S.suggestionItem}
              onClick={() => handleSelectSuggestion(s)}
              onMouseEnter={(e) => e.target.style.background = '#eff6ff'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Composant SkillInput avec suggestions dynamiques ──────────────────────
function SkillInput({ skill, category, onSkillChange, onCategoryChange, onLevelChange, onDelete }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState(skill || '');

  useEffect(() => {
    setInputValue(skill || '');
  }, [skill]);

  const getSuggestionsForCategory = () => {
    if (!category) return SKILL_SUGGESTIONS.other || [];
    return SKILL_SUGGESTIONS[category] || SKILL_SUGGESTIONS.other || [];
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onSkillChange(newValue);
    
    const suggestions = getSuggestionsForCategory();
    if (newValue.trim()) {
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions(suggestions.slice(0, 8));
      setShowSuggestions(true);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion);
    onSkillChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end', position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <div style={S.lbl}>Compétence / Outil</div>
        <input
          style={S.inp}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            const suggestions = getSuggestionsForCategory();
            setFilteredSuggestions(suggestions.slice(0, 8));
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Ex: Python, React, MySQL..."
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div style={{ ...S.suggestionsDropdown, position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10 }}>
            {filteredSuggestions.map((s, idx) => (
              <div
                key={idx}
                style={S.suggestionItem}
                onClick={() => handleSelectSuggestion(s)}
                onMouseEnter={(e) => e.target.style.background = '#eff6ff'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <div style={S.lbl}>Catégorie</div>
        <select style={S.inp} value={category || ''} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="">Catégorie...</option>
          <option value="language">Langage de programmation</option>
          <option value="framework">Framework / Librairie</option>
          <option value="database">Base de données</option>
          <option value="tool">Outil / Logiciel</option>
          <option value="devops">DevOps / Cloud</option>
          <option value="method">Méthode / Agilité</option>
          <option value="design">Design / UI</option>
          <option value="other">Autre</option>
        </select>
      </div>
      <div>
        <div style={S.lbl}>Niveau</div>
        <select style={S.inp} value={skill.level || ''} onChange={(e) => onLevelChange(e.target.value)}>
          <option value="">Niveau...</option>
          <option value="beginner">Débutant</option>
          <option value="intermediate">Intermédiaire</option>
          <option value="advanced">Avancé</option>
          <option value="expert">Expert</option>
        </select>
      </div>
      <button style={{ ...S.rmBtn, marginTop: 0 }} onClick={onDelete}>✕</button>
    </div>
  );
}

// ── Modal de connexion (magic link) ─────────────────────────────────────────
function LoginModal({ onClose }) {
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { setErrMsg('Email invalide'); return; }
    setStatus('sending');
    try {
      const res = await axiosInstance.post('/api/users/request-magic-link', {
        email: email.trim().toLowerCase(),
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || 'Impossible de contacter le serveur');
    }
  };

  return (
    <div style={M.overlay}>
      <div style={M.box}>
        <div style={M.head}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Connexion à OppsTrack</span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {status === 'idle' && (
            <>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Entrez votre email pour recevoir un <strong style={{ color: '#1a3a6b' }}>lien de connexion magique</strong>.
              </p>
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                autoFocus
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                style={M.input}
              />
              {errMsg && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{errMsg}</div>}
              <button style={M.btn} onClick={send}>✉️ Envoyer le lien magique</button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={M.spinner} />
              <p style={{ color: '#64748b', marginTop: 14 }}>Envoi en cours...</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Lien envoyé !</div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                Vérifiez votre boîte mail (et les spams).<br/>
                Cliquez sur le lien pour vous connecter.
              </p>
              <button style={{ ...M.btn, background: '#166534', marginTop: 20 }} onClick={onClose}>
                ✓ Fermer
              </button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#dc2626', marginBottom: 12 }}>{errMsg}</p>
              <button style={{ ...M.btn, background: '#dc2626' }} onClick={() => { setStatus('idle'); setErrMsg(''); }}>
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={M.backdrop} onClick={onClose} />
    </div>
  );
}

const M = {
  overlay:  { position:'fixed', inset:0, zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' },
  backdrop: { position:'absolute', inset:0, background:'rgba(26,58,107,0.45)', backdropFilter:'blur(6px)' },
  box:      { position:'relative', zIndex:2001, width:400, maxWidth:'92vw', background:'#ffffff', borderRadius:10, overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 20px 48px rgba(26,58,107,0.18)', borderTop:'3px solid #f5a623' },
  head:     { display:'flex', alignItems:'center', gap:10, padding:'16px 20px', background:'#1a3a6b', borderBottom:'1px solid rgba(255,255,255,0.1)' },
  closeBtn: { marginLeft:'auto', background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' },
  body:     { padding:'24px' },
  input:    { width:'100%', padding:'11px 14px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#f8fafc', color:'#1a3a6b', fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:4 },
  btn:      { width:'100%', marginTop:16, padding:'12px', borderRadius:6, border:'none', background:'#1a3a6b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'opacity 0.2s' },
  spinner:  { width:40, height:40, border:'3px solid #eff6ff', borderTopColor:'#1a3a6b', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' },
};

// ── Page Profil ───────────────────────────────────────────────────────────────
export default function ProfilPage({ user, setUser, handleLogout, handleQuickReply }) {
  const [tab,          setTab]          = useState('personal');
  const [profile,      setProfile]      = useState(emptyProfile);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [showLogin,    setShowLogin]    = useState(false);

  useEffect(() => {
    const sp = (() => { try { return JSON.parse(localStorage.getItem('opps_profile') || '{}'); } catch { return {}; } })();
    if (user) {
      setProfile({
        ...emptyProfile, ...sp,
        name:               user.name               || sp.name || '',
        email:              user.email              || '',
        phone:              user.phone              || sp.phone || '',
        nationality:        user.nationality        || sp.nationality || '',
        countryOfResidence: user.countryOfResidence || sp.countryOfResidence || '',
        linkedin:           user.linkedin           || sp.linkedin  || '',
        github:             user.github             || sp.github    || '',
        portfolio:          user.portfolio          || sp.portfolio || '',
        currentLevel:       user.currentLevel       || user.niveau  || '',
        fieldOfStudy:       user.fieldOfStudy       || user.domaine || '',
        institution:        user.institution        || '',
        gpa:                user.gpa?.toString()    || '',
        graduationYear:     user.graduationYear?.toString() || '',
        academicHistory:    user.academicHistory    || [],
        workExperience:     user.workExperience     || [],
        academicProjects:   user.academicProjects   || sp.academicProjects   || [],
        certifications:     user.certifications     || sp.certifications     || [],
        volunteerWork:      user.volunteerWork      || sp.volunteerWork      || [],
        publications:       user.publications       || sp.publications       || [],
        awards:             user.awards             || sp.awards             || [],
        languages:          user.languages          || [],
        skills:             user.skills             || [],
        targetDegree:       user.targetDegree       || '',
        targetCountries:    user.targetCountries    || (user.pays ? [{ country: user.pays }] : []),
        targetFields:       user.targetFields       || [],
        motivationSummary:  user.motivationSummary  || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const body = {
        name: profile.name, pays: profile.targetCountries[0]?.country || '',
        niveau: profile.currentLevel, domaine: profile.fieldOfStudy,
        phone: profile.phone, nationality: profile.nationality,
        countryOfResidence: profile.countryOfResidence,
        currentLevel: profile.currentLevel, fieldOfStudy: profile.fieldOfStudy,
        institution: profile.institution, gpa: profile.gpa,
        graduationYear: profile.graduationYear,
        academicHistory: profile.academicHistory,
        workExperience: profile.workExperience,
        languages: profile.languages, skills: profile.skills,
        targetDegree: profile.targetDegree,
        targetCountries: profile.targetCountries,
        targetFields: profile.targetFields,
        motivationSummary: profile.motivationSummary,
        academicProjects: profile.academicProjects,
        certifications:   profile.certifications,
        volunteerWork:    profile.volunteerWork,
        publications:     profile.publications,
        awards:           profile.awards,
        linkedin:         profile.linkedin,
        github:           profile.github,
        portfolio:        profile.portfolio,
      };
      const { data: result } = await axiosInstance.patch(`/api/users/${user.id}/update-profile`, body);
      const updated = { ...user, ...(result.user || body) };
      localStorage.setItem('opps_user', JSON.stringify(updated));
      localStorage.setItem('opps_profile', JSON.stringify({
        dateOfBirth:      profile.dateOfBirth,
        academicProjects: profile.academicProjects,
        certifications:   profile.certifications,
        volunteerWork:    profile.volunteerWork,
        publications:     profile.publications,
        awards:           profile.awards,
        linkedin:  profile.linkedin,
        github:    profile.github,
        portfolio: profile.portfolio,
      }));
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[ProfilPage]', err.response?.data || err.message);
    } finally {
      setSaving(false);
    }
  };

  const scoreItems = [
    !!profile.name, !!profile.phone, !!profile.nationality,
    !!profile.currentLevel, !!profile.fieldOfStudy, !!profile.institution,
    !!profile.gpa, profile.languages.length > 0, profile.skills.length > 0,
    !!profile.targetDegree, profile.targetCountries.length > 0,
    !!profile.motivationSummary, profile.academicHistory.length > 0,
    profile.workExperience.length > 0, profile.academicProjects.length > 0,
  ];
  const score = Math.round(scoreItems.filter(Boolean).length / scoreItems.length * 100);

  if (!user) return (
    <>
      <div style={S.locked}>
        <div style={S.lockedCard}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>👤</div>
          <h3 style={{ color: '#1a3a6b', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
            Profil non disponible
          </h3>
          <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, maxWidth: 280, textAlign: 'center', margin: '0 0 24px' }}>
            Connectez-vous pour accéder à votre profil et gérer vos candidatures de bourses.
          </p>
          <button style={S.lockBtn} onClick={() => setShowLogin(true)}>
            🔐 Se connecter
          </button>
        </div>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );

  const upd = (field) => (i, key, val) =>
    setProfile(p => { const a = [...p[field]]; a[i] = { ...a[i], [key]: val }; return { ...p, [field]: a }; });
  const add = (field, empty) => () =>
    setProfile(p => ({ ...p, [field]: [...p[field], { ...empty }] }));
  const del = (field) => (i) =>
    setProfile(p => ({ ...p, [field]: p[field].filter((_, j) => j !== i) }));

  const tabs = [
    { id: 'personal',   label: 'Personnel',   icon: '👤' },
    { id: 'academic',   label: 'Formation',   icon: '🎓' },
    { id: 'experience', label: 'Expérience',  icon: '💼' },
    { id: 'projects',   label: 'Projets',     icon: '🚀' },
    { id: 'skills',     label: 'Compétences', icon: '🛠️' },
    { id: 'goals',      label: 'Objectifs',   icon: '🎯' },
  ];

  return (
    <div style={S.page}>
      <div style={S.body}>
        <div style={S.tabBar}>
          {tabs.map(t => (
            <button key={t.id}
              style={{ ...S.tabBtn, ...(tab === t.id ? S.tabOn : {}) }}
              onClick={() => setTab(t.id)}>
              <span style={{ marginRight:4 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab === 'personal' && (
          <div style={S.sec}>
            <T>Informations personnelles</T>
            <div style={S.g2}>
              <F label="Nom complet"       v={profile.name}               s={v => setProfile(p => ({ ...p, name: v }))}               ph="Prénom Nom" />
              <F label="Email"             v={profile.email}              readOnly />
              <F label="Téléphone"         v={profile.phone}              s={v => setProfile(p => ({ ...p, phone: v }))}              ph="+216 XX XXX XXX" />
              <AutocompleteInput 
                label="Date de naissance"
                value={profile.dateOfBirth}
                onChange={v => setProfile(p => ({ ...p, dateOfBirth: v }))}
                suggestions={[]}
                placeholder=""
                type="date"
              />
              <AutocompleteInput
                label="Nationalité"
                value={profile.nationality}
                onChange={v => setProfile(p => ({ ...p, nationality: v }))}
                suggestions={COUNTRY_SUGGESTIONS}
                placeholder="Ex: Tunisienne"
              />
              <AutocompleteInput
                label="Pays de résidence"
                value={profile.countryOfResidence}
                onChange={v => setProfile(p => ({ ...p, countryOfResidence: v }))}
                suggestions={COUNTRY_SUGGESTIONS}
                placeholder="Ex: Tunisie"
              />
            </div>
            <T>Liens professionnels</T>
            <div style={S.g2}>
              <F label="LinkedIn"  v={profile.linkedin}  s={v => setProfile(p => ({ ...p, linkedin: v }))}  ph="linkedin.com/in/votre-profil" />
              <F label="GitHub"    v={profile.github}    s={v => setProfile(p => ({ ...p, github: v }))}    ph="github.com/votre-compte" />
              <div style={{ gridColumn:'1/-1' }}>
                <F label="Portfolio / Site web" v={profile.portfolio} s={v => setProfile(p => ({ ...p, portfolio: v }))} ph="https://votre-site.com" />
              </div>
            </div>
            <T>Distinctions & prix</T>
            {profile.awards.map((a, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label="Titre du prix / distinction" v={a.title}        s={v => upd('awards')(i, 'title', v)}        ph="Ex: Prix Innovation 2024" />
                  <F label="Organisation"                v={a.organization} s={v => upd('awards')(i, 'organization', v)} ph="Ex: Université X" />
                  <F label="Année"                       v={a.year}         s={v => upd('awards')(i, 'year', v)}         ph="2024" />
                  <div style={{ gridColumn:'1/-1' }}>
                    <F label="Description" v={a.description} s={v => upd('awards')(i, 'description', v)} ph="Brève description du prix" />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('awards')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('awards', { title:'', organization:'', year:'', description:'' })}>+ Ajouter une distinction</button>
          </div>
        )}

        {tab === 'academic' && (
          <div style={S.sec}>
            <T>Formation actuelle</T>
            <div style={S.g2}>
              <div>
                <div style={S.lbl}>Niveau actuel</div>
                <select style={S.inp} value={profile.currentLevel} onChange={e => setProfile(p => ({ ...p, currentLevel: e.target.value }))}>
                  <option value="">Sélectionner...</option>
                  {['Licence 1','Licence 2','Licence 3','Master 1','Master 2','Doctorat','Ingénieur 1','Ingénieur 2','Ingénieur 3'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <AutocompleteInput
                label="Domaine d'études"
                value={profile.fieldOfStudy}
                onChange={v => setProfile(p => ({ ...p, fieldOfStudy: v }))}
                suggestions={FIELD_SUGGESTIONS}
                placeholder="Ex: Informatique de Gestion"
              />
              <div style={{ gridColumn:'1/-1' }}>
                <F label="Établissement" v={profile.institution}    s={v => setProfile(p => ({ ...p, institution: v }))}    ph="Ex: ISIMA Mahdia" />
              </div>
              <F label="Moyenne (sur 20)"  v={profile.gpa}            s={v => setProfile(p => ({ ...p, gpa: v }))}            type="number" ph="Ex: 14.5" />
              <F label="Année de diplôme"  v={profile.graduationYear} s={v => setProfile(p => ({ ...p, graduationYear: v }))} type="number" ph="Ex: 2026" />
            </div>
            <T>Historique académique</T>
            {profile.academicHistory.map((h, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label="Diplôme"         v={h.degree}      s={v => upd('academicHistory')(i, 'degree', v)}      ph="Ex: Baccalauréat, Licence..." />
                  <F label="Établissement"   v={h.institution} s={v => upd('academicHistory')(i, 'institution', v)} ph="Ex: Lycée Mixte Mahdia" />
                  <AutocompleteInput
                    label="Domaine"
                    value={h.field}
                    onChange={v => upd('academicHistory')(i, 'field', v)}
                    suggestions={FIELD_SUGGESTIONS}
                    placeholder="Ex: Mathématiques"
                  />
                  <F label="Année"           v={h.year}        s={v => upd('academicHistory')(i, 'year', v)}        ph="2022" />
                  <div style={{ gridColumn:'1/-1' }}>
                    <F label="Mention / Note" v={h.grade}      s={v => upd('academicHistory')(i, 'grade', v)}      ph="Ex: Bien, Très bien, 15/20" />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('academicHistory')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('academicHistory', { degree:'', institution:'', field:'', year:'', grade:'' })}>+ Ajouter un diplôme</button>
            <T>Certifications & formations courtes</T>
            {profile.certifications.map((c, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label="Certification"       v={c.name}       s={v => upd('certifications')(i, 'name', v)}       ph="Ex: AWS, Google Analytics..." />
                  <F label="Organisme émetteur"  v={c.issuer}     s={v => upd('certifications')(i, 'issuer', v)}     ph="Ex: Coursera, Amazon..." />
                  <AutocompleteInput
                    label="Date d'obtention"
                    value={c.date}
                    onChange={v => upd('certifications')(i, 'date', v)}
                    suggestions={[]}
                    placeholder="2024"
                    type="date"
                  />
                  <F label="ID / Lien vérif."    v={c.credential} s={v => upd('certifications')(i, 'credential', v)} ph="URL ou identifiant" />
                </div>
                <button style={S.rmBtn} onClick={() => del('certifications')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('certifications', { name:'', issuer:'', date:'', credential:'' })}>+ Ajouter une certification</button>
            <T>Publications & communications scientifiques</T>
            {profile.publications.map((p, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <F label="Titre complet" v={p.title}   s={v => upd('publications')(i, 'title', v)}   ph="Titre de l'article ou communication" />
                  </div>
                  <F label="Revue / Conférence" v={p.venue}   s={v => upd('publications')(i, 'venue', v)}   ph="Ex: IEEE, Conférence ICSI..." />
                  <F label="Année"              v={p.year}    s={v => upd('publications')(i, 'year', v)}    ph="2024" />
                  <div style={{ gridColumn:'1/-1' }}>
                    <F label="Co-auteurs"       v={p.authors} s={v => upd('publications')(i, 'authors', v)} ph="Noms des co-auteurs" />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('publications')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('publications', { title:'', venue:'', year:'', authors:'' })}>+ Ajouter une publication</button>
          </div>
        )}

        {tab === 'experience' && (
          <div style={S.sec}>
            <T>Expériences professionnelles & stages</T>
            {profile.workExperience.map((w, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <div>
                    <div style={S.lbl}>Type</div>
                    <select style={S.inp} value={w.type || ''} onChange={e => upd('workExperience')(i, 'type', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      <option value="internship">Stage</option>
                      <option value="job">Emploi</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>
                  <F label="Poste"       v={w.position}    s={v => upd('workExperience')(i, 'position', v)}    ph="Ex: Développeur Web Full Stack" />
                  <F label="Entreprise"  v={w.company}     s={v => upd('workExperience')(i, 'company', v)}     ph="Ex: TechCorp Tunis" />
                  <AutocompleteInput
                    label="Ville"
                    value={w.city}
                    onChange={v => upd('workExperience')(i, 'city', v)}
                    suggestions={['Tunis', 'Sfax', 'Sousse', 'Mahdia', 'Monastir', 'Nabeul', 'Bizerte', 'Paris', 'Montreal', 'Casablanca', 'Dakar']}
                    placeholder="Ex: Tunis, Sfax..."
                  />
                  <AutocompleteInput
                    label="Date début"
                    value={w.startDate}
                    onChange={v => upd('workExperience')(i, 'startDate', v)}
                    suggestions={[]}
                    placeholder=""
                    type="date"
                  />
                  <AutocompleteInput
                    label="Date fin"
                    value={w.endDate}
                    onChange={v => upd('workExperience')(i, 'endDate', v)}
                    suggestions={[]}
                    placeholder=""
                    type="date"
                  />
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={S.lbl}>Description des missions & réalisations</div>
                    <textarea style={{ ...S.inp, minHeight:90, resize:'vertical' }}
                      value={w.description || ''} onChange={e => upd('workExperience')(i, 'description', e.target.value)}
                      placeholder="Décrivez vos missions, résultats obtenus, chiffres clés..."/>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <F label="Technologies utilisées" v={w.technologies} s={v => upd('workExperience')(i, 'technologies', v)} ph="Ex: React, Laravel, MySQL, Docker..." />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('workExperience')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('workExperience', { position:'', company:'', city:'', startDate:'', endDate:'', description:'', type:'internship', technologies:'' })}>+ Ajouter une expérience</button>
            <T>Bénévolat & associations</T>
            {profile.volunteerWork.map((v, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label="Rôle"         v={v.role}         s={val => upd('volunteerWork')(i, 'role', val)}         ph="Ex: Team Manager, Membre actif..." />
                  <F label="Organisation" v={v.organization} s={val => upd('volunteerWork')(i, 'organization', val)} ph="Ex: JCI, Club Microsoft ISIMA..." />
                  <AutocompleteInput
                    label="Début"
                    value={v.startDate}
                    onChange={val => upd('volunteerWork')(i, 'startDate', val)}
                    suggestions={[]}
                    placeholder="2022"
                    type="date"
                  />
                  <AutocompleteInput
                    label="Fin"
                    value={v.endDate}
                    onChange={val => upd('volunteerWork')(i, 'endDate', val)}
                    suggestions={[]}
                    placeholder="2024 ou En cours"
                    type="date"
                  />
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={S.lbl}>Description</div>
                    <textarea style={{ ...S.inp, minHeight:70, resize:'vertical' }}
                      value={v.description || ''} onChange={e => upd('volunteerWork')(i, 'description', e.target.value)}
                      placeholder="Responsabilités, compétences développées, impact..."/>
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('volunteerWork')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('volunteerWork', { role:'', organization:'', startDate:'', endDate:'', description:'' })}>+ Ajouter une activité</button>
          </div>
        )}

        {tab === 'projects' && (
          <div style={S.sec}>
            <T>Projets académiques</T>
            <div style={{ fontSize:12, color:'#1a3a6b', padding:'10px 14px', borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe', lineHeight:1.6 }}>
              💡 Les projets académiques sont essentiels pour un CV de bourse — ils montrent vos compétences pratiques, votre capacité à mener un projet et les technologies maîtrisées.
            </div>
            {profile.academicProjects.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 20px', color:'#64748b' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>🚀</div>
                <div style={{ fontWeight:600, color:'#1a3a6b', marginBottom:6 }}>Aucun projet ajouté</div>
                <div style={{ fontSize:13 }}>Ajoutez vos projets : PFE, projets de cours, projets personnels, startups...</div>
              </div>
            )}
            {profile.academicProjects.map((p, i) => (
              <div key={i} style={S.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontWeight:700, color:'#1a3a6b', fontSize:13 }}>Projet #{i+1} {p.title ? `— ${p.title}` : ''}</div>
                  <button style={S.rmBtn} onClick={() => del('academicProjects')(i)}>✕ Supprimer</button>
                </div>
                <div style={S.g2}>
                  <div style={{ gridColumn:'1/-1' }}>
                    <F label="Titre du projet" v={p.title} s={v => upd('academicProjects')(i, 'title', v)} ph="Ex: Système de gestion des étalonnages" />
                  </div>
                  <div>
                    <div style={S.lbl}>Type de projet</div>
                    <select style={S.inp} value={p.type || ''} onChange={e => upd('academicProjects')(i, 'type', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      <option value="pfe">Projet de Fin d'Études (PFE)</option>
                      <option value="academic">Projet de cours / académique</option>
                      <option value="personal">Projet personnel</option>
                      <option value="entrepreneurial">Projet entrepreneurial</option>
                      <option value="research">Projet de recherche</option>
                    </select>
                  </div>
                  <div>
                    <div style={S.lbl}>Taille de l'équipe</div>
                    <select style={S.inp} value={p.teamSize || ''} onChange={e => upd('academicProjects')(i, 'teamSize', e.target.value)}>
                      <option value="">Sélectionner...</option>
                      <option value="solo">Projet individuel</option>
                      <option value="2">2 personnes</option>
                      <option value="3-5">3 à 5 personnes</option>
                      <option value="6+">Plus de 5 personnes</option>
                    </select>
                  </div>
                  <F label="Encadrant / Professeur" v={p.supervisor}   s={v => upd('academicProjects')(i, 'supervisor', v)}   ph="Ex: Prof. Ben Ali" />
                  <F label="Année"                  v={p.year}         s={v => upd('academicProjects')(i, 'year', v)}         ph="2024" />
                  <AutocompleteInput
                    label="Date début"
                    value={p.startDate}
                    onChange={v => upd('academicProjects')(i, 'startDate', v)}
                    suggestions={[]}
                    placeholder="Ex: 2023-09"
                    type="date"
                  />
                  <AutocompleteInput
                    label="Date fin"
                    value={p.endDate}
                    onChange={v => upd('academicProjects')(i, 'endDate', v)}
                    suggestions={[]}
                    placeholder="Ex: 2024-06 ou En cours"
                    type="date"
                  />
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={S.lbl}>Description du projet</div>
                    <textarea style={{ ...S.inp, minHeight:100, resize:'vertical' }}
                      value={p.description || ''} onChange={e => upd('academicProjects')(i, 'description', e.target.value)}
                      placeholder="Objectif, fonctionnalités développées, problème résolu, résultats obtenus..."/>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <F label="Langages & outils utilisés" v={p.technologies} s={v => upd('academicProjects')(i, 'technologies', v)} ph="Ex: HTML, CSS, JavaScript, PHP, MySQL..." />
                  </div>
                  <F label="Lien GitHub / Démo" v={p.link}   s={v => upd('academicProjects')(i, 'link', v)}   ph="https://github.com/..." />
                  <F label="Impact / Résultats"  v={p.impact} s={v => upd('academicProjects')(i, 'impact', v)} ph="Ex: Déployé en production, prix reçu..." />
                </div>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('academicProjects', { title:'', type:'', supervisor:'', year:'', startDate:'', endDate:'', description:'', technologies:'', link:'', teamSize:'', impact:'' })}>
              + Ajouter un projet académique
            </button>
          </div>
        )}

        {tab === 'skills' && (
          <div style={S.sec}>
            <T>Langues</T>
            {profile.languages.map((l, i) => (
              <div key={i} style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <AutocompleteInput
                  label="Langue"
                  value={l.language}
                  onChange={(v) => upd('languages')(i, 'language', v)}
                  suggestions={LANGUAGE_SUGGESTIONS}
                  placeholder="Ex: Anglais, Français..."
                />
                <div>
                  <div style={S.lbl}>Niveau CECRL</div>
                  <select style={S.inp} value={l.level} onChange={e => upd('languages')(i, 'level', e.target.value)}>
                    <option value="">Niveau...</option>
                    {['A1','A2','B1','B2','C1','C2','Natif'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <AutocompleteInput
                  label="Certificat"
                  value={l.certificate}
                  onChange={(v) => upd('languages')(i, 'certificate', v)}
                  suggestions={['IELTS', 'TOEIC', 'TOEFL', 'DELF', 'DALF', 'Cambridge', 'Goethe', 'DELE', 'HSK', 'TEF', 'TCF']}
                  placeholder="Ex: IELTS 7.5, TOEIC 900"
                />
                <button style={{ ...S.rmBtn, marginTop: 0 }} onClick={() => del('languages')(i)}>✕</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('languages', { language:'', level:'', certificate:'' })}>+ Ajouter une langue</button>
            <T>Compétences techniques</T>
            <div style={{ fontSize:12, color:'#1a3a6b', padding:'8px 12px', borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe', marginBottom:4 }}>
              💡 Regroupez par catégorie : Langages de programmation, Frameworks, Bases de données, Outils DevOps...
            </div>
            {profile.skills.map((sk, i) => (
              <SkillInput
                key={i}
                skill={sk.skill}
                category={sk.category}
                onSkillChange={(v) => upd('skills')(i, 'skill', v)}
                onCategoryChange={(v) => upd('skills')(i, 'category', v)}
                onLevelChange={(v) => upd('skills')(i, 'level', v)}
                onDelete={() => del('skills')(i)}
              />
            ))}
            <button style={S.addBtn} onClick={add('skills', { skill:'', level:'', category:'' })}>+ Ajouter une compétence</button>
          </div>
        )}

        {tab === 'goals' && (
          <div style={S.sec}>
            <T>Projet d'études à l'étranger</T>
            <div style={S.g2}>
              <div>
                <div style={S.lbl}>Niveau visé</div>
                <select style={S.inp} value={profile.targetDegree} onChange={e => setProfile(p => ({ ...p, targetDegree: e.target.value }))}>
                  <option value="">Sélectionner...</option>
                  {['Licence','Master','Doctorat','Ingénieur','Formation courte','Résidence de recherche'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div/>
            </div>
            <div>
              <div style={S.lbl}>Pays cibles</div>
              {profile.targetCountries.map((c, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <AutocompleteInput
                    label=""
                    value={c.country}
                    onChange={v => upd('targetCountries')(i, 'country', v)}
                    suggestions={COUNTRY_SUGGESTIONS}
                    placeholder="Ex: France, Canada, Belgique, Allemagne..."
                  />
                  <button style={S.rmBtn} onClick={() => del('targetCountries')(i)}>✕</button>
                </div>
              ))}
              <button style={S.addBtn} onClick={add('targetCountries', { country:'' })}>+ Ajouter un pays</button>
            </div>
            <div>
              <div style={S.lbl}>Domaines visés</div>
              {profile.targetFields.map((f, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <AutocompleteInput
                    label=""
                    value={f.field}
                    onChange={v => upd('targetFields')(i, 'field', v)}
                    suggestions={FIELD_SUGGESTIONS}
                    placeholder="Ex: Intelligence Artificielle, Data Science, Génie logiciel..."
                  />
                  <button style={S.rmBtn} onClick={() => del('targetFields')(i)}>✕</button>
                </div>
              ))}
              <button style={S.addBtn} onClick={add('targetFields', { field:'' })}>+ Ajouter un domaine</button>
            </div>
            <div>
              <div style={S.lbl}>Résumé de motivation</div>
              <textarea style={{ ...S.inp, minHeight:150, resize:'vertical' }}
                value={profile.motivationSummary}
                onChange={e => setProfile(p => ({ ...p, motivationSummary: e.target.value }))}
                placeholder="Décrivez vos motivations, votre projet professionnel, pourquoi vous voulez étudier à l'étranger, vos ambitions..."/>
              <div style={{ color:'#64748b', fontSize:12, textAlign:'right', marginTop:4 }}>
                {profile.motivationSummary.length} caractères
                {profile.motivationSummary.length > 0 && profile.motivationSummary.length < 200 && (
                  <span style={{ color:'#d97706', marginLeft:8 }}>Recommandé : minimum 200 caractères</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={S.footer}>
          <button style={S.chatBtn} onClick={() => handleQuickReply('Je veux mettre à jour mon profil')}>
            🤖 Mettre à jour via l'IA
          </button>
          <button
            style={{ ...S.saveBtn, background: saved ? '#166534' : '#1a3a6b' }}
            onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Sauvegarde...' : saved ? '✅ Sauvegardé !' : '💾 Sauvegarder le profil'}
          </button>
          <button style={S.logoutBtn} onClick={handleLogout}>↩ Déconnexion</button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function T({ children }) {
  return (
    <div style={{ color:'#1a3a6b', fontSize:'0.88rem', fontWeight:700, paddingBottom:8, borderBottom:'2px solid #f5a623', letterSpacing:'0.02em', marginTop:8, display:'flex', alignItems:'center', gap:8 }}>
      {children}
    </div>
  );
}

function F({ label, v, s, ph, type = 'text', readOnly = false }) {
  return (
    <div>
      <div style={S.lbl}>{label}</div>
      <input
        style={{ ...S.inp, ...(readOnly ? { opacity:0.5, cursor:'not-allowed' } : {}) }}
        type={type} value={v || ''}
        onChange={e => s?.(e.target.value)}
        placeholder={ph} readOnly={readOnly}
      />
    </div>
  );
}

const S = {
  page:      { width:'100%', fontFamily:"'Segoe UI',system-ui,sans-serif", color:'#1a3a6b', background:'#f8f9fc', minHeight:'100vh' },
  locked:    { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f9fc', padding:24 },
  lockedCard:{ display:'flex', flexDirection:'column', alignItems:'center', background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:12, padding:'48px 40px', boxShadow:'0 4px 20px rgba(26,58,107,0.08)', maxWidth:380, width:'100%' },
  lockBtn:   { padding:'12px 32px', borderRadius:6, background:'#1a3a6b', color:'white', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' },
  body:      { maxWidth:880, margin:'0 auto', padding:'24px 20px' },
  tabBar:    { display:'flex', gap:3, marginBottom:22, background:'#ffffff', padding:4, borderRadius:8, border:'1px solid #e2e8f0', flexWrap:'wrap', boxShadow:'0 1px 4px rgba(26,58,107,0.06)' },
  tabBtn:    { flex:1, minWidth:80, padding:'8px 6px', borderRadius:6, border:'none', cursor:'pointer', background:'transparent', color:'#64748b', fontWeight:500, fontSize:'0.78rem', transition:'all 0.2s', whiteSpace:'nowrap', fontFamily:'inherit' },
  tabOn:     { background:'#1a3a6b', color:'#fff', fontWeight:700 },
  sec:       { display:'flex', flexDirection:'column', gap:14 },
  g2:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  lbl:       { color:'#64748b', fontSize:'0.72rem', fontWeight:700, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' },
  inp:       { width:'100%', padding:'9px 13px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#ffffff', color:'#1a3a6b', fontSize:'0.88rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border .15s' },
  card:      { background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:8, padding:16, marginBottom:6, boxShadow:'0 1px 4px rgba(26,58,107,0.04)' },
  addBtn:    { background:'transparent', border:'1.5px dashed #bfdbfe', color:'#1a3a6b', padding:'8px 16px', borderRadius:6, cursor:'pointer', fontSize:'0.82rem', fontWeight:600, transition:'all .15s', fontFamily:'inherit' },
  rmBtn:     { background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'4px 10px', borderRadius:4, cursor:'pointer', fontSize:'0.75rem', marginTop:8, fontFamily:'inherit' },
  footer:    { display:'flex', gap:10, marginTop:24, paddingTop:18, borderTop:'2px solid #f5a623', flexWrap:'wrap' },
  saveBtn:   { flex:2, padding:11, borderRadius:6, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.3s', fontFamily:'inherit' },
  chatBtn:   { flex:1, padding:11, borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  logoutBtn: { padding:'11px 16px', borderRadius:6, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxHeight: 200,
    overflowY: 'auto',
    zIndex: 1000,
    marginTop: 2
  },
  suggestionItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    color: '#1a3a6b',
    transition: 'background 0.15s'
  },
};
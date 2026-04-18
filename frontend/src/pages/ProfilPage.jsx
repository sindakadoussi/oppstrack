// ProfilPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { WEBHOOK_ROUTES } from '@/config/routes';
import { useT } from '../i18n';

// ==================== DONNÉES STATIQUES (suggestions, traductions) ====================
// ... (garder tous les CONSTANTS et SUGGESTIONS de l'original) ...
// Je les réinclus brièvement pour que le fichier soit autonome, mais vous pouvez garder votre version.
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
  avatar: null, // ID du média Payload
};

const LANGUAGE_SUGGESTIONS = [
  'Anglais', 'Français', 'Arabe', 'Espagnol', 'Allemand', 'Italien',
  'Chinois', 'Russe', 'Portugais', 'Japonais', 'Coréen', 'Néerlandais'
];

const COUNTRY_SUGGESTIONS = [
  'France', 'Canada', 'Belgique', 'Suisse', 'Allemagne', 'Italie', 'Espagne',
  'Royaume-Uni', 'États-Unis', 'Australie', 'Tunisie', 'Maroc', 'Algérie'
];

const FIELD_SUGGESTIONS = [
  'Informatique', 'Génie logiciel', 'Intelligence Artificielle', 'Data Science',
  'Cybersécurité', 'Gestion', 'Marketing', 'Finance', 'Droit', 'Médecine'
];

const SKILL_SUGGESTIONS = {
  language: ['Python', 'JavaScript', 'Java', 'C++', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin'],
  framework: ['React', 'Angular', 'Vue.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Node.js'],
  database: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'Oracle'],
  tool: ['Git', 'Docker', 'Kubernetes', 'Jenkins', 'Jira', 'Figma', 'Photoshop'],
  devops: ['AWS', 'Azure', 'Google Cloud', 'Terraform', 'Ansible', 'Linux'],
  method: ['Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD'],
  design: ['UI/UX Design', 'Figma', 'Sketch', 'Adobe XD', 'Illustrator'],
  other: ['Microsoft Office', 'Excel', 'Salesforce', 'SAP']
};

const SUGGESTION_TRANSLATIONS = {
  countries: { 'France': 'France', 'Canada': 'Canada', 'Belgique': 'Belgium', 'Suisse': 'Switzerland', 'Allemagne': 'Germany', 'Italie': 'Italy', 'Espagne': 'Spain', 'Royaume-Uni': 'United Kingdom', 'États-Unis': 'United States', 'Australie': 'Australia', 'Tunisie': 'Tunisia', 'Maroc': 'Morocco', 'Algérie': 'Algeria' },
  fields: { 'Informatique': 'Computer Science', 'Génie logiciel': 'Software Engineering', 'Intelligence Artificielle': 'Artificial Intelligence', 'Data Science': 'Data Science', 'Cybersécurité': 'Cybersecurity', 'Gestion': 'Management', 'Marketing': 'Marketing', 'Finance': 'Finance', 'Droit': 'Law', 'Médecine': 'Medicine' },
  languages: { 'Anglais': 'English', 'Français': 'French', 'Arabe': 'Arabic', 'Espagnol': 'Spanish', 'Allemand': 'German', 'Italien': 'Italian', 'Chinois': 'Chinese', 'Russe': 'Russian', 'Portugais': 'Portuguese', 'Japonais': 'Japanese', 'Coréen': 'Korean', 'Néerlandais': 'Dutch' },
  degreeLevels: { 'Licence 1': 'Bachelor Year 1', 'Licence 2': 'Bachelor Year 2', 'Licence 3': 'Bachelor Year 3', 'Master 1': 'Master Year 1', 'Master 2': 'Master Year 2', 'Doctorat': 'PhD', 'Ingénieur 1': 'Engineering Year 1', 'Ingénieur 2': 'Engineering Year 2', 'Ingénieur 3': 'Engineering Year 3' },
  workTypes: { internship: (lang) => lang === 'fr' ? 'Stage' : 'Internship', job: (lang) => lang === 'fr' ? 'Emploi' : 'Job', freelance: 'Freelance' },
  skillCategories: { language: (lang) => lang === 'fr' ? 'Langage de programmation' : 'Programming language', framework: (lang) => lang === 'fr' ? 'Framework / Librairie' : 'Framework / Library', database: (lang) => lang === 'fr' ? 'Base de données' : 'Database', tool: (lang) => lang === 'fr' ? 'Outil / Logiciel' : 'Tool / Software', devops: (lang) => lang === 'fr' ? 'DevOps / Cloud' : 'DevOps / Cloud', method: (lang) => lang === 'fr' ? 'Méthode / Agilité' : 'Method / Agile', design: (lang) => lang === 'fr' ? 'Design / UI' : 'Design / UI', other: (lang) => lang === 'fr' ? 'Autre' : 'Other' },
  skillLevels: { beginner: (lang) => lang === 'fr' ? 'Débutant' : 'Beginner', intermediate: (lang) => lang === 'fr' ? 'Intermédiaire' : 'Intermediate', advanced: (lang) => lang === 'fr' ? 'Avancé' : 'Advanced', expert: (lang) => lang === 'fr' ? 'Expert' : 'Expert' },
  projectTypes: { pfe: (lang) => lang === 'fr' ? 'Projet de Fin d\'Études (PFE)' : 'Final Year Project', academic: (lang) => lang === 'fr' ? 'Projet de cours / académique' : 'Course / academic project', personal: (lang) => lang === 'fr' ? 'Projet personnel' : 'Personal project', entrepreneurial: (lang) => lang === 'fr' ? 'Projet entrepreneurial' : 'Entrepreneurial project', research: (lang) => lang === 'fr' ? 'Projet de recherche' : 'Research project' },
  teamSizes: { solo: (lang) => lang === 'fr' ? 'Projet individuel' : 'Individual project', '2': '2 people', '3-5': '3-5 people', '6+': (lang) => lang === 'fr' ? 'Plus de 5 personnes' : 'More than 5 people' }
};

// ==================== FONCTION DE TRADUCTION DES SUGGESTIONS ====================
const getSuggestionDisplay = (value, category, lang) => {
  if (!value || lang === 'fr') return value;
  switch(category) {
    case 'countries': return SUGGESTION_TRANSLATIONS.countries?.[value] || value;
    case 'fields': return SUGGESTION_TRANSLATIONS.fields?.[value] || value;
    case 'languages': return SUGGESTION_TRANSLATIONS.languages?.[value] || value;
    default: return value;
  }
};

// ==================== COMPOSANTS RÉUTILISABLES ====================
function AutocompleteInput({ value, onChange, suggestions, placeholder, label, type = 'text', category = null }) {
  const { lang } = useT();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState(value || '');
  const [selectedOriginal, setSelectedOriginal] = useState(value || '');

  useEffect(() => {
    setInputValue(getSuggestionDisplay(value, category, lang) || '');
    setSelectedOriginal(value || '');
  }, [value, category, lang]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const originalMatch = suggestions.find(s => 
      s.toLowerCase().includes(newValue.toLowerCase()) ||
      getSuggestionDisplay(s, category, lang)?.toLowerCase().includes(newValue.toLowerCase())
    );
    if (originalMatch) {
      setSelectedOriginal(originalMatch);
      onChange(originalMatch);
    } else {
      setSelectedOriginal(newValue);
      onChange(newValue);
    }
    if (newValue.trim()) {
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(newValue.toLowerCase()) ||
        getSuggestionDisplay(s, category, lang)?.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions(suggestions.slice(0, 8));
      setShowSuggestions(true);
    }
  };

  const handleSelectSuggestion = (originalValue) => {
    const displayValue = getSuggestionDisplay(originalValue, category, lang);
    setInputValue(displayValue);
    setSelectedOriginal(originalValue);
    onChange(originalValue);
    setShowSuggestions(false);
  };

  if (type === 'date') {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={S.lbl}>{label}</div>
        <input style={S.inp} type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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
          {filteredSuggestions.map((original, idx) => {
            const display = getSuggestionDisplay(original, category, lang);
            return (
              <div
                key={idx}
                style={S.suggestionItem}
                onClick={() => handleSelectSuggestion(original)}
                onMouseEnter={(e) => e.target.style.background = '#eff6ff'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                {display}
                {lang !== 'fr' && display !== original && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 6 }}>({original})</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SkillInput({ skill, category, onSkillChange, onCategoryChange, onLevelChange, onDelete }) {
  const { lang } = useT();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState(skill || '');

  useEffect(() => { setInputValue(skill || ''); }, [skill]);

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
      const filtered = suggestions.filter(s => s.toLowerCase().includes(newValue.toLowerCase()));
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
        <div style={S.lbl}>{lang === 'fr' ? 'Compétence / Outil' : 'Skill / Tool'}</div>
        <input style={S.inp} type="text" value={inputValue} onChange={handleInputChange}
          onFocus={() => { const s = getSuggestionsForCategory(); setFilteredSuggestions(s.slice(0,8)); setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={lang === 'fr' ? 'Ex: Python, React, MySQL...' : 'Ex: Python, React, MySQL...'} />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div style={{ ...S.suggestionsDropdown, position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10 }}>
            {filteredSuggestions.map((s, idx) => (
              <div key={idx} style={S.suggestionItem} onClick={() => handleSelectSuggestion(s)}
                onMouseEnter={(e) => e.target.style.background = '#eff6ff'} onMouseLeave={(e) => e.target.style.background = 'white'}>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <div style={S.lbl}>{lang === 'fr' ? 'Catégorie' : 'Category'}</div>
        <select style={S.inp} value={category || ''} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="">{lang === 'fr' ? 'Catégorie...' : 'Category...'}</option>
          <option value="language">{SUGGESTION_TRANSLATIONS.skillCategories.language(lang)}</option>
          <option value="framework">{SUGGESTION_TRANSLATIONS.skillCategories.framework(lang)}</option>
          <option value="database">{SUGGESTION_TRANSLATIONS.skillCategories.database(lang)}</option>
          <option value="tool">{SUGGESTION_TRANSLATIONS.skillCategories.tool(lang)}</option>
          <option value="devops">{SUGGESTION_TRANSLATIONS.skillCategories.devops(lang)}</option>
          <option value="method">{SUGGESTION_TRANSLATIONS.skillCategories.method(lang)}</option>
          <option value="design">{SUGGESTION_TRANSLATIONS.skillCategories.design(lang)}</option>
          <option value="other">{SUGGESTION_TRANSLATIONS.skillCategories.other(lang)}</option>
        </select>
      </div>
      <div>
        <div style={S.lbl}>{lang === 'fr' ? 'Niveau' : 'Level'}</div>
        <select style={S.inp} value={skill?.level || ''} onChange={(e) => onLevelChange(e.target.value)}>
          <option value="">{lang === 'fr' ? 'Niveau...' : 'Level...'}</option>
          <option value="beginner">{SUGGESTION_TRANSLATIONS.skillLevels.beginner(lang)}</option>
          <option value="intermediate">{SUGGESTION_TRANSLATIONS.skillLevels.intermediate(lang)}</option>
          <option value="advanced">{SUGGESTION_TRANSLATIONS.skillLevels.advanced(lang)}</option>
          <option value="expert">{SUGGESTION_TRANSLATIONS.skillLevels.expert(lang)}</option>
        </select>
      </div>
      <button style={{ ...S.rmBtn, marginTop: 0 }} onClick={onDelete}>✕</button>
    </div>
  );
}

// ==================== COMPOSANT DE TÉLÉCHARGEMENT AVATAR ====================
function AvatarUploader({ avatarId, onUpload, lang }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (avatarId) {
      axiosInstance.get(`/api/media/${avatarId}`)
        .then(res => setPreview(res.data.url))
        .catch(() => setPreview(null));
    } else {
      setPreview(null);
    }
  }, [avatarId]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axiosInstance.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const mediaId = res.data.doc.id;
      onUpload(mediaId);
      setPreview(res.data.doc.url);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!avatarId) return;
    try {
      await axiosInstance.delete(`/api/media/${avatarId}`);
      onUpload(null);
      setPreview(null);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={S.avatarContainer}>
        {preview ? <img src={preview} alt="Avatar" style={S.avatarImg} /> : <span style={{ fontSize: 48 }}>👤</span>}
      </div>
      <label style={{ ...S.uploadBtn, fontSize: 12, padding: '4px 12px' }}>
        {uploading ? (lang === 'fr' ? 'Envoi...' : 'Uploading...') : (lang === 'fr' ? 'Changer la photo' : 'Change photo')}
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={uploading} />
      </label>
      {preview && (
        <button style={{ ...S.deleteAvatarBtn, fontSize: 12, padding: '4px 12px' }} onClick={handleDelete}>
          ✕ {lang === 'fr' ? 'Supprimer' : 'Remove'}
        </button>
      )}
    </div>
  );
}

// ==================== PAGE PROFIL PRINCIPALE ====================
export default function ProfilPage({ user, setUser, handleLogout, handleQuickReply, onOpenChatWithMessage }) {
  const { lang } = useT();
  const [tab, setTab] = useState('personal');
  const [profile, setProfile] = useState(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Nouveaux états pour les fonctionnalités
  const [completionScore, setCompletionScore] = useState(0);
  const [badges, setBadges] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [matchedScholarships, setMatchedScholarships] = useState([]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');

  // Chargement du profil depuis user et localStorage
  useEffect(() => {
  const sp = (() => { try { return JSON.parse(localStorage.getItem('opps_profile') || '{}'); } catch { return {}; } })();
  if (user) {
    setProfile({
      ...emptyProfile, ...sp,
      name: user.name || sp.name || '',
      email: user.email || '',
      phone: user.phone || sp.phone || '',
      nationality: user.nationality || sp.nationality || '',
      countryOfResidence: user.countryOfResidence || sp.countryOfResidence || '',
      linkedin: user.linkedin || sp.linkedin || '',
      github: user.github || sp.github || '',
      portfolio: user.portfolio || sp.portfolio || '',
      currentLevel: user.currentLevel || user.niveau || '',
      fieldOfStudy: user.fieldOfStudy || user.domaine || '',
      institution: user.institution || '',
      gpa: user.gpa?.toString() || '',
      graduationYear: user.graduationYear?.toString() || '',
      academicHistory: user.academicHistory || [],
      workExperience: user.workExperience || [],
      academicProjects: user.academicProjects || sp.academicProjects || [],
      certifications: user.certifications || sp.certifications || [],
      volunteerWork: user.volunteerWork || sp.volunteerWork || [],
      publications: user.publications || sp.publications || [],
      awards: user.awards || sp.awards || [],
      languages: user.languages || [],
      skills: user.skills || [],
      targetDegree: user.targetDegree || '',
      targetCountries: user.targetCountries || (user.pays ? [{ country: user.pays }] : []),
      targetFields: user.targetFields || [],
      motivationSummary: user.motivationSummary || '',
      avatar: (typeof user.avatar === 'string') ? user.avatar : (user.avatar?.id || null),
    });
  }
}, [user]);

  // Calcul du score de complétude et des badges
  useEffect(() => {
    const scoreItems = [
      !!profile.name, !!profile.phone, !!profile.nationality,
      !!profile.currentLevel, !!profile.fieldOfStudy, !!profile.institution,
      !!profile.gpa, profile.languages.length > 0, profile.skills.length > 0,
      !!profile.targetDegree, profile.targetCountries.length > 0,
      !!profile.motivationSummary, profile.academicHistory.length > 0,
      profile.workExperience.length > 0, profile.academicProjects.length > 0,
      profile.certifications.length > 0, profile.volunteerWork.length > 0,
      profile.publications.length > 0, profile.awards.length > 0,
    ];
    const rawScore = Math.round((scoreItems.filter(Boolean).length / scoreItems.length) * 100);
    setCompletionScore(rawScore);

    const newBadges = [];
    if (profile.name && profile.phone && profile.nationality) newBadges.push({ id: 'profile', name: lang === 'fr' ? '🌟 Profile Starter' : '🌟 Profile Starter', icon: '📝' });
    if (profile.languages.length >= 2) newBadges.push({ id: 'polyglot', name: lang === 'fr' ? '🗣️ Polyglotte' : '🗣️ Polyglot', icon: '🌍' });
    if (profile.skills.length >= 5) newBadges.push({ id: 'tech', name: lang === 'fr' ? '⚙️ Tech Lover' : '⚙️ Tech Lover', icon: '💻' });
    if (profile.academicProjects.length >= 2) newBadges.push({ id: 'project', name: lang === 'fr' ? '🚀 Project Builder' : '🚀 Project Builder', icon: '📁' });
    if (profile.workExperience.length >= 1) newBadges.push({ id: 'work', name: lang === 'fr' ? '💼 Experienced' : '💼 Experienced', icon: '🏢' });
    if (rawScore >= 80) newBadges.push({ id: 'completion', name: lang === 'fr' ? '🏆 Pro Complete' : '🏆 Pro Complete', icon: '🎯' });
    setBadges(newBadges);
  }, [profile, lang]);

  // Suggestions intelligentes (règles simples)
  useEffect(() => {
    const sugg = [];
    if (!profile.motivationSummary || profile.motivationSummary.length < 200)
      sugg.push({ text: lang === 'fr' ? '💡 Rédige une motivation plus détaillée (200+ caractères) pour augmenter tes chances.' : '💡 Write a more detailed motivation (200+ chars) to boost your chances.' });
    if (profile.targetCountries.length === 0)
      sugg.push({ text: lang === 'fr' ? '🎯 Ajoute des pays cibles – les bourses sont souvent géographiquement ciblées.' : '🎯 Add target countries – scholarships are often geographically targeted.' });
    if (profile.skills.length < 3)
      sugg.push({ text: lang === 'fr' ? '🛠️ Ajoute plus de compétences techniques pour matcher avec les bourses en informatique.' : '🛠️ Add more technical skills to match IT scholarships.' });
    if (profile.languages.length === 0)
      sugg.push({ text: lang === 'fr' ? '🌐 Renseigne tes langues (niveau CECRL) – critère clé pour l’international.' : '🌐 Fill in your languages (CEFR level) – key for international applications.' });
    if (profile.academicProjects.length === 0)
      sugg.push({ text: lang === 'fr' ? '📁 Ajoute tes projets académiques – ils font la différence sur un CV de bourse.' : '📁 Add your academic projects – they make a difference on a scholarship CV.' });
    setSuggestions(sugg);
  }, [profile, lang]);

  // Comparaison avec bourses (mock, à remplacer par appel API)
 useEffect(() => {
  const fetchMatches = async () => {
    // Ne pas appeler si aucun critère n'est rempli
    if (!profile.fieldOfStudy && !profile.targetDegree && profile.targetCountries.length === 0 && !profile.currentLevel) {
      setMatchedScholarships([]);
      return;
    }
    // Désactiver l'appel API réel (car route inexistante)
    // Utilisation directe du mock
    setMatchedScholarships([
      { nom: 'Bourse Eiffel (France)', score: 85 },
      { nom: 'Mastercard Foundation Scholars', score: 72 },
      { nom: 'DAAD Scholarships (Allemagne)', score: 68 },
    ]);
  };
  fetchMatches();
}, [profile.fieldOfStudy, profile.currentLevel, profile.targetCountries, profile.targetDegree]);

 const ProfileHeader = () => (
    <div style={headerStyles.container}>
      <div style={headerStyles.avatarWrapper}>
        <AvatarUploader
          avatarId={profile.avatar}
          onUpload={(mediaId) => setProfile(p => ({ ...p, avatar: mediaId }))}
          lang={lang}
          compact // optionnel : on peut passer un prop pour un style plus intégré
        />
      </div>
      <div style={headerStyles.info}>
        <div style={headerStyles.name}>{profile.name || (lang === 'fr' ? 'Nom non renseigné' : 'Name not provided')}</div>
        <div style={headerStyles.email}>{profile.email || user?.email}</div>
        <div style={headerStyles.stats}>
  <span style={headerStyles.completion}>
    📊 {lang === 'fr' ? 'Complétude du profil' : 'Profile completeness'} : {completionScore}%
  </span>
  <div style={headerStyles.badgesList}>
    {badges.map(b => (
      <span key={b.id} style={headerStyles.badge}>
        {b.icon} {b.name}
      </span>
    ))}
  </div>
</div>
      </div>
    </div>
  );

  // Assistant contextuel
  const openAssistant = (section) => {
    let msg = '';
    switch (section) {
      case 'personal': msg = lang === 'fr' ? 'Remplis bien ton nom, nationalité et liens pro – cela rassure les jurys.' : 'Fill in your name, nationality, and professional links – it reassures the juries.'; break;
      case 'academic': msg = lang === 'fr' ? 'Ajoute toutes tes formations, même les courtes certifications. Elles montrent ta curiosité.' : 'Add all your education, even short certifications. They show your curiosity.'; break;
      case 'experience': msg = lang === 'fr' ? 'Décris tes stages avec des chiffres (ex: +20% de performance) – les comités adorent !' : 'Describe your internships with numbers (e.g., +20% performance) – committees love it!'; break;
      case 'projects': msg = lang === 'fr' ? 'Les projets académiques sont tes preuves concrètes. N’oublie pas les technologies utilisées.' : 'Academic projects are your concrete proofs. Don’t forget the technologies used.'; break;
      case 'skills': msg = lang === 'fr' ? 'Classe tes compétences par catégorie et niveau – c’est plus lisible pour l’IA de matching.' : 'Categorize your skills by level – it’s more readable for the matching AI.'; break;
      case 'goals': msg = lang === 'fr' ? 'Sois précis sur tes pays cibles et ta motivation. Une bonne lettre fait la différence.' : 'Be precise about your target countries and motivation. A good letter makes the difference.'; break;
      default: msg = lang === 'fr' ? 'Utilise l’icône 💡 à côté de chaque section pour obtenir des conseils.' : 'Use the 💡 icon next to each section to get tips.';
    }
    setAssistantMessage(msg);
    setShowAssistant(true);
    setTimeout(() => setShowAssistant(false), 5000);
  };

  // Gestion des formulaires
  const upd = (field) => (i, key, val) =>
    setProfile(p => { const a = [...p[field]]; a[i] = { ...a[i], [key]: val }; return { ...p, [field]: a }; });
  const add = (field, empty) => () =>
    setProfile(p => ({ ...p, [field]: [...p[field], { ...empty }] }));
  const del = (field) => (i) =>
    setProfile(p => ({ ...p, [field]: p[field].filter((_, j) => j !== i) }));

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
        certifications: profile.certifications,
        volunteerWork: profile.volunteerWork,
        publications: profile.publications,
        awards: profile.awards,
        linkedin: profile.linkedin,
        github: profile.github,
        portfolio: profile.portfolio,
        avatar: profile.avatar,
      };
      const { data: result } = await axiosInstance.patch(`/api/users/${user.id}/update-profile`, body);
      const updated = { ...user, ...(result.user || body) };
      localStorage.setItem('opps_user', JSON.stringify(updated));
      localStorage.setItem('opps_profile', JSON.stringify({
        dateOfBirth: profile.dateOfBirth, academicProjects: profile.academicProjects,
        certifications: profile.certifications, volunteerWork: profile.volunteerWork,
        publications: profile.publications, awards: profile.awards,
        linkedin: profile.linkedin, github: profile.github, portfolio: profile.portfolio,
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

  const tabs = [
    { id: 'personal', label: lang === 'fr' ? 'Personnel' : 'Personal', icon: '👤' },
    { id: 'academic', label: lang === 'fr' ? 'Formation' : 'Education', icon: '🎓' },
    { id: 'experience', label: lang === 'fr' ? 'Expérience' : 'Experience', icon: '💼' },
    { id: 'projects', label: lang === 'fr' ? 'Projets' : 'Projects', icon: '🚀' },
    { id: 'skills', label: lang === 'fr' ? 'Compétences' : 'Skills', icon: '🛠️' },
    { id: 'goals', label: lang === 'fr' ? 'Objectifs' : 'Goals', icon: '🎯' },
  ];

  if (!user) {
    return (
      <>
        <div style={S.locked}>
          <div style={S.lockedCard}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>👤</div>
            <h3 style={{ color: '#1a3a6b', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>
              {lang === 'fr' ? 'Profil non disponible' : 'Profile unavailable'}
            </h3>
            <p style={{ color: '#64748b', fontSize: 11, lineHeight: 1.6, maxWidth: 280, textAlign: 'center', margin: '0 0 24px' }}>
              {lang === 'fr' ? 'Connectez-vous pour accéder à votre profil et gérer vos candidatures de bourses.' : 'Sign in to access your profile and manage your scholarship applications.'}
            </p>
            <button style={S.lockBtn} onClick={() => setShowLogin(true)}>
              🔐 {lang === 'fr' ? 'Se connecter' : 'Sign in'}
            </button>
          </div>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  return (
    
    <div style={S.page}>
      <div style={S.body}>
        <ProfileHeader />

        {/* Grille à deux colonnes */}
        <div style={S.twoColumns}>
          {/* COLONNE GAUCHE : FORMULAIRE */}
          <div style={S.mainForm}>
            {/* Tabs */}
            <div style={S.tabBar}>
              {tabs.map(t => (
                <div key={t.id} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <button
                    style={{ ...S.tabBtn, ...(tab === t.id ? S.tabOn : {}) }}
                    onClick={() => setTab(t.id)}
                  >
                    <span style={{ marginRight: 4 }}>{t.icon}</span>
                    {t.label}
                  </button>
                  <button
                    style={S.assistIcon}
                    onClick={(e) => { e.stopPropagation(); openAssistant(t.id); }}
                  >
                    💡
                  </button>
                </div>
              ))}
            </div>

        {/* ==================== SECTION PERSONNEL ==================== */}
        {tab === 'personal' && (
          <div style={S.sec}>
            
            <div style={S.g2}>
              <F label={lang === 'fr' ? 'Nom complet' : 'Full name'} v={profile.name} s={v => setProfile(p => ({ ...p, name: v }))} ph={lang === 'fr' ? 'Prénom Nom' : 'First Last name'} />
              <F label="Email" v={profile.email} readOnly />
              <F label={lang === 'fr' ? 'Téléphone' : 'Phone'} v={profile.phone} s={v => setProfile(p => ({ ...p, phone: v }))} ph="+216 XX XXX XXX" />
              <AutocompleteInput label={lang === 'fr' ? 'Date de naissance' : 'Date of birth'} value={profile.dateOfBirth} onChange={v => setProfile(p => ({ ...p, dateOfBirth: v }))} suggestions={[]} placeholder="" type="date" />
              <AutocompleteInput label={lang === 'fr' ? 'Nationalité' : 'Nationality'} value={profile.nationality} onChange={v => setProfile(p => ({ ...p, nationality: v }))} suggestions={COUNTRY_SUGGESTIONS} category="countries" placeholder={lang === 'fr' ? 'Ex: Tunisienne' : 'Ex: Tunisian'} />
              <AutocompleteInput label={lang === 'fr' ? 'Pays de résidence' : 'Country of residence'} value={profile.countryOfResidence} onChange={v => setProfile(p => ({ ...p, countryOfResidence: v }))} suggestions={COUNTRY_SUGGESTIONS} category="countries" placeholder={lang === 'fr' ? 'Ex: Tunisie' : 'Ex: Tunisia'} />
            </div>
            <div style={S.g2}>
              <F label="LinkedIn" v={profile.linkedin} s={v => setProfile(p => ({ ...p, linkedin: v }))} ph="linkedin.com/in/your-profile" />
              <F label="GitHub" v={profile.github} s={v => setProfile(p => ({ ...p, github: v }))} ph="github.com/your-account" />
              <div style={{ gridColumn:'1/-1' }}><F label={lang === 'fr' ? 'Portfolio / Site web' : 'Portfolio / Website'} v={profile.portfolio} s={v => setProfile(p => ({ ...p, portfolio: v }))} ph="https://your-site.com" /></div>
            </div>
            <T>{lang === 'fr' ? 'Distinctions & prix' : 'Awards & distinctions'}</T>
            {profile.awards.map((a, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label={lang === 'fr' ? 'Titre du prix / distinction' : 'Award / distinction title'} v={a.title} s={v => upd('awards')(i, 'title', v)} ph={lang === 'fr' ? 'Ex: Prix Innovation 2024' : 'Ex: Innovation Award 2024'} />
                  <F label={lang === 'fr' ? 'Organisation' : 'Organization'} v={a.organization} s={v => upd('awards')(i, 'organization', v)} ph={lang === 'fr' ? 'Ex: Université X' : 'Ex: University X'} />
                  <F label={lang === 'fr' ? 'Année' : 'Year'} v={a.year} s={v => upd('awards')(i, 'year', v)} ph="2024" />
                  <div style={{ gridColumn:'1/-1' }}><F label={lang === 'fr' ? 'Description' : 'Description'} v={a.description} s={v => upd('awards')(i, 'description', v)} ph={lang === 'fr' ? 'Brève description du prix' : 'Brief description of the award'} /></div>
                </div>
                <button style={S.rmBtn} onClick={() => del('awards')(i)}>✕ {lang === 'fr' ? 'Supprimer' : 'Remove'}</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('awards', { title:'', organization:'', year:'', description:'' })}>+ {lang === 'fr' ? 'Ajouter une distinction' : 'Add an award'}</button>
          </div>
        )}

        {/* ==================== SECTION FORMATION ==================== */}
        {tab === 'academic' && (
          <div style={S.sec}>
            <T>{lang === 'fr' ? 'Formation actuelle' : 'Current education'}</T>
            <div style={S.g2}>
              <div>
                <div style={S.lbl}>{lang === 'fr' ? 'Niveau actuel' : 'Current level'}</div>
                <select style={S.inp} value={profile.currentLevel} onChange={e => setProfile(p => ({ ...p, currentLevel: e.target.value }))}>
                  <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                  {['Licence 1','Licence 2','Licence 3','Master 1','Master 2','Doctorat','Ingénieur 1','Ingénieur 2','Ingénieur 3'].map(v => <option key={v} value={v}>{SUGGESTION_TRANSLATIONS.degreeLevels[v] || v}</option>)}
                </select>
              </div>
              <AutocompleteInput label={lang === 'fr' ? 'Domaine d\'études' : 'Field of study'} value={profile.fieldOfStudy} onChange={v => setProfile(p => ({ ...p, fieldOfStudy: v }))} suggestions={FIELD_SUGGESTIONS} category="fields" placeholder={lang === 'fr' ? 'Ex: Informatique de Gestion' : 'Ex: Business Computing'} />
              <div style={{ gridColumn:'1/-1' }}><F label={lang === 'fr' ? 'Établissement' : 'Institution'} v={profile.institution} s={v => setProfile(p => ({ ...p, institution: v }))} ph={lang === 'fr' ? 'Ex: ISIMA Mahdia' : 'Ex: ISIMA Mahdia'} /></div>
              <F label={lang === 'fr' ? 'Moyenne (sur 20)' : 'GPA (out of 20)'} v={profile.gpa} s={v => setProfile(p => ({ ...p, gpa: v }))} type="number" ph="Ex: 14.5" />
              <F label={lang === 'fr' ? 'Année de diplôme' : 'Graduation year'} v={profile.graduationYear} s={v => setProfile(p => ({ ...p, graduationYear: v }))} type="number" ph="Ex: 2026" />
            </div>
            <T>{lang === 'fr' ? 'Historique académique' : 'Academic history'}</T>
            {profile.academicHistory.map((h, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label={lang === 'fr' ? 'Diplôme' : 'Degree'} v={h.degree} s={v => upd('academicHistory')(i, 'degree', v)} ph={lang === 'fr' ? 'Ex: Baccalauréat, Licence...' : 'Ex: Bachelor, Master...'} />
                  <F label={lang === 'fr' ? 'Établissement' : 'Institution'} v={h.institution} s={v => upd('academicHistory')(i, 'institution', v)} ph={lang === 'fr' ? 'Ex: Lycée Mixte Mahdia' : 'Ex: Lycée Mixte Mahdia'} />
                  <AutocompleteInput label={lang === 'fr' ? 'Domaine' : 'Field'} value={h.field} onChange={v => upd('academicHistory')(i, 'field', v)} suggestions={FIELD_SUGGESTIONS} category="fields" placeholder={lang === 'fr' ? 'Ex: Mathématiques' : 'Ex: Mathematics'} />
                  <F label={lang === 'fr' ? 'Année' : 'Year'} v={h.year} s={v => upd('academicHistory')(i, 'year', v)} ph="2022" />
                  <div style={{ gridColumn:'1/-1' }}><F label={lang === 'fr' ? 'Mention / Note' : 'Honors / Grade'} v={h.grade} s={v => upd('academicHistory')(i, 'grade', v)} ph={lang === 'fr' ? 'Ex: Bien, Très bien, 15/20' : 'Ex: Good, Very good, 15/20'} /></div>
                </div>
                <button style={S.rmBtn} onClick={() => del('academicHistory')(i)}>✕ {lang === 'fr' ? 'Supprimer' : 'Remove'}</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('academicHistory', { degree:'', institution:'', field:'', year:'', grade:'' })}>+ {lang === 'fr' ? 'Ajouter un diplôme' : 'Add a degree'}</button>
            <T>{lang === 'fr' ? 'Certifications & formations courtes' : 'Certifications & short courses'}</T>
            {profile.certifications.map((c, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label={lang === 'fr' ? 'Certification' : 'Certification'} v={c.name} s={v => upd('certifications')(i, 'name', v)} ph={lang === 'fr' ? 'Ex: AWS, Google Analytics...' : 'Ex: AWS, Google Analytics...'} />
                  <F label={lang === 'fr' ? 'Organisme émetteur' : 'Issuing organization'} v={c.issuer} s={v => upd('certifications')(i, 'issuer', v)} ph={lang === 'fr' ? 'Ex: Coursera, Amazon...' : 'Ex: Coursera, Amazon...'} />
                  <AutocompleteInput label={lang === 'fr' ? 'Date d\'obtention' : 'Date obtained'} value={c.date} onChange={v => upd('certifications')(i, 'date', v)} suggestions={[]} placeholder="2024" type="date" />
                  <F label={lang === 'fr' ? 'ID / Lien vérif.' : 'Credential ID / Verification link'} v={c.credential} s={v => upd('certifications')(i, 'credential', v)} ph={lang === 'fr' ? 'URL ou identifiant' : 'URL or ID'} />
                </div>
                <button style={S.rmBtn} onClick={() => del('certifications')(i)}>✕ {lang === 'fr' ? 'Supprimer' : 'Remove'}</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('certifications', { name:'', issuer:'', date:'', credential:'' })}>+ {lang === 'fr' ? 'Ajouter une certification' : 'Add a certification'}</button>
            <T>{lang === 'fr' ? 'Publications & communications scientifiques' : 'Publications & scientific communications'}</T>
            {profile.publications.map((p, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <div style={{ gridColumn:'1/-1' }}><F label={lang === 'fr' ? 'Titre complet' : 'Full title'} v={p.title} s={v => upd('publications')(i, 'title', v)} ph={lang === 'fr' ? 'Titre de l\'article ou communication' : 'Title of article or communication'} /></div>
                  <F label={lang === 'fr' ? 'Revue / Conférence' : 'Journal / Conference'} v={p.venue} s={v => upd('publications')(i, 'venue', v)} ph={lang === 'fr' ? 'Ex: IEEE, Conférence ICSI...' : 'Ex: IEEE, ICSI Conference...'} />
                  <F label={lang === 'fr' ? 'Année' : 'Year'} v={p.year} s={v => upd('publications')(i, 'year', v)} ph="2024" />
                  <div style={{ gridColumn:'1/-1' }}><F label={lang === 'fr' ? 'Co-auteurs' : 'Co-authors'} v={p.authors} s={v => upd('publications')(i, 'authors', v)} ph={lang === 'fr' ? 'Noms des co-auteurs' : 'Names of co-authors'} /></div>
                </div>
                <button style={S.rmBtn} onClick={() => del('publications')(i)}>✕ {lang === 'fr' ? 'Supprimer' : 'Remove'}</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('publications', { title:'', venue:'', year:'', authors:'' })}>+ {lang === 'fr' ? 'Ajouter une publication' : 'Add a publication'}</button>
          </div>
        )}

        {/* ==================== SECTION EXPÉRIENCE ==================== */}
        {tab === 'experience' && (
          <div style={S.sec}>
            <T>{lang === 'fr' ? 'Expériences professionnelles & stages' : 'Work experience & internships'}</T>
            {profile.workExperience.map((w, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <div>
                    <div style={S.lbl}>{lang === 'fr' ? 'Type' : 'Type'}</div>
                    <select style={S.inp} value={w.type || ''} onChange={e => upd('workExperience')(i, 'type', e.target.value)}>
                      <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                      <option value="internship">{SUGGESTION_TRANSLATIONS.workTypes.internship(lang)}</option>
                      <option value="job">{SUGGESTION_TRANSLATIONS.workTypes.job(lang)}</option>
                      <option value="freelance">{SUGGESTION_TRANSLATIONS.workTypes.freelance}</option>
                    </select>
                  </div>
                  <F label={lang === 'fr' ? 'Poste' : 'Position'} v={w.position} s={v => upd('workExperience')(i, 'position', v)} ph={lang === 'fr' ? 'Ex: Développeur Web Full Stack' : 'Ex: Full Stack Web Developer'} />
                  <F label={lang === 'fr' ? 'Entreprise' : 'Company'} v={w.company} s={v => upd('workExperience')(i, 'company', v)} ph={lang === 'fr' ? 'Ex: TechCorp Tunis' : 'Ex: TechCorp Tunis'} />
                  <AutocompleteInput label={lang === 'fr' ? 'Ville' : 'City'} value={w.city} onChange={v => upd('workExperience')(i, 'city', v)} suggestions={['Tunis', 'Sfax', 'Sousse', 'Mahdia', 'Monastir', 'Nabeul', 'Bizerte', 'Paris', 'Montreal', 'Casablanca', 'Dakar']} category="countries" placeholder={lang === 'fr' ? 'Ex: Tunis, Sfax...' : 'Ex: Tunis, Sfax...'} />
                  <AutocompleteInput label={lang === 'fr' ? 'Date début' : 'Start date'} value={w.startDate} onChange={v => upd('workExperience')(i, 'startDate', v)} suggestions={[]} placeholder="" type="date" />
                  <AutocompleteInput label={lang === 'fr' ? 'Date fin' : 'End date'} value={w.endDate} onChange={v => upd('workExperience')(i, 'endDate', v)} suggestions={[]} placeholder="" type="date" />
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={S.lbl}>{lang === 'fr' ? 'Description des missions & réalisations' : 'Mission description & achievements'}</div>
                    <textarea style={{ ...S.inp, minHeight:90, resize:'vertical' }} value={w.description || ''} onChange={e => upd('workExperience')(i, 'description', e.target.value)} placeholder={lang === 'fr' ? 'Décrivez vos missions, résultats obtenus, chiffres clés...' : 'Describe your missions, results achieved, key metrics...'}/>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}><F label={lang === 'fr' ? 'Technologies utilisées' : 'Technologies used'} v={w.technologies} s={v => upd('workExperience')(i, 'technologies', v)} ph={lang === 'fr' ? 'Ex: React, Laravel, MySQL, Docker...' : 'Ex: React, Laravel, MySQL, Docker...'} /></div>
                </div>
                <button style={S.rmBtn} onClick={() => del('workExperience')(i)}>✕ {lang === 'fr' ? 'Supprimer' : 'Remove'}</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('workExperience', { position:'', company:'', city:'', startDate:'', endDate:'', description:'', type:'internship', technologies:'' })}>+ {lang === 'fr' ? 'Ajouter une expérience' : 'Add an experience'}</button>
            <T>{lang === 'fr' ? 'Bénévolat & associations' : 'Volunteering & associations'}</T>
            {profile.volunteerWork.map((v, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label={lang === 'fr' ? 'Rôle' : 'Role'} v={v.role} s={val => upd('volunteerWork')(i, 'role', val)} ph={lang === 'fr' ? 'Ex: Team Manager, Membre actif...' : 'Ex: Team Manager, Active member...'} />
                  <F label={lang === 'fr' ? 'Organisation' : 'Organization'} v={v.organization} s={val => upd('volunteerWork')(i, 'organization', val)} ph={lang === 'fr' ? 'Ex: JCI, Club Microsoft ISIMA...' : 'Ex: JCI, Microsoft Club ISIMA...'} />
                  <AutocompleteInput label={lang === 'fr' ? 'Début' : 'Start'} value={v.startDate} onChange={val => upd('volunteerWork')(i, 'startDate', val)} suggestions={[]} placeholder="2022" type="date" />
                  <AutocompleteInput label={lang === 'fr' ? 'Fin' : 'End'} value={v.endDate} onChange={val => upd('volunteerWork')(i, 'endDate', val)} suggestions={[]} placeholder={lang === 'fr' ? '2024 ou En cours' : '2024 or Ongoing'} type="date" />
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={S.lbl}>{lang === 'fr' ? 'Description' : 'Description'}</div>
                    <textarea style={{ ...S.inp, minHeight:70, resize:'vertical' }} value={v.description || ''} onChange={e => upd('volunteerWork')(i, 'description', e.target.value)} placeholder={lang === 'fr' ? 'Responsabilités, compétences développées, impact...' : 'Responsibilities, skills developed, impact...'}/>
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('volunteerWork')(i)}>✕ {lang === 'fr' ? 'Supprimer' : 'Remove'}</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('volunteerWork', { role:'', organization:'', startDate:'', endDate:'', description:'' })}>+ {lang === 'fr' ? 'Ajouter une activité' : 'Add an activity'}</button>
          </div>
        )}

        {/* ==================== SECTION PROJETS ==================== */}
        {tab === 'projects' && (
          <div style={S.sec}>
            <T>{lang === 'fr' ? 'Projets académiques' : 'Academic projects'}</T>
            <div style={{ fontSize:12, color:'#1a3a6b', padding:'10px 14px', borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe', lineHeight:1.6 }}>
              {lang === 'fr' ? '💡 Les projets académiques sont essentiels pour un CV de bourse — ils montrent vos compétences pratiques, votre capacité à mener un projet et les technologies maîtrisées.' : '💡 Academic projects are essential for a scholarship CV — they demonstrate your practical skills, ability to lead a project, and mastered technologies.'}
            </div>
            {profile.academicProjects.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px 20px', color:'#64748b' }}>
                <div style={{ fontSize:40, marginBottom:10 }}>🚀</div>
                <div style={{ fontWeight:600, color:'#1a3a6b', marginBottom:6 }}>{lang === 'fr' ? 'Aucun projet ajouté' : 'No projects added'}</div>
                <div style={{ fontSize:13 }}>{lang === 'fr' ? 'Ajoutez vos projets : PFE, projets de cours, projets personnels, startups...' : 'Add your projects: Final year project, course projects, personal projects, startups...'}</div>
              </div>
            )}
            {profile.academicProjects.map((p, i) => (
              <div key={i} style={S.card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontWeight:700, color:'#1a3a6b', fontSize:13 }}>{lang === 'fr' ? `Projet #${i+1}` : `Project #${i+1}`} {p.title ? `— ${p.title}` : ''}</div>
                  <button style={S.rmBtn} onClick={() => del('academicProjects')(i)}>✕ {lang === 'fr' ? 'Supprimer' : 'Remove'}</button>
                </div>
                <div style={S.g2}>
                  <div style={{ gridColumn:'1/-1' }}><F label={lang === 'fr' ? 'Titre du projet' : 'Project title'} v={p.title} s={v => upd('academicProjects')(i, 'title', v)} ph={lang === 'fr' ? 'Ex: Système de gestion des étalonnages' : 'Ex: Calibration management system'} /></div>
                  <div>
                    <div style={S.lbl}>{lang === 'fr' ? 'Type de projet' : 'Project type'}</div>
                    <select style={S.inp} value={p.type || ''} onChange={e => upd('academicProjects')(i, 'type', e.target.value)}>
                      <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                      <option value="pfe">{SUGGESTION_TRANSLATIONS.projectTypes.pfe(lang)}</option>
                      <option value="academic">{SUGGESTION_TRANSLATIONS.projectTypes.academic(lang)}</option>
                      <option value="personal">{SUGGESTION_TRANSLATIONS.projectTypes.personal(lang)}</option>
                      <option value="entrepreneurial">{SUGGESTION_TRANSLATIONS.projectTypes.entrepreneurial(lang)}</option>
                      <option value="research">{SUGGESTION_TRANSLATIONS.projectTypes.research(lang)}</option>
                    </select>
                  </div>
                  <div>
                    <div style={S.lbl}>{lang === 'fr' ? 'Taille de l\'équipe' : 'Team size'}</div>
                    <select style={S.inp} value={p.teamSize || ''} onChange={e => upd('academicProjects')(i, 'teamSize', e.target.value)}>
                      <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                      <option value="solo">{SUGGESTION_TRANSLATIONS.teamSizes.solo(lang)}</option>
                      <option value="2">2 {lang === 'fr' ? 'personnes' : 'people'}</option>
                      <option value="3-5">3 {lang === 'fr' ? 'à 5 personnes' : 'to 5 people'}</option>
                      <option value="6+">{SUGGESTION_TRANSLATIONS.teamSizes['6+'](lang)}</option>
                    </select>
                  </div>
                  <F label={lang === 'fr' ? 'Encadrant / Professeur' : 'Supervisor / Professor'} v={p.supervisor} s={v => upd('academicProjects')(i, 'supervisor', v)} ph={lang === 'fr' ? 'Ex: Prof. Ben Ali' : 'Ex: Prof. Ben Ali'} />
                  <F label={lang === 'fr' ? 'Année' : 'Year'} v={p.year} s={v => upd('academicProjects')(i, 'year', v)} ph="2024" />
                  <AutocompleteInput label={lang === 'fr' ? 'Date début' : 'Start date'} value={p.startDate} onChange={v => upd('academicProjects')(i, 'startDate', v)} suggestions={[]} placeholder={lang === 'fr' ? 'Ex: 2023-09' : 'Ex: 2023-09'} type="date" />
                  <AutocompleteInput label={lang === 'fr' ? 'Date fin' : 'End date'} value={p.endDate} onChange={v => upd('academicProjects')(i, 'endDate', v)} suggestions={[]} placeholder={lang === 'fr' ? 'Ex: 2024-06 ou En cours' : 'Ex: 2024-06 or Ongoing'} type="date" />
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={S.lbl}>{lang === 'fr' ? 'Description du projet' : 'Project description'}</div>
                    <textarea style={{ ...S.inp, minHeight:100, resize:'vertical' }} value={p.description || ''} onChange={e => upd('academicProjects')(i, 'description', e.target.value)} placeholder={lang === 'fr' ? 'Objectif, fonctionnalités développées, problème résolu, résultats obtenus...' : 'Objective, features developed, problem solved, results achieved...'}/>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}><F label={lang === 'fr' ? 'Langages & outils utilisés' : 'Languages & tools used'} v={p.technologies} s={v => upd('academicProjects')(i, 'technologies', v)} ph={lang === 'fr' ? 'Ex: HTML, CSS, JavaScript, PHP, MySQL...' : 'Ex: HTML, CSS, JavaScript, PHP, MySQL...'} /></div>
                  <F label={lang === 'fr' ? 'Lien GitHub / Démo' : 'GitHub link / Demo'} v={p.link} s={v => upd('academicProjects')(i, 'link', v)} ph="https://github.com/..." />
                  <F label={lang === 'fr' ? 'Impact / Résultats' : 'Impact / Results'} v={p.impact} s={v => upd('academicProjects')(i, 'impact', v)} ph={lang === 'fr' ? 'Ex: Déployé en production, prix reçu...' : 'Ex: Deployed to production, award received...'} />
                </div>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('academicProjects', { title:'', type:'', supervisor:'', year:'', startDate:'', endDate:'', description:'', technologies:'', link:'', teamSize:'', impact:'' })}>+ {lang === 'fr' ? 'Ajouter un projet académique' : 'Add an academic project'}</button>
          </div>
        )}

        {/* ==================== SECTION COMPÉTENCES ==================== */}
        {tab === 'skills' && (
          <div style={S.sec}>
            <T>{lang === 'fr' ? 'Langues' : 'Languages'}</T>
            {profile.languages.map((l, i) => (
              <div key={i} style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <AutocompleteInput label={lang === 'fr' ? 'Langue' : 'Language'} value={l.language} onChange={(v) => upd('languages')(i, 'language', v)} suggestions={LANGUAGE_SUGGESTIONS} category="languages" placeholder={lang === 'fr' ? 'Ex: Anglais, Français...' : 'Ex: English, French...'} />
                <div>
                  <div style={S.lbl}>{lang === 'fr' ? 'Niveau CECRL' : 'CEFR Level'}</div>
                  <select style={S.inp} value={l.level} onChange={e => upd('languages')(i, 'level', e.target.value)}>
                    <option value="">{lang === 'fr' ? 'Niveau...' : 'Level...'}</option>
                    {['A1','A2','B1','B2','C1','C2', lang === 'fr' ? 'Natif' : 'Native'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <AutocompleteInput label={lang === 'fr' ? 'Certificat' : 'Certificate'} value={l.certificate} onChange={(v) => upd('languages')(i, 'certificate', v)} suggestions={['IELTS', 'TOEIC', 'TOEFL', 'DELF', 'DALF', 'Cambridge', 'Goethe', 'DELE', 'HSK', 'TEF', 'TCF']} placeholder={lang === 'fr' ? 'Ex: IELTS 7.5, TOEIC 900' : 'Ex: IELTS 7.5, TOEIC 900'} />
                <button style={{ ...S.rmBtn, marginTop: 0 }} onClick={() => del('languages')(i)}>✕</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('languages', { language:'', level:'', certificate:'' })}>+ {lang === 'fr' ? 'Ajouter une langue' : 'Add a language'}</button>
            <T>{lang === 'fr' ? 'Compétences techniques' : 'Technical skills'}</T>
            <div style={{ fontSize:12, color:'#1a3a6b', padding:'8px 12px', borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe', marginBottom:4 }}>
              {lang === 'fr' ? '💡 Regroupez par catégorie : Langages de programmation, Frameworks, Bases de données, Outils DevOps...' : '💡 Group by category: Programming languages, Frameworks, Databases, DevOps tools...'}
            </div>
            {profile.skills.map((sk, i) => (
              <SkillInput key={i} skill={sk.skill} category={sk.category} onSkillChange={(v) => upd('skills')(i, 'skill', v)} onCategoryChange={(v) => upd('skills')(i, 'category', v)} onLevelChange={(v) => upd('skills')(i, 'level', v)} onDelete={() => del('skills')(i)} />
            ))}
            <button style={S.addBtn} onClick={add('skills', { skill:'', level:'', category:'' })}>+ {lang === 'fr' ? 'Ajouter une compétence' : 'Add a skill'}</button>
          </div>
        )}

        {/* ==================== SECTION OBJECTIFS ==================== */}
        {tab === 'goals' && (
          <div style={S.sec}>
            <T>{lang === 'fr' ? 'Projet d\'études à l\'étranger' : 'Study abroad project'}</T>
            <div style={S.g2}>
              <div>
                <div style={S.lbl}>{lang === 'fr' ? 'Niveau visé' : 'Target degree'}</div>
                <select style={S.inp} value={profile.targetDegree} onChange={e => setProfile(p => ({ ...p, targetDegree: e.target.value }))}>
                  <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                  {['Licence','Master','Doctorat','Ingénieur', lang === 'fr' ? 'Formation courte' : 'Short course', lang === 'fr' ? 'Résidence de recherche' : 'Research residency'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div/>
            </div>
            <div>
              <div style={S.lbl}>{lang === 'fr' ? 'Pays cibles' : 'Target countries'}</div>
              {profile.targetCountries.map((c, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <AutocompleteInput label="" value={c.country} onChange={v => upd('targetCountries')(i, 'country', v)} suggestions={COUNTRY_SUGGESTIONS} category="countries" placeholder={lang === 'fr' ? 'Ex: France, Canada, Belgique, Allemagne...' : 'Ex: France, Canada, Belgium, Germany...'} />
                  <button style={S.rmBtn} onClick={() => del('targetCountries')(i)}>✕</button>
                </div>
              ))}
              <button style={S.addBtn} onClick={add('targetCountries', { country:'' })}>+ {lang === 'fr' ? 'Ajouter un pays' : 'Add a country'}</button>
            </div>
            <div>
              <div style={S.lbl}>{lang === 'fr' ? 'Domaines visés' : 'Target fields'}</div>
              {profile.targetFields.map((f, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <AutocompleteInput label="" value={f.field} onChange={v => upd('targetFields')(i, 'field', v)} suggestions={FIELD_SUGGESTIONS} category="fields" placeholder={lang === 'fr' ? 'Ex: Intelligence Artificielle, Data Science, Génie logiciel...' : 'Ex: Artificial Intelligence, Data Science, Software Engineering...'} />
                  <button style={S.rmBtn} onClick={() => del('targetFields')(i)}>✕</button>
                </div>
              ))}
              <button style={S.addBtn} onClick={add('targetFields', { field:'' })}>+ {lang === 'fr' ? 'Ajouter un domaine' : 'Add a field'}</button>
            </div>
            <div>
              <div style={S.lbl}>{lang === 'fr' ? 'Résumé de motivation' : 'Motivation summary'}</div>
              <textarea style={{ ...S.inp, minHeight:150, resize:'vertical' }} value={profile.motivationSummary} onChange={e => setProfile(p => ({ ...p, motivationSummary: e.target.value }))} placeholder={lang === 'fr' ? 'Décrivez vos motivations, votre projet professionnel, pourquoi vous voulez étudier à l\'étranger, vos ambitions...' : 'Describe your motivations, career goals, why you want to study abroad, your ambitions...'}/>
              <div style={{ color:'#64748b', fontSize:12, textAlign:'right', marginTop:4 }}>
                {profile.motivationSummary.length} {lang === 'fr' ? 'caractères' : 'characters'}
                {profile.motivationSummary.length > 0 && profile.motivationSummary.length < 200 && (
                  <span style={{ color:'#d97706', marginLeft:8 }}>{lang === 'fr' ? 'Recommandé : minimum 200 caractères' : 'Recommended: minimum 200 characters'}</span>
                )}
              </div>
            </div>
          </div>
        )}

        

        {/* ==================== FOOTER ==================== */}
       <div style={S.footer}>
              <button
  style={S.chatBtn}
  onClick={() => {
    const message = lang === 'fr' ? 'Je veux mettre à jour mon profil' : 'I want to update my profile';
    window.dispatchEvent(new CustomEvent('openChatWithMessage', { detail: { message } }));
  }}
>
  🤖 {lang === 'fr' ? 'Mettre à jour via l\'IA' : 'Update via AI'}
</button>
              <button
                style={{ ...S.saveBtn, background: saved ? '#166534' : '#255cae' }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '⏳ Sauvegarde...' : saved ? '✅ Sauvegardé !' : '💾 Sauvegarder le profil'}
              </button>
              <button style={S.logoutBtn} onClick={handleLogout}>
                ↩ {lang === 'fr' ? 'Déconnexion' : 'Sign out'}
              </button>
            </div>
          </div>

          {/* COLONNE DROITE : WIDGETS */}
          <div style={S.sidebar}>
            {/* Score + badges */}
            

            {/* Suggestions intelligentes */}
            {suggestions.length > 0 && (
              <div style={S.suggestionsBox}>
                <div style={S.suggestionsTitle}>
                  🤖 {lang === 'fr' ? 'Suggestions personnalisées' : 'Personalized suggestions'}
                </div>
                {suggestions.map((s, i) => (
                  <div key={i} style={S.suggestionItemText}>• {s.text}</div>
                ))}
              </div>
            )}

            {/* Bourses matching */}
            {matchedScholarships.length > 0 && (
              <div style={S.matchBox}>
                <div style={S.matchTitle}>
                  🎓 {lang === 'fr' ? 'Bourses qui correspondent' : 'Matching scholarships'}
                </div>
                {matchedScholarships.map((b, i) => (
                  <div key={i} style={S.matchItem}>
                    <span>{b.nom}</span>
                    <span style={S.matchScore}>{b.score}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div> {/* fin de twoColumns */}

        {/* Assistant flottant */}
        {showAssistant && (
          <div style={S.assistantPopup}>
            <div style={S.assistantHeader}>🤖 {lang === 'fr' ? 'Assistant IA' : 'AI Assistant'}</div>
            <div style={S.assistantMessage}>{assistantMessage}</div>
          </div>
        )}
      </div>
        

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @media (max-width: 680px) {
          .tab-bar { flex-direction: column; align-items: stretch; }
          .tab-btn { justify-content: space-between; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .profil-card { padding: 12px; }
          .score-section { flex-direction: column; align-items: flex-start; }
          .badges-container { margin-top: 8px; flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}


// ==================== COMPOSANTS UTILITAIRES ====================
function T({ children }) {
  return <div style={{ color:'#1a3a6b', fontSize:'0.88rem', fontWeight:700, paddingBottom:8, borderBottom:'2px solid #f5a623', letterSpacing:'0.02em', marginTop:8, display:'flex', alignItems:'center', gap:8 }}>{children}</div>;
}

function F({ label, v, s, ph, type = 'text', readOnly = false }) {
  return (
    <div>
      <div style={S.lbl}>{label}</div>
      <input style={{ ...S.inp, ...(readOnly ? { opacity:0.5, cursor:'not-allowed' } : {}) }} type={type} value={v || ''} onChange={e => s?.(e.target.value)} placeholder={ph} readOnly={readOnly} />
    </div>
  );
}

// ==================== STYLES ====================
const S = {
  page: { width:'100%', fontFamily:"'Segoe UI',system-ui,sans-serif", color:'#1a3a6b', background:'#f8f9fc', minHeight:'100vh' },
  locked: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8f9fc', padding:24 },
  lockedCard: { display:'flex', flexDirection:'column', alignItems:'center', background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:12, padding:'48px 40px', boxShadow:'0 4px 20px rgba(26,58,107,0.08)', maxWidth:380, width:'100%' },
  lockBtn: { padding:'12px 32px', borderRadius:6, background:'#1a3a6b', color:'white', border:'none', fontSize:14, fontWeight:700, cursor:'pointer' },
  body: { maxWidth:880, margin:'0 auto', padding:'24px 20px' },
  tabBar: { display:'flex', gap:3, marginBottom:22, background:'#ffffff', padding:4, borderRadius:8, border:'1px solid #e2e8f0', flexWrap:'wrap', boxShadow:'0 1px 4px rgba(26,58,107,0.06)' },
  tabBtn: { flex:1, minWidth:80, padding:'8px 6px', borderRadius:6, border:'none', cursor:'pointer', background:'transparent', color:'#64748b', fontWeight:500, fontSize:'0.78rem', transition:'all 0.2s', whiteSpace:'nowrap', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:4 },
  tabOn: { background:'#1a3a6b', color:'#fff', fontWeight:700 },
  sec: { display:'flex', flexDirection:'column', gap:14 },
  g2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  lbl: { color:'#64748b', fontSize:'0.72rem', fontWeight:700, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' },
  inp: { width:'100%', padding:'9px 13px', borderRadius:6, border:'1.5px solid #e2e8f0', background:'#ffffff', color:'#1a3a6b', fontSize:'0.88rem', outline:'none', boxSizing:'border-box', fontFamily:'inherit', transition:'border .15s' },
  card: { background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:8, padding:16, marginBottom:6, boxShadow:'0 1px 4px rgba(26,58,107,0.04)' },
  addBtn: { background:'transparent', border:'1.5px dashed #bfdbfe', color:'#1a3a6b', padding:'8px 16px', borderRadius:6, cursor:'pointer', fontSize:'0.82rem', fontWeight:600, transition:'all .15s', fontFamily:'inherit' },
  rmBtn: { background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'4px 10px', borderRadius:4, cursor:'pointer', fontSize:'0.75rem', marginTop:8, fontFamily:'inherit' },
  footer: { display:'flex', gap:10, marginTop:24, paddingTop:18, borderTop:'2px solid #f5a623', flexWrap:'wrap' },
  saveBtn: { flex:2, padding:11, borderRadius:6, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.3s', fontFamily:'inherit' },
  chatBtn: { flex:1, padding:11, borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe', color:'#1a3a6b', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  logoutBtn: { padding:'11px 16px', borderRadius:6, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  suggestionsDropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto', zIndex: 1000, marginTop: 2 },
  suggestionItem: { padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', color: '#1a3a6b', transition: 'background 0.15s' },
  // Nouveaux styles
  scoreSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, background: '#ffffff', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0' },
  progressContainer: { flex: 2, minWidth: 180 },
  progressLabel: { fontSize: '0.8rem', fontWeight: 600, color: '#1a3a6b', marginBottom: 6 },
  progressBarBg: { background: '#e2e8f0', borderRadius: 10, height: 8, overflow: 'hidden' },
  progressBarFill: { background: '#f5a623', height: '100%', borderRadius: 10, transition: 'width 0.3s ease' },
  badgesContainer: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  badge: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600, color: '#1a3a6b' },
  suggestionsBox: { background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20 },
  suggestionsTitle: { fontSize: '0.8rem', fontWeight: 700, color: '#d97706', marginBottom: 6 },
  suggestionItemText: { fontSize: '0.75rem', color: '#1e293b', marginBottom: 4, lineHeight: 1.4 },
  matchBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20 },
  matchTitle: { fontSize: '0.8rem', fontWeight: 700, color: '#166534', marginBottom: 8 },
  matchItem: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6, color: '#14532d' },
  matchScore: { fontWeight: 700, color: '#f5a623' },
  assistIcon: { background: 'transparent', border: 'none', fontSize: '0.8rem', cursor: 'pointer', marginLeft: 6, padding: 2, borderRadius: 12, width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  assistantPopup: { position: 'fixed', bottom: 20, right: 20, width: 280, background: '#1a3a6b', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: 'white', zIndex: 2000, animation: 'fadeInUp 0.2s ease' },
  assistantHeader: { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '0.8rem' },
  assistantMessage: { padding: '12px', fontSize: '0.75rem', lineHeight: 1.5 },
 avatarContainer: {
  width: 120,
  height: 120,
  borderRadius: '50%',
  background: '#f1f5f9',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '3px solid #f5a623',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
},
avatarImg: {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
},
uploadBtn: {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 14,
  cursor: 'pointer',
  display: 'inline-block',
  fontWeight: 600,
},
deleteAvatarBtn: {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 14,
  cursor: 'pointer',
  color: '#dc2626',
  fontWeight: 600,
},};

const headerStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    background: '#ffffff',
    padding: '20px 24px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
    flexWrap: 'wrap',
    '@media (max-width: 680px)': {
      flexDirection: 'column',
      textAlign: 'center',
    }
  },
  avatarWrapper: { flexShrink: 0 },
  info: { flex: 1 },
  name: { fontSize: '1.5rem', fontWeight: 700, color: '#1a3a6b', marginBottom: '4px' },
  email: { fontSize: '0.9rem', color: '#64748b', marginBottom: '12px' },
  stats: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  completion: { fontSize: '0.8rem', fontWeight: 600, background: '#f8f9fc', padding: '4px 12px', borderRadius: '20px', color: '#1a3a6b' },
  starterBadge: { fontSize: '0.75rem', fontWeight: 600, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '4px 12px', color: '#1a3a6b' },
  badgesList: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
},
badge: {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '20px',
  padding: '4px 10px',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#1a3a6b',
},
twoColumns: {
  display: 'grid',
  gridTemplateColumns: '1fr 280px',
  gap: 24,
  alignItems: 'start',
  '@media (max-width: 880px)': {
    gridTemplateColumns: '1fr',
    gap: 32,
  }
},
mainForm: {
  minWidth: 0, // évite le débordement
},
sidebar: {
  display: 'flex',
  marginTop: 32,
  flexDirection: 'column',
  gap: 20,
  position: 'sticky',
  top: 20,
  '@media (max-width: 880px)': {
    position: 'static',
     marginTop: 40,
  }
},
scoreWidget: {
  background: '#ffffff',
  borderRadius: 16,
  padding: '16px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
},
scoreHeader: {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#255cae',
  marginBottom: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
},
progressContainer: {
  marginBottom: 12,
},
progressBarBg: {
  background: '#e2e8f0',
  borderRadius: 10,
  height: 8,
  overflow: 'hidden',
},
progressBarFill: {
  background: '#f5a623',
  height: '100%',
  borderRadius: 10,
  transition: 'width 0.3s',
},
scoreValue: {
  fontSize: '0.7rem',
  color: '#64748b',
  textAlign: 'right',
  marginTop: 4,
},
badgesContainer: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 8,
},
// Suggestions et matchBox gardent leurs styles mais sans les marges énormes
suggestionsBox: {
  background: '#fefce8',
  border: '1px solid #fde68a',
  borderRadius: 12,
  padding: '12px 14px',
},
suggestionsTitle: {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: '#d97706',
  marginBottom: 8,
},
suggestionItemText: {
  fontSize: '0.75rem',
  color: '#1e293b',
  marginBottom: 6,
  lineHeight: 1.4,
},
matchBox: {
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: 12,
  padding: '12px 14px',
},
matchTitle: {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: '#166534',
  marginBottom: 8,
},
matchItem: {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.75rem',
  marginBottom: 6,
  color: '#14532d',
},
matchScore: {
  fontWeight: 700,
  color: '#f5a623',
  background: '#fff7ed',
  padding: '2px 6px',
  borderRadius: 12,
  fontSize: '0.7rem',
},
};

// ==================== MODAL DE CONNEXION (inchangé) ====================
function LoginModal({ onClose }) {
  const { lang } = useT();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const send = async () => {
    if (!email || !email.includes('@')) { 
      setErrMsg(lang === 'fr' ? 'Email invalide' : 'Invalid email'); 
      return; 
    }
    setStatus('sending');
    try {
      await axiosInstance.post('/api/users/request-magic-link', { email: email.trim().toLowerCase() });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || (lang === 'fr' ? 'Impossible de contacter le serveur' : 'Server error'));
    }
  };

  return (
    <div style={M.overlay}>
      <div style={M.box}>
        <div style={M.head}>
          <span style={{ fontSize: 22 }}>🔐</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
            {lang === 'fr' ? 'Connexion à OppsTrack' : 'Sign in to OppsTrack'}
          </span>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          {status === 'idle' && (
            <>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                {lang === 'fr' ? 'Entrez votre email pour recevoir un ' : 'Enter your email to receive a '}
                <strong style={{ color: '#1a3a6b' }}>
                  {lang === 'fr' ? 'lien de connexion magique' : 'magic sign-in link'}
                </strong>.
              </p>
              <input type="email" placeholder={lang === 'fr' ? 'votre@email.com' : 'your@email.com'}
                value={email} autoFocus onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()} style={M.input} />
              {errMsg && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{errMsg}</div>}
              <button style={M.btn} onClick={send}>✉️ {lang === 'fr' ? 'Envoyer le lien magique' : 'Send magic link'}</button>
            </>
          )}
          {status === 'sending' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={M.spinner} />
              <p style={{ color: '#64748b', marginTop: 14 }}>{lang === 'fr' ? 'Envoi en cours...' : 'Sending...'}</p>
            </div>
          )}
          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✉️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 8 }}>
                {lang === 'fr' ? 'Lien envoyé !' : 'Link sent!'}
              </div>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                {lang === 'fr' ? 'Vérifiez votre boîte mail (et les spams).<br/>Cliquez sur le lien pour vous connecter.' : 'Check your inbox (and spam).<br/>Click the link to sign in.'}
              </p>
              <button style={{ ...M.btn, background: '#166534', marginTop: 20 }} onClick={onClose}>✓ {lang === 'fr' ? 'Fermer' : 'Close'}</button>
            </div>
          )}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#dc2626', marginBottom: 12 }}>{errMsg}</p>
              <button style={{ ...M.btn, background: '#dc2626' }} onClick={() => { setStatus('idle'); setErrMsg(''); }}>
                {lang === 'fr' ? 'Réessayer' : 'Retry'}
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
// pages/GuidesPage.jsx
import React, { useState, useMemo } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

// ==================== DONNÉES DYNAMIQUES COMPLÈTES ====================
const guidesContent = {
  // Par étape (Process)
  1: {
    titleFr: "Comment trouver la bourse idéale pour votre profil",
    titleEn: "How to find the perfect scholarship for your profile",
    descFr: "Méthodologie complète pour identifier les bourses qui correspondent à votre profil académique et vos objectifs.",
    descEn: "Complete methodology to identify scholarships matching your academic profile and goals.",
    levelFr: "Débutant", levelEn: "Beginner",
    readTime: "8 min", views: 1243, icon: "🎯", popular: true, category: 'process',
    contentFr: `# Comment trouver la bourse idéale pour votre profil

## Introduction
Trouver la bourse parfaite peut transformer votre parcours académique. Cette méthodologie vous guide pas à pas pour identifier les opportunités qui correspondent vraiment à votre situation.

## Étape 1 : Évaluer votre profil
Avant de commencer vos recherches, faites un bilan honnête :
- **Note académique moyenne** : Les bourses ciblent souvent des critères GPA spécifiques
- **Langue** : Vérifiez les exigences en langue (TOEFL, IELTS, etc.)
- **Expérience** : Stages, bénévolat, leadership
- **Domaine d'étude** : Certaines bourses privilégient certains domaines

## Étape 2 : Ressources de recherche
Utilisez ces plateformes gratuites :
- **MastersPortal.com** : Base de données massive de bourses
- **ScholarshipDB.net** : Filtrages par pays et niveau
- **Campus France** : Pour les bourses françaises
- **British Council** : Opportunités au Royaume-Uni

## Conseil d'expert
Ne cherchez pas LA bourse unique - candidatez à 5-10 bourses qui correspondent à votre profil. Les chances augmentent exponentiellement.`,
    contentEn: `# How to find the perfect scholarship for your profile

## Introduction
Finding the perfect scholarship can transform your academic journey. This methodology guides you step-by-step to identify opportunities that truly match your situation.

## Step 1: Evaluate Your Profile
Before you start searching, make an honest assessment :
- **Academic Grade Average** : Scholarships often target specific GPA criteria
- **Language** : Check language requirements (TOEFL, IELTS, etc.)
- **Experience** : Internships, volunteering, leadership
- **Field of Study** : Some scholarships favor certain fields

## Step 2: Research Resources
Use these free platforms :
- **MastersPortal.com** : Massive scholarship database
- **ScholarshipDB.net** : Filtering by country and level
- **Campus France** : For French scholarships
- **British Council** : Opportunities in the UK

## Expert Advice
Don't look for THE one scholarship - apply to 5-10 scholarships that match your profile. Your chances increase exponentially.`
  },
  2: {
    titleFr: "Rédiger une lettre de motivation qui se démarque",
    titleEn: "Write a standout motivation letter",
    descFr: "Techniques éprouvées et exemples concrets pour créer une lettre de motivation percutante.",
    descEn: "Proven techniques and concrete examples to create a compelling motivation letter.",
    levelFr: "Intermédiaire", levelEn: "Intermediate",
    readTime: "12 min", views: 2156, icon: "📝", popular: true, category: 'process',
    contentFr: `# Rédiger une lettre de motivation qui se démarque

## Structure gagnante
Une bonne lettre de motivation suit cette structure :

### Paragraphe 1 : L'accroche (3-4 lignes)
Capturez l'attention immédiatement avec :
- Une histoire personnelle pertinente
- Votre passion pour le domaine
- Pourquoi cette université spécifiquement

### Erreurs à éviter
❌ Copier-coller des lettres génériques
❌ Faire une lettre trop longue (max 1 page)
❌ Ignorer les critères du programme
❌ Utiliser un ton trop formel ou trop décontracté

## Checklist finale
✅ Relue 3 fois minimum
✅ Personnalisée pour le programme
✅ Sans fautes d'orthographe
✅ Authentique et sincère`,
    contentEn: `# Write a standout motivation letter

## Winning structure
A good motivation letter follows this structure :

### Paragraph 1 : The Hook (3-4 lines)
Capture attention immediately with :
- A relevant personal story
- Your passion for the field
- Why this university specifically

### Mistakes to avoid
❌ Copy-paste generic letters
❌ Make a letter too long (max 1 page)
❌ Ignore program criteria
❌ Use too formal or too casual tone

## Final checklist
✅ Reviewed 3 times minimum
✅ Personalized for the program
✅ No spelling errors
✅ Authentic and sincere`
  },
  3: {
    titleFr: "Créer un CV académique percutant",
    titleEn: "Create a compelling academic CV",
    descFr: "Structure, contenu et design pour un CV qui capte l'attention des comités de sélection.",
    descEn: "Structure, content and design for a CV that captures the attention of selection committees.",
    levelFr: "Débutant", levelEn: "Beginner",
    readTime: "10 min", views: 1876, icon: "📄", popular: false, category: 'process',
    contentFr: `# Créer un CV académique percutant

## Format recommandé
- **Longueur** : 1-2 pages maximum
- **Police** : Calibri, Arial ou Times (11-12 pt)
- **Marges** : 2.5 cm de tous les côtés
- **Couleur** : Noir et blanc ou avec accent discret

## Points clés pour les sélectionneurs
Ils cherchent :
✨ Rigueur académique
✨ Engagement extra-curriculaire
✨ Leadership et initiatives
✨ Adaptation au programme`,
    contentEn: `# Create a compelling academic CV

## Recommended format
- **Length** : 1-2 pages maximum
- **Font** : Calibri, Arial or Times (11-12 pt)
- **Margins** : 2.5 cm on all sides
- **Color** : Black and white or with subtle accent

## Key points for selection committees
They're looking for :
✨ Academic rigor
✨ Extra-curricular engagement
✨ Leadership and initiatives
✨ Fit with the program`
  },
  // Par pays
  8: {
    titleFr: "Guide complet : Bourses aux États-Unis",
    titleEn: "Complete guide: US scholarships",
    descFr: "Fulbright, Gates, et autres opportunités majeures pour étudier aux USA.",
    descEn: "Fulbright, Gates, and other major opportunities to study in the USA.",
    levelFr: "Intermédiaire", levelEn: "Intermediate",
    readTime: "18 min", views: 3421, icon: "🇺🇸", popular: false, category: 'countries',
    contentFr: `# Guide complet : Bourses aux États-Unis

## Bourses majeures

### Fulbright
La bourse la plus prestigieuse pour étudier aux États-Unis :
- Couvre les frais de scolarité + stipend mensuel
- Processus très sélectif (taux d'acceptation ~5%)
- Délai : généralement septembre-octobre

### Gates Cambridge
Destinée aux étudiants d'excellence académique :
- Bourse complète d'études à Cambridge
- Priorité aux pays en développement
- Excellente réputation

## Processus de candidature
1. Sélectionner 3-5 universités
2. Préparer vos documents (TOEFL/SAT)
3. Candidater 6 mois avant le début des études
4. Attendre les résultats et decisions`,
    contentEn: `# Complete guide: US scholarships

## Major scholarships

### Fulbright
The most prestigious scholarship to study in the United States :
- Covers tuition + monthly stipend
- Very selective process (acceptance rate ~5%)
- Deadline: usually September-October

### Gates Cambridge
For academically excellent students :
- Full scholarship at Cambridge
- Priority to developing countries
- Excellent reputation

## Application process
1. Select 3-5 universities
2. Prepare your documents (TOEFL/SAT)
3. Apply 6 months before studies begin
4. Wait for results and decisions`
  },
  9: {
    titleFr: "Chevening & autres bourses UK",
    titleEn: "Chevening & other UK scholarships",
    descFr: "Toutes les bourses britanniques, du processus de candidature aux résultats.",
    descEn: "All British scholarships, from application process to results.",
    levelFr: "Intermédiaire", levelEn: "Intermediate",
    readTime: "16 min", views: 2987, icon: "🇬🇧", popular: false, category: 'countries',
    contentFr: `# Chevening & autres bourses UK

## Chevening Scholarship
Bourse prestigieuse du gouvernement britannique :
- Couvre les frais d'inscription + allocation mensuelle
- Pour Master's degree uniquement
- Sélection très compétitive

## Autres bourses UK
- **Commonwealth Scholarships** : Pour pays du Commonwealth
- **University Scholarships** : Directement par les universités
- **Erasmus+ Grants** : Pour étudiants européens

## Critères principaux
✅ Très bon dossier académique
✅ Expérience professionnelle pertinente
✅ Anglais courant (IELTS 7.0+)
✅ Leadership et engagement communautaire`,
    contentEn: `# Chevening & other UK scholarships

## Chevening Scholarship
Prestigious UK government scholarship :
- Covers registration fees + monthly allowance
- For Master's degree only
- Very competitive selection

## Other UK scholarships
- **Commonwealth Scholarships** : For Commonwealth countries
- **University Scholarships** : Directly from universities
- **Erasmus+ Grants** : For European students

## Main criteria
✅ Very good academic record
✅ Relevant professional experience
✅ Fluent English (IELTS 7.0+)
✅ Leadership and community engagement`
  },
  10: {
    titleFr: "DAAD : Le guide ultime pour l'Allemagne",
    titleEn: "DAAD: The ultimate Germany guide",
    descFr: "Programmes DAAD, universités partenaires et vie étudiante en Allemagne.",
    descEn: "DAAD programs, partner universities and student life in Germany.",
    levelFr: "Intermédiaire", levelEn: "Intermediate",
    readTime: "17 min", views: 2654, icon: "🇩🇪", popular: false, category: 'countries',
    contentFr: `# DAAD : Le guide ultime pour l'Allemagne

## Qu'est-ce que le DAAD ?
Deutsche Akademischer Austausch Dienst (Service d'échange universitaire allemand) :
- Organisation de financement d'études en Allemagne
- Plus de 300 programmes de bourses
- Partenariat avec universités prestigieuses

## Avantages de la DAAD
✨ Frais de scolarité très bas/gratuits
✨ Stipend mensuel généreusement calculé
✨ Soutien administratif excellent
✨ Communauté d'étudiants internationale

## Processus
1. Consulter le site daad.de
2. Identifier les programmes correspondants
3. Candidater directement ou via université
4. Attendre résultats (généralement 3-6 mois)`,
    contentEn: `# DAAD: The ultimate Germany guide

## What is DAAD?
German Academic Exchange Service :
- Study funding organization in Germany
- Over 300 scholarship programs
- Partnership with prestigious universities

## DAAD Benefits
✨ Very low/free tuition fees
✨ Generously calculated monthly stipend
✨ Excellent administrative support
✨ International student community

## Process
1. Check daad.de website
2. Identify matching programs
3. Apply directly or via university
4. Wait for results (usually 3-6 months)`
  },
  // Par niveau
  13: {
    titleFr: "Bourses de Licence : Guide pour débutants",
    titleEn: "Bachelor scholarships: Beginner's guide",
    descFr: "Opportunités de financement pour les études de premier cycle.",
    descEn: "Funding opportunities for undergraduate studies.",
    levelFr: "Débutant", levelEn: "Beginner",
    readTime: "10 min", views: 1543, icon: "🎓", popular: false, category: 'level',
    contentFr: `# Bourses de Licence : Guide pour débutants

## Types de bourses bachelor

### Bourses gouvernementales
- Erasmus+ : Pour études en Europe
- Bourses d'État : Par pays de destination
- Bourses régionales : Par région/état

### Bourses universitaires
- Merit scholarships : Basées sur le mérite académique
- Need-based : Basées sur le besoin financier
- International student scholarships : Spéciales pour étrangers

## Timeline idéale
- **T-12 mois** : Commencer la recherche
- **T-9 mois** : Préparer dossiers TOEFL/SAT
- **T-6 mois** : Candidater aux bourses
- **T-3 mois** : Attendre les résultats`,
    contentEn: `# Bachelor scholarships: Beginner's guide

## Types of bachelor scholarships

### Government scholarships
- Erasmus+ : For studies in Europe
- State scholarships : By destination country
- Regional scholarships : By region/state

### University scholarships
- Merit scholarships : Based on academic merit
- Need-based : Based on financial need
- International student scholarships : Special for foreigners

## Ideal timeline
- **T-12 months** : Start research
- **T-9 months** : Prepare TOEFL/SAT documents
- **T-6 months** : Apply for scholarships
- **T-3 months** : Wait for results`
  },
  14: {
    titleFr: "Master à l'étranger : De A à Z",
    titleEn: "Master abroad: A to Z",
    descFr: "Guide exhaustif pour financer et réussir votre Master international.",
    descEn: "Comprehensive guide to finance and succeed in your international Master's degree.",
    levelFr: "Intermédiaire", levelEn: "Intermediate",
    readTime: "20 min", views: 3876, icon: "📖", popular: false, category: 'level',
    contentFr: `# Master à l'étranger : De A à Z

## Étapes clés du processus

### Phase 1 : Préparation (6-9 mois avant)
- Choisir le pays et le domaine
- Vérifier les prérequis (GPA, GMAT/GRE, langue)
- Compiler la liste des universités cibles

### Phase 2 : Candidature (3-6 mois avant)
- Préparer vos documents (CV, lettre de motivation)
- Passer les tests standardisés
- Candidater aux universités et bourses

### Phase 3 : Décisions (2-4 mois avant)
- Recevoir les offres d'admission
- Négocier les bourses
- Confirmer votre place

## Financement
💰 Bourses complètes : 20-30% des candidats
💰 Bourses partielles : 30-40% des candidats
💰 Autofinancement : Reste`,
    contentEn: `# Master abroad: A to Z

## Key process steps

### Phase 1 : Preparation (6-9 months before)
- Choose country and field
- Check prerequisites (GPA, GMAT/GRE, language)
- Compile list of target universities

### Phase 2 : Application (3-6 months before)
- Prepare documents (CV, motivation letter)
- Take standardized tests
- Apply to universities and scholarships

### Phase 3 : Decisions (2-4 months before)
- Receive admission offers
- Negotiate scholarships
- Confirm your place

## Funding
💰 Full scholarships : 20-30% of applicants
💰 Partial scholarships : 30-40% of applicants
💰 Self-funded : Remainder`
  },
  15: {
    titleFr: "PhD & Recherche : Financement et candidature",
    titleEn: "PhD & Research: Funding and application",
    descFr: "Trouver un directeur de thèse, bourses doctorales et contrats de recherche.",
    descEn: "Find a thesis supervisor, doctoral scholarships and research contracts.",
    levelFr: "Avancé", levelEn: "Advanced",
    readTime: "22 min", views: 2765, icon: "🔬", popular: false, category: 'level',
    contentFr: `# PhD & Recherche : Financement et candidature

## Trouver un directeur de thèse

### Étape 1 : Identifier des laboratoires
- Consulter les sites web des universités
- Lire les publications récentes des chercheurs
- Identifier ceux qui correspondent à vos intérêts

### Étape 2 : Prise de contact
- Email professionnel et ciblé
- Mentionner pourquoi ce laboratoire vous intéresse
- Joindre CV et résumé de projet

## Financements doctorants
- **Contrats d'allocation de recherche** : Financement complet
- **Bourses doctorales** : Énumérés par institution
- **Grants de recherche** : Via agences scientifiques

## Timeline PhD
- **Année 1** : Cours + initiation recherche
- **Années 2-3** : Recherche intensive
- **Année 4** : Rédaction et soutenance`,
    contentEn: `# PhD & Research: Funding and application

## Find a thesis supervisor

### Step 1 : Identify research groups
- Check university websites
- Read recent researcher publications
- Identify those matching your interests

### Step 2 : Make contact
- Professional and targeted email
- Mention why this lab interests you
- Attach CV and project summary

## Doctoral funding
- **Research allocation contracts** : Full funding
- **Doctoral scholarships** : Listed by institution
- **Research grants** : Via scientific agencies

## PhD timeline
- **Year 1** : Courses + research initiation
- **Years 2-3** : Intensive research
- **Year 4** : Writing and defense`
  }
};

// Token couleurs (identique aux autres pages)
const tokens = (theme) => ({
  accent: theme === "dark" ? "#4c9fd9" : "#0066b3",
  ink: theme === "dark" ? "#f2efe7" : "#141414",
  ink2: theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3: theme === "dark" ? "#a19f96" : "#6b6b6b",
  paper: theme === "dark" ? "#15140f" : "#faf8f3",
  paper2: theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule: theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft: theme === "dark" ? "#24231c" : "#e8e4d9",
  surface: theme === "dark" ? "#1a1912" : "#ffffff",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans: `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono: `"DM Sans", monospace`,
});

// ==================== COMPOSANT PRINCIPAL ====================
export default function GuidesPage({ setView }) {
  const { lang } = useT();      // ✅ Langue depuis le contexte global
  const { theme } = useTheme(); // ✅ Thème depuis le contexte global
  const c = tokens(theme);

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState(null);

  // Construire tous les guides
  const allGuides = Object.entries(guidesContent).map(([id, data]) => ({
    id: parseInt(id),
    ...data
  }));

  const guidesProcess = allGuides.filter(g => g.category === 'process');
  const guidesCountries = allGuides.filter(g => g.category === 'countries');
  const guidesLevel = allGuides.filter(g => g.category === 'level');
  const popularGuides = allGuides.filter(g => g.popular);

  const getLevelColor = (level) => {
    if (level === 'Débutant' || level === 'Beginner') return '#16a34a';
    if (level === 'Intermédiaire' || level === 'Intermediate') return '#eab308';
    return '#dc2626';
  };

  const formatViews = (views) => {
    if (views >= 1000) return `${Math.floor(views / 1000)}k+`;
    return views.toString();
  };

  const getFilteredGuides = () => {
    let result = [];
    if (activeTab === 'all') result = allGuides;
    else if (activeTab === 'process') result = guidesProcess;
    else if (activeTab === 'countries') result = guidesCountries;
    else if (activeTab === 'level') result = guidesLevel;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        (lang === 'fr' ? g.titleFr : g.titleEn).toLowerCase().includes(q)
      );
    }
    return result;
  };

  const filteredGuides = useMemo(() => getFilteredGuides(), [activeTab, search, lang]);

  // ==================== RENDU DÉTAIL GUIDE ====================
  if (selectedGuideId) {
    const guide = guidesContent[selectedGuideId];
    const content = lang === 'fr' ? guide.contentFr : guide.contentEn;
    
    return (
      <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
        {/* Header avec bouton retour */}
        <div style={{
          background: `linear-gradient(135deg, ${c.accent}08 0%, ${c.paper2} 100%)`,
          padding: '32px 24px',
          borderBottom: `1px solid ${c.rule}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedGuideId(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 14,
                color: c.accent,
                cursor: 'pointer',
                fontWeight: 600,
                padding: 0,
              }}
            >
              ← {lang === 'fr' ? 'Retour aux guides' : 'Back to guides'}
            </button>
          </div>
        </div>

        {/* Contenu du guide */}
        <article style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{guide.icon}</div>
            <h1 style={{
              fontFamily: c.fSerif,
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              marginBottom: 16,
              lineHeight: 1.3,
            }}>
              {lang === 'fr' ? guide.titleFr : guide.titleEn}
            </h1>
            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: c.ink3, flexWrap: 'wrap' }}>
              <span style={{ color: getLevelColor(guide.levelFr), fontWeight: 600 }}>
                {lang === 'fr' ? guide.levelFr : guide.levelEn}
              </span>
              <span>⏱️ {guide.readTime}</span>
              <span>👁️ {formatViews(guide.views)} {lang === 'fr' ? 'vues' : 'views'}</span>
            </div>
          </div>

          {/* Rendu markdown simplifié */}
          <div style={{
            fontSize: 15,
            lineHeight: 1.8,
            color: c.ink2,
          }}>
            {content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return (
                  <h2 key={i} style={{ 
                    fontFamily: c.fSerif, 
                    fontSize: 28, 
                    fontWeight: 700, 
                    marginTop: 32, 
                    marginBottom: 16,
                    color: c.ink,
                  }}>
                    {line.replace('# ', '')}
                  </h2>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h3 key={i} style={{ 
                    fontFamily: c.fSerif,
                    fontSize: 20, 
                    fontWeight: 700, 
                    marginTop: 24, 
                    marginBottom: 12,
                    color: c.ink,
                  }}>
                    {line.replace('## ', '')}
                  </h3>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h4 key={i} style={{ 
                    fontFamily: c.fSerif,
                    fontSize: 16, 
                    fontWeight: 600, 
                    marginTop: 18, 
                    marginBottom: 10,
                    color: c.ink,
                  }}>
                    {line.replace('### ', '')}
                  </h4>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <div key={i} style={{ marginLeft: 20, marginBottom: 8 }}>
                    • {line.replace('- ', '')}
                  </div>
                );
              }
              if (line.match(/^(✨|✅|❌|💰)/)) {
                return (
                  <div key={i} style={{ marginLeft: 20, marginBottom: 8 }}>
                    {line}
                  </div>
                );
              }
              if (line.trim() === '') {
                return <div key={i} style={{ height: 8 }} />;
              }
              return (
                <p key={i} style={{ marginBottom: 12 }}>
                  {line}
                </p>
              );
            })}
          </div>

          {/* CTA contact */}
          <div style={{
            marginTop: 64,
            padding: '32px',
            background: c.paper2,
            borderRadius: 16,
            border: `1px solid ${c.ruleSoft}`,
            textAlign: 'center',
          }}>
            <p style={{ marginBottom: 16, color: c.ink2 }}>
              {lang === 'fr'
                ? 'Des questions sur ce guide ? Notre équipe est là pour vous aider.'
                : 'Questions about this guide? Our team is here to help.'}
            </p>
            <button 
              onClick={() => setView && setView('contact')}
              style={{
                padding: '12px 32px',
                background: c.accent,
                color: c.paper,
                border: 'none',
                borderRadius: 40,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
              {lang === 'fr' ? 'Contacter un expert →' : 'Contact an expert →'}
            </button>
          </div>
        </article>
      </main>
    );
  }

  // ==================== RENDU LISTE DES GUIDES ====================
  const sections = [
    { id: 'all', labelFr: 'Tous les guides', labelEn: 'All guides', count: allGuides.length },
    { id: 'process', labelFr: 'Par étape', labelEn: 'By step', count: guidesProcess.length },
    { id: 'countries', labelFr: 'Par pays', labelEn: 'By country', count: guidesCountries.length },
    { id: 'level', labelFr: 'Par niveau', labelEn: 'By level', count: guidesLevel.length }
  ];

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${c.accent}08 0%, ${c.paper2} 100%)`,
        padding: '64px 24px 48px',
        textAlign: 'center',
        borderBottom: `1px solid ${c.rule}`,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(36px, 5vw, 52px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: c.ink,
            marginBottom: 16,
          }}>
            {lang === 'fr'
              ? 'Guides pour réussir votre admission'
              : 'Guides to succeed in your admission'}
          </h1>
          <p style={{ fontSize: 16, color: c.ink2, marginBottom: 32, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
            {lang === 'fr'
              ? 'Découvrez nos guides détaillés, nos conseils d\'experts et les stratégies gagnantes'
              : 'Discover our detailed guides, expert advice and winning strategies'}
          </p>
          <div style={{ maxWidth: 500, margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher un guide...' : 'Search guides...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px 12px 48px',
                border: `1px solid ${c.ruleSoft}`,
                borderRadius: 40,
                background: c.surface,
                color: c.ink,
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: c.ink3 }}>🔍</span>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${c.ruleSoft}`, marginBottom: 32, overflowX: 'auto' }}>
          {sections.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 0',
                background: 'none',
                border: 'none',
                fontSize: 15,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? c.accent : c.ink2,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? `2px solid ${c.accent}` : '2px solid transparent',
                transition: 'all 0.2s',
                marginRight: 24,
                whiteSpace: 'nowrap',
              }}
            >
              {lang === 'fr' ? tab.labelFr : tab.labelEn}
              <span style={{ fontSize: 12, marginLeft: 6, color: c.ink3 }}>({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Guides populaires */}
        {activeTab === 'all' && popularGuides.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, marginBottom: 24, color: c.ink }}>
              {lang === 'fr' ? 'Guides les plus populaires' : 'Most popular guides'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
              {popularGuides.map(guide => (
                <GuideCard key={guide.id} guide={guide} lang={lang} c={c} onClick={() => setSelectedGuideId(guide.id)} isPopular={true} getLevelColor={getLevelColor} formatViews={formatViews} />
              ))}
            </div>
          </div>
        )}

        {/* Liste des guides */}
        <div>
          <h2 style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, marginBottom: 24, color: c.ink }}>
            {activeTab === 'all'
              ? (lang === 'fr' ? 'Tous les guides' : 'All guides')
              : activeTab === 'process'
                ? (lang === 'fr' ? 'Par étape' : 'By step')
                : activeTab === 'countries'
                  ? (lang === 'fr' ? 'Par pays' : 'By country')
                  : (lang === 'fr' ? 'Par niveau' : 'By level')}
            <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 8, color: c.ink3 }}>({filteredGuides.length})</span>
          </h2>
          {filteredGuides.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32, paddingBottom: 64 }}>
              {filteredGuides.map(guide => (
                <GuideCard key={guide.id} guide={guide} lang={lang} c={c} onClick={() => setSelectedGuideId(guide.id)} isPopular={false} getLevelColor={getLevelColor} formatViews={formatViews} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px', color: c.ink2 }}>
              🔍 {lang === 'fr' ? 'Aucun guide trouvé.' : 'No guides found.'}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ==================== COMPOSANT CARD ====================
function GuideCard({ guide, lang, c, onClick, isPopular, getLevelColor, formatViews }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: c.surface,
        border: `1px solid ${c.ruleSoft}`,
        borderRadius: 16,
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = c.accent;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = c.ruleSoft;
      }}
    >
      {isPopular && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: 20,
          background: c.accent,
          color: c.paper,
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 14px',
          borderRadius: 20,
        }}>
          ⭐ {lang === 'fr' ? 'POPULAIRE' : 'POPULAR'}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ fontSize: 40 }}>{guide.icon}</div>
        <div style={{ fontSize: 12, color: c.ink3, fontWeight: 500, background: c.paper2, padding: '4px 8px', borderRadius: 6 }}>
          {formatViews(guide.views)}
        </div>
      </div>

      <h3 style={{
        fontFamily: c.fSerif,
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 12,
        color: c.ink,
        lineHeight: 1.3,
      }}>
        {lang === 'fr' ? guide.titleFr : guide.titleEn}
      </h3>

      <p style={{
        fontSize: 13,
        color: c.ink2,
        marginBottom: 16,
        lineHeight: 1.5,
        minHeight: 39,
      }}>
        {lang === 'fr' ? guide.descFr : guide.descEn}
      </p>

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: c.ink3, marginBottom: 18 }}>
        <span style={{ color: getLevelColor(guide.levelFr), fontWeight: 600 }}>
          {lang === 'fr' ? guide.levelFr : guide.levelEn}
        </span>
        <span>⏱️ {guide.readTime}</span>
      </div>

      <button style={{
        padding: '8px 0',
        background: 'transparent',
        border: 'none',
        color: c.accent,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}>
        {lang === 'fr' ? 'Lire le guide' : 'Read guide'} →
      </button>
    </div>
  );
}
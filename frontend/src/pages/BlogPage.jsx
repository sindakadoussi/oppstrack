// BlogPage.jsx — Page blog OppsTrack enrichie avec modal article complet
"use client";

import React, { useState, useMemo } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

/* ═══════════════════════════════════════════════════════════════════
   TOKENS OppsTrack
═══════════════════════════════════════════════════════════════════ */
const tokens = (theme) => ({
  accent:      theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentDark:  theme === "dark" ? "#3a8fc9" : "#004f8a",
  accentSoft:  theme === "dark" ? "rgba(76,159,217,0.10)" : "rgba(0,102,179,0.08)",
  paper:       theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:      theme === "dark" ? "#1d1c16" : "#f2efe7",
  surface:     theme === "dark" ? "#1a1912" : "#ffffff",
  ink:         theme === "dark" ? "#f2efe7" : "#141414",
  ink2:        theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:        theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4:        theme === "dark" ? "#6d6b64" : "#9a9794",
  rule:        theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft:    theme === "dark" ? "#24231c" : "#e8e4d9",
  success:     "#166534",
  warning:     "#b06a12",
  danger:      "#b4321f",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono:  `"DM Sans", monospace`,
  tr: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
});

/* ═══════════════════════════════════════════════════════════════════
   MOCK BLOG DATA — Avec contenu détaillé
═══════════════════════════════════════════════════════════════════ */
const MOCK_ARTICLES = (lang) => [
  {
    id: 1,
    category: 'guide',
    categoryLabel: lang === 'fr' ? 'Guide' : 'Guide',
    title: lang === 'fr'
      ? 'Comment décrocher une bourse DAAD en 2026 : guide complet'
      : 'How to land a DAAD scholarship in 2026: complete guide',
    excerpt: lang === 'fr'
      ? 'De l\'éligibilité à la lettre de motivation, tous les secrets pour maximiser vos chances avec la bourse allemande la plus convoitée.'
      : 'From eligibility to motivation letter, all the secrets to maximize your chances with the most coveted German scholarship.',
    content: lang === 'fr'
      ? `## La bourse DAAD : l'opportunité allemande par excellence

La Deutsche Akademische Austauschdienst (DAAD) est l'une des plus prestigieuses institutions de financement au monde. Chaque année, elle octroie des bourses à plus de 140,000 étudiants internationaux.

### Qui peut postuler ?

- Étudiants de tous les pays (sauf restrictions géographiques)
- Master et Doctorat (principalement)
- Certains programmes de Licence sélectifs
- Professionnels avec expérience

### Critères d'éligibilité essentiels

**Score académique :** Minimum 3.0/4.0 ou équivalent (2.5+ pour certains programmes)
**Langue :** Allemand B2 ou anglais C1 minimum
**Expérience :** Au moins 2 années d'expérience professionnelle souhaitable
**Statut :** Doctorat ou Master reconnu

### Étapes de la candidature

1. **Sélection du programme** (450+ programmes disponibles sur daad.de)
2. **Préparation du dossier** (relevés de notes, CV, lettres de recommandation)
3. **Soumission en ligne** (Portail DAAD - deadline généralement 30 novembre)
4. **Entretien de sélection** (En ligne ou sur place, 20-30 minutes)
5. **Notification des résultats** (Juin-Juillet de l'année suivante)

### Éléments clés du dossier

**Lettre de motivation :**
- 500-750 mots en anglais ou allemand
- Structurée et personnelle
- Explique votre parcours et vos objectifs

**Relevés de notes :**
- Traduction certifiée en anglais
- Avec GPA ou moyenne calculée

**Lettres de recommandation :**
- 2-3 lettres de professeurs ou employeurs
- Directes (pas de copie pour le candidat)
- Dans une enveloppe officielle fermée

### Conseils pour réussir

✓ Soyez spécifique sur le programme et l'université choisis
✓ Montrez votre passion pour le domaine d'études
✓ Mettez en avant votre impact potentiel
✓ Prouvez votre pertinence pour le programme
✓ Vérifiez les critères spécifiques du programme

### Budget mensuel estimé

La baise DAAD couvre :
- Frais de scolarité : 0€ (universités publiques allemandes gratuites)
- Allocation mensuelle : 935€
- Assurance santé : comprise
- Coûts de voyage : partiellement couverts

### Taux d'acceptation

- Master : ~15-20% de candidats acceptés
- Doctorat : ~10-15% de candidats acceptés
- Variable selon le programme et le pays d'origine

**Commencez vos recherches maintenant !** Les meilleures applications sont préparées 3-4 mois avant la deadline.`
      : `## The DAAD Scholarship: Germany's Premier Opportunity

The Deutsche Akademische Austauschdienst (DAAD) is one of the world's most prestigious funding institutions. Each year, it awards scholarships to over 140,000 international students.

### Who Can Apply?

- Students from all countries (except geographic restrictions)
- Master's and Doctoral degrees (primarily)
- Selected Bachelor's programs
- Professionals with relevant experience

### Essential Eligibility Criteria

**Academic Score:** Minimum 3.0/4.0 or equivalent (2.5+ for some programs)
**Language:** German B2 or English C1 minimum
**Experience:** At least 2 years professional experience preferred
**Status:** Master's or Doctorate degree recognized

### Application Steps

1. **Program Selection** (450+ programs available on daad.de)
2. **File Preparation** (transcripts, CV, recommendation letters)
3. **Online Submission** (DAAD Portal - usually deadline November 30)
4. **Interview Selection** (Online or in-person, 20-30 minutes)
5. **Results Notification** (June-July of the following year)

### Key Dossier Elements

**Motivation Letter:**
- 500-750 words in English or German
- Structured and personal
- Explains your journey and goals

**Transcripts:**
- Certified English translation
- With GPA or calculated average

**Recommendation Letters:**
- 2-3 letters from professors or employers
- Direct submission (no copies for candidate)
- In official sealed envelope

### Tips for Success

✓ Be specific about the program and university chosen
✓ Show your passion for the field of study
✓ Highlight your potential impact
✓ Prove your relevance for the program
✓ Check program-specific criteria

### Estimated Monthly Budget

DAAD scholarship covers:
- Tuition: €0 (German public universities are free)
- Monthly allowance: €935
- Health insurance: included
- Travel costs: partially covered

### Acceptance Rates

- Master's: ~15-20% of applicants accepted
- Doctorate: ~10-15% of applicants accepted
- Varies by program and country of origin

**Start your research now!** The best applications are prepared 3-4 months before the deadline.`,
    author: 'Sarah Müller',
    authorRole: lang === 'fr' ? 'Conseillère DAAD' : 'DAAD Counselor',
    date: '2026-04-18',
    readTime: 12,
    image: 'gradient-1',
    featured: true,
    tags: ['DAAD', 'Germany', 'Master'],
  },
  {
    id: 2,
    category: 'success',
    categoryLabel: lang === 'fr' ? 'Témoignage' : 'Success Story',
    title: lang === 'fr'
      ? 'D\'Alger à Berlin : mon parcours avec OppsTrack'
      : 'From Algiers to Berlin: my journey with OppsTrack',
    excerpt: lang === 'fr'
      ? 'Amira raconte comment elle a obtenu trois offres en six mois grâce à la plateforme et au simulateur d\'entretien.'
      : 'Amira tells how she got three offers in six months thanks to the platform and interview simulator.',
    content: lang === 'fr'
      ? `## Mon parcours de six mois qui a changé ma vie

Je m'appelle Amira Belkacem, et je suis une jeune femme algérienne qui rêvait depuis longtemps d'étudier en Europe. Avant de découvrir OppsTrack, j'avais accumulé rejets et incertitudes.

### Le début : mes objectifs

- Master en Biotechnologie en Allemagne ou Suisse
- Bourse partielle ou complète
- Stage en laboratoire de recherche

### Les premiers défis (Janvier 2026)

J'ai commencé mes recherches de bourses mais j'étais rapidement submergée. Les bourses sont nombreuses mais les critères changent d'une agence à l'autre. Les applications demandent beaucoup de documents et je ne savais pas comment les optimiser.

**Sentiment :** Paralysie décisionnelle totale. Comment choisir parmi 500+ bourses ?

### Découverte d'OppsTrack (Février 2026)

Mon ami m'a recommandé OppsTrack. J'ai créé un profil avec :
- Mon GPA : 3.8/4.0
- Mes expériences : 2 ans en laboratoire
- Mes préférences : Allemagne, Suisse, Biotechnologie
- Langues : Français, anglais C1, allemand A2

**Résultat de l'analyse :** 78% de compatibilité avec 12 bourses DAAD et 5 bourses suisses. C'était encourageant !

### Le travail acharné (Mars - Avril 2026)

**Rédaction de la lettre de motivation :**
- OppsTrack m'aide à structurer mes idées
- Suggestions d'amélioration en temps réel
- Feedback IA détaillé sur chaque section
- Je rédige 5 versions avant satisfaction

**Préparation des entretiens :**
- Simulateur d'entretien : 10 sessions
- Questions pratiquées : "Why this program?", "Your research goals?", "Challenges you've overcome"
- Feedback vidéo sur mon langage corporel

### Les candidatures (Avril 2026)

**Candidature 1 : DAAD Berlin (TU)**
- Soumission : 15 avril
- Entretien : 22 mai
- Résultat : Admissible !

**Candidature 2 : Swiss Government Scholarship (ETH Zurich)**
- Soumission : 18 avril
- Entretien : 28 mai
- Résultat : Acceptée !

**Candidature 3 : Master-Plus Program (Heidelberg)**
- Soumission : 20 avril
- Résultat : Acceptée avec bourse + stage !

### Les trois offres finales

1. **DAAD Scholarship - Berlin, TU Berlin**
   - 1,102€/mois
   - 2 ans couverts
   - Début : septembre 2026

2. **Swiss Government Excellence Scholarship - Zurich, ETH**
   - 1,800€/mois
   - Logement compris
   - Début : septembre 2026

3. **Master-Plus Program - Heidelberg**
   - 950€/mois
   - Stage en laboratoire Max Planck
   - Début : octobre 2026

### Ce que OppsTrack m'a apporté

- **Clarté :** Au lieu de paralysie, j'ai eu une roadmap claire
- **Feedback réel :** Pas juste du contenu générique
- **Confiance :** Grâce au simulateur d'entretien
- **Réseau :** Connexion avec d'autres candidats
- **Stratégie :** Priorisation des candidatures

### Ma décision finale

J'ai choisi **ETH Zurich** car :
- Excellence académique reconnue
- Suisse = stabilité et qualité de vie
- Campus cosmopolite (60% étudiants internationaux)
- Salaire post-master excellent (70k+ CHF/an)

### Leçon clé

> La bonne stratégie + la bonne préparation = succès

OppsTrack m'a aidée sur les deux fronts. Sans lui, j'aurais probablement posé une ou deux candidatures médiocres. Avec lui, j'ai eu le luxe de choisir entre trois excellentes offres.

**Pour les étudiants en Afrique du Nord :** C'est possible. Commencez tôt, soyez stratégiques, et utilisez les outils disponibles. OppsTrack a été le game-changer pour moi.`
      : `## Six Months That Changed My Life

My name is Amira Belkacem, and I'm a young Algerian woman who had long dreamed of studying in Europe. Before discovering OppsTrack, I had accumulated rejections and uncertainty.

### The Beginning: My Goals

- Master's in Biotechnology in Germany or Switzerland
- Partial or full scholarship
- Research laboratory internship

### Early Challenges (January 2026)

I started my scholarship research but was quickly overwhelmed. There are many scholarships but criteria vary from agency to agency. Applications require many documents and I didn't know how to optimize them.

**Feeling:** Complete decision paralysis. How to choose among 500+ scholarships?

### Discovering OppsTrack (February 2026)

My friend recommended OppsTrack. I created a profile with:
- My GPA: 3.8/4.0
- My experience: 2 years in laboratory
- My preferences: Germany, Switzerland, Biotechnology
- Languages: French, English C1, German A2

**Analysis Result:** 78% compatibility with 12 DAAD scholarships and 5 Swiss scholarships. It was encouraging!

### Hard Work (March - April 2026)

**Writing Motivation Letter:**
- OppsTrack helps me structure my ideas
- Real-time improvement suggestions
- Detailed AI feedback on each section
- I write 5 versions before satisfaction

**Interview Preparation:**
- Interview simulator: 10 sessions
- Practiced questions: "Why this program?", "Your research goals?", "Challenges overcome"
- Video feedback on body language

### Applications (April 2026)

**Application 1: DAAD Berlin (TU)**
- Submission: April 15
- Interview: May 22
- Result: Admissible!

**Application 2: Swiss Government Scholarship (ETH Zurich)**
- Submission: April 18
- Interview: May 28
- Result: Accepted!

**Application 3: Master-Plus Program (Heidelberg)**
- Submission: April 20
- Result: Accepted with scholarship + internship!

### The Three Final Offers

1. **DAAD Scholarship - Berlin, TU Berlin**
   - €1,102/month
   - 2 years covered
   - Start: September 2026

2. **Swiss Government Excellence Scholarship - Zurich, ETH**
   - €1,800/month
   - Housing included
   - Start: September 2026

3. **Master-Plus Program - Heidelberg**
   - €950/month
   - Max Planck laboratory internship
   - Start: October 2026

### What OppsTrack Gave Me

- **Clarity:** Instead of paralysis, I had a clear roadmap
- **Real Feedback:** Not just generic content
- **Confidence:** Thanks to the interview simulator
- **Network:** Connection with other candidates
- **Strategy:** Application prioritization

### My Final Decision

I chose **ETH Zurich** because:
- Recognized academic excellence
- Switzerland = stability and quality of life
- Cosmopolitan campus (60% international students)
- Excellent post-master salary (70k+ CHF/year)

### Key Lesson

> Right strategy + good preparation = success

OppsTrack helped me with both. Without it, I would probably have submitted one or two mediocre applications. With it, I had the luxury of choosing between three excellent offers.

**For North African students:** It's possible. Start early, be strategic, and use available tools. OppsTrack was the game-changer for me.`,
    author: 'Amira Belkacem',
    authorRole: lang === 'fr' ? 'Étudiante Master' : 'Master Student',
    date: '2026-04-15',
    readTime: 10,
    image: 'gradient-2',
    tags: ['Témoignage', 'Allemagne'],
  },
  {
    id: 3,
    category: 'tips',
    categoryLabel: lang === 'fr' ? 'Conseils' : 'Tips',
    title: lang === 'fr'
      ? '7 erreurs à éviter dans votre lettre de motivation'
      : '7 mistakes to avoid in your motivation letter',
    excerpt: lang === 'fr'
      ? 'Les pièges classiques qui coulent les meilleures candidatures, et comment les contourner avec notre IA.'
      : 'The classic traps that sink the best applications, and how to avoid them with our AI.',
    content: lang === 'fr'
      ? `## Les 7 Erreurs à Éviter - Guide Pratique

Une bonne lettre de motivation peut faire la différence entre acceptation et rejet. Voici les erreurs les plus courantes et comment les éviter.

### Erreur 1 : Être trop générique

❌ **Mauvais :** 
"Je veux faire un master en informatique pour progresser dans ma carrière et acquérir de nouvelles compétences."

✅ **Bon :** 
"Je veux rejoindre le programme Data Science de l'ETH pour approfondir mon expertise en machine learning appliqué à la biologie. Les trois dernières années en laboratoire m'ont montré que combiner programmation et sciences biologiques ouvre des horizons uniques."

### Erreur 2 : Oublier de relier votre parcours au programme

Le jury veut voir une progression logique.

❌ **Mauvais :** Lister vos accomplissements
✅ **Bon :** Montrer comment chaque étape vous prépare pour THIS programme spécifique

**Exemple :** "Mon stage en... + mon projet en... + mes cours en... = j'ai identifié cette lacune que je veux combler à l'Université X"

### Erreur 3 : Trop de vente de soi-même vs trop d'humilité

Le juggling est difficile.

❌ **Trop confiant :** "Je suis l'un des meilleurs candidats que vous verrez"
❌ **Trop humble :** "Je ne suis pas vraiment qualifié mais j'aimerais essayer"
✅ **Équilibré :** "Ma préparation + mon expérience + ma motivation me positionnent bien pour réussir dans ce programme"

### Erreur 4 : Ignorer les critères spécifiques du jury

Chaque programme/agence a ses priorités.

**Pour DAAD :** Mettez l'accent sur votre retour au pays, impact social
**Pour bourses suisses :** Excellence académique, intégration, respect des règles
**Pour UK (Chevening) :** Leadership, influence, changement sociétal

### Erreur 5 : Une structure faible

Le jury lit en 90 secondes. Structure claire = meilleure compréhension.

**Structure gagnante :**
1. **Accroche personnelle** (2-3 phrases) - Hook them!
2. **Votre passion** (3-4 phrases) - Why this field?
3. **Pourquoi ce programme** (4-5 phrases) - Specific details!
4. **Votre contribution future** (3-4 phrases) - What will you do?
5. **Conclusion inspirante** (2-3 phrases) - Call to action

### Erreur 6 : Ne pas relire / réviser

Les fautes d'orthographe et grammaire = élimination automatique pour certains jury.

**Checklist:**
- Orthographe vérifiée 3x
- Grammaire impeccable
- Ponctuation correcte
- Pas de répétitions de mots
- Pas de phrases maladroites

### Erreur 7 : Ne pas respecter les limites de longueur

Si max 500 mots, n'écrivez pas 700.

**Pourquoi :** Cela montre que vous ne pouvez pas:
- Suivre les instructions
- Être concis et efficace
- Respecter les règles

**Astuce :** Comptez les mots automatiquement. Visez 80-90% du max autorisé.

### Bonus : Vérification finale

✓ Réponse directe à la question posée ?
✓ Aucun copiage-collage généralisé ?
✓ Tons adapté au programme/pays ?
✓ Détails spécifiques du programme mentionnés ?
✓ Un " nous " ou " vous " au lieu de " je " partout ?
✓ Logique de progression claire ?

### Ressources

- OppsTrack AI Review : feedback en temps réel
- Simulation: comparaison avec 1000+ lettres acceptées
- Mentors : feedback humain de experts du domaine`
      : `## The 7 Biggest Mistakes - Practical Guide

A good motivation letter can make the difference between acceptance and rejection. Here are the most common mistakes and how to avoid them.

### Mistake 1: Being Too Generic

❌ **Bad:** 
"I want to pursue a master's in computer science to advance my career and acquire new skills."

✅ **Good:** 
"I want to join ETH's Data Science program to deepen my expertise in machine learning applied to biology. The last three years in the laboratory showed me that combining programming and biological sciences opens unique horizons."

### Mistake 2: Failing to Connect Your Background to the Program

The jury wants to see logical progression.

❌ **Bad:** Listing your accomplishments
✅ **Good:** Showing how each step prepares you for THIS specific program

**Example:** "My internship in... + my project in... + my courses in... = I identified this gap I want to fill at University X"

### Mistake 3: Selling Yourself Too Much vs Too Little

The juggling act is difficult.

❌ **Too confident:** "I'm one of the best candidates you'll see"
❌ **Too humble:** "I'm not really qualified but I'd like to try"
✅ **Balanced:** "My preparation + my experience + my motivation position me well to succeed in this program"

### Mistake 4: Ignoring Jury-Specific Criteria

Each program/agency has its priorities.

**For DAAD:** Emphasize your return to country, social impact
**For Swiss scholarships:** Academic excellence, integration, rule compliance
**For UK (Chevening):** Leadership, influence, societal change

### Mistake 5: Weak Structure

The jury reads in 90 seconds. Clear structure = better understanding.

**Winning Structure:**
1. **Personal Hook** (2-3 sentences) - Hook them!
2. **Your Passion** (3-4 sentences) - Why this field?
3. **Why This Program** (4-5 sentences) - Specific details!
4. **Your Future Contribution** (3-4 sentences) - What will you do?
5. **Inspiring Conclusion** (2-3 sentences) - Call to action

### Mistake 6: Not Proofreading / Revising

Spelling and grammar mistakes = automatic elimination for some juries.

**Checklist:**
- Spelling verified 3x
- Grammar flawless
- Punctuation correct
- No word repetitions
- No awkward sentences

### Mistake 7: Not Respecting Word Limits

If max 500 words, don't write 700.

**Why:** It shows you can't:
- Follow instructions
- Be concise and efficient
- Respect rules

**Tip:** Count words automatically. Aim for 80-90% of the allowed max.

### Bonus: Final Verification

✓ Direct answer to the question asked?
✓ No generalized copy-paste?
✓ Tone adapted to program/country?
✓ Specific program details mentioned?
✓ "We" or "you" instead of "I" everywhere?
✓ Clear logic of progression?

### Resources

- OppsTrack AI Review: real-time feedback
- Simulation: comparison with 1000+ accepted letters
- Mentors: human feedback from domain experts`,
    author: 'Dr. James Wilson',
    authorRole: lang === 'fr' ? 'Admissions UK' : 'UK Admissions',
    date: '2026-04-10',
    readTime: 8,
    image: 'gradient-3',
    tags: ['Lettre', 'Écriture'],
  },
];

const CATEGORIES = (lang) => [
  { id: 'all',       label: lang === 'fr' ? 'Tous'           : 'All' },
  { id: 'guide',     label: lang === 'fr' ? 'Guides'         : 'Guides' },
  { id: 'tips',      label: lang === 'fr' ? 'Conseils'       : 'Tips' },
  { id: 'success',   label: lang === 'fr' ? 'Témoignages'    : 'Stories' },
];

/* ═══════════════════════════════════════════════════════════════════
   ARTICLE COVER
═══════════════════════════════════════════════════════════════════ */
function ArticleCover({ variant, c, height = 220 }) {
  const variants = {
    'gradient-1': { bg: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`, icon: '🇩🇪' },
    'gradient-2': { bg: `linear-gradient(135deg, ${c.warning}, #8b4f0a)`,        icon: '✈️' },
    'gradient-3': { bg: `linear-gradient(135deg, ${c.danger}, #8b1810)`,         icon: '✉️' },
    'gradient-4': { bg: `linear-gradient(135deg, ${c.success}, #0d4f28)`,        icon: '🍁' },
  };

  const v = variants[variant] || variants['gradient-1'];

  return (
    <div style={{
      height,
      background: v.bg,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        fontSize: height > 200 ? 64 : 48,
        position: 'relative',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
      }}>
        {v.icon}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MODAL ARTICLE DÉTAILLÉ
═══════════════════════════════════════════════════════════════════ */
function ArticleModal({ article, c, lang, onClose }) {
  const formatDate = (d) => new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  const renderContent = (content) => {
    return content.split('\n\n').map((paragraph, i) => {
      if (paragraph.startsWith('## ')) {
        return (
          <h2 key={i} style={{
            fontFamily: c.fSerif, fontSize: 28,
            fontWeight: 700, color: c.ink,
            marginTop: 32, marginBottom: 16,
            letterSpacing: '-0.015em',
          }}>
            {paragraph.replace('## ', '')}
          </h2>
        );
      }
      if (paragraph.startsWith('### ')) {
        return (
          <h3 key={i} style={{
            fontFamily: c.fSerif, fontSize: 20,
            fontWeight: 700, color: c.ink,
            marginTop: 24, marginBottom: 12,
            letterSpacing: '-0.01em',
          }}>
            {paragraph.replace('### ', '')}
          </h3>
        );
      }
      if (paragraph.includes('❌') || paragraph.includes('✅') || paragraph.includes('✓')) {
        return (
          <div key={i} style={{
            marginBottom: 12,
            padding: '12px 16px',
            background: c.paper2,
            borderLeft: `4px solid ${c.accent}`,
            fontFamily: c.fSans,
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {paragraph}
          </div>
        );
      }
      if (paragraph.startsWith('-')) {
        const items = paragraph.split('\n').filter(l => l.startsWith('-'));
        return (
          <ul key={i} style={{
            marginBottom: 16,
            paddingLeft: 24,
            listStyle: 'disc',
          }}>
            {items.map((item, j) => (
              <li key={j} style={{ marginBottom: 8, fontFamily: c.fSans, fontSize: 14, lineHeight: 1.6 }}>
                {item.replace('- ', '')}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={i} style={{
          marginBottom: 16,
          fontFamily: c.fSans,
          fontSize: 15,
          lineHeight: 1.8,
          color: c.ink2,
        }}>
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-start',
      overflowY: 'auto',
      zIndex: 2000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease',
    }} onClick={onClose}>
      <div style={{
        background: c.surface,
        maxWidth: 900,
        width: '90%',
        margin: '40px auto',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'slideUp 0.3s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'fixed', top: 20, right: 20,
          width: 40, height: 40,
          background: c.surface, border: `1px solid ${c.rule}`,
          borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: c.ink3,
          zIndex: 2001,
          transition: c.tr,
        }}>
          ✕
        </button>

        {/* Cover */}
        <ArticleCover variant={article.image} c={c} height={320} />

        {/* Content */}
        <div style={{ padding: '48px 44px' }}>
          {/* Meta */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 24, paddingBottom: 16,
            borderBottom: `1px solid ${c.ruleSoft}`,
            flexWrap: 'wrap',
          }}>
            <span style={{
              padding: '6px 12px',
              background: c.accentSoft,
              fontFamily: c.fMono, fontSize: 9,
              color: c.accent, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              {article.categoryLabel}
            </span>
            <span style={{ fontFamily: c.fMono, fontSize: 10, color: c.ink3, letterSpacing: '0.08em' }}>
              {formatDate(article.date)}
            </span>
            <span style={{ fontFamily: c.fMono, fontSize: 10, color: c.ink3, letterSpacing: '0.08em' }}>
              {article.readTime} {lang === 'fr' ? 'min' : 'min read'}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: c.ink,
            marginBottom: 24,
          }}>
            {article.title}
          </h1>

          {/* Author */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 32, paddingBottom: 20,
            borderBottom: `1px solid ${c.ruleSoft}`,
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: c.fSerif, fontWeight: 700, fontSize: 18,
            }}>
              {article.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: c.ink }}>
                {article.author}
              </div>
              <div style={{ fontFamily: c.fMono, fontSize: 11, color: c.ink3, letterSpacing: '0.06em', marginTop: 4 }}>
                {article.authorRole}
              </div>
            </div>
          </div>

          {/* Article body */}
          <div style={{ maxWidth: 720 }}>
            {renderContent(article.content)}
          </div>

          {/* Tags */}
          {article.tags && (
            <div style={{
              marginTop: 40, paddingTop: 24,
              borderTop: `1px solid ${c.ruleSoft}`,
              display: 'flex', gap: 8, flexWrap: 'wrap',
            }}>
              {article.tags.map((tag, i) => (
                <span key={i} style={{
                  padding: '6px 12px',
                  background: c.paper2, border: `1px solid ${c.ruleSoft}`,
                  fontFamily: c.fMono, fontSize: 11,
                  color: c.ink3, fontWeight: 600,
                  letterSpacing: '0.05em',
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ARTICLE CARD
═══════════════════════════════════════════════════════════════════ */
function ArticleCard({ article, index, c, lang, onOpen }) {
  const formatDate = (d) => new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const [hovered, setHovered] = useState(false);

  return (
    <article
      onClick={() => onOpen(article)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.surface,
        border: `1px solid ${c.rule}`,
        cursor: 'pointer',
        transition: c.tr,
        display: 'flex', flexDirection: 'column',
        animation: `fadeUp 0.5s ease ${index * 0.07}s both`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 32px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <ArticleCover variant={article.image} c={c} height={180} />

      <div style={{ padding: '20px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontFamily: c.fMono, fontSize: 9,
          color: c.accent, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          ◆ {article.categoryLabel}
        </div>

        <h3 style={{
          fontFamily: c.fSerif, fontSize: 19,
          fontWeight: 700, lineHeight: 1.25,
          letterSpacing: '-0.015em',
          color: hovered ? c.accent : c.ink,
          margin: '0 0 12px',
          transition: c.tr,
        }}>
          {article.title}
        </h3>

        <p style={{
          fontFamily: c.fSans, fontSize: 13,
          color: c.ink3, lineHeight: 1.55,
          margin: '0 0 18px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1,
        }}>
          {article.excerpt}
        </p>

        {article.tags && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {article.tags.slice(0, 2).map((tag, i) => (
              <span key={i} style={{
                padding: '3px 8px',
                background: c.paper2, border: `1px solid ${c.ruleSoft}`,
                fontFamily: c.fMono, fontSize: 9,
                color: c.ink3, fontWeight: 600,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingTop: 14, borderTop: `1px solid ${c.ruleSoft}`,
          marginTop: 'auto',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: `linear-gradient(135deg, ${c.accent}, ${c.accentDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: c.fSerif, fontWeight: 700, fontSize: 10,
          }}>
            {article.author.split(' ')[0][0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: c.fSans, fontSize: 11, fontWeight: 600, color: c.ink2 }}>
              {article.author}
            </div>
            <div style={{ fontFamily: c.fMono, fontSize: 9, color: c.ink4, marginTop: 1 }}>
              {formatDate(article.date)} · {article.readTime} min
            </div>
          </div>
          <span style={{ color: c.accent, fontSize: 16, transition: c.tr, transform: hovered ? 'translateX(4px)' : 'translateX(0)' }}>→</span>
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function BloQPage({ setView }) {
  const { lang } = useT?.() || { lang: 'fr' };
  const { theme } = useTheme?.() || { theme: 'light' };
  const c = tokens(theme);

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const articles = MOCK_ARTICLES(lang);
  const categories = CATEGORIES(lang);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return articles;
    return articles.filter(a => a.category === activeCategory);
  }, [articles, activeCategory]);

  return (
    <main style={{ background: c.paper, color: c.ink, fontFamily: c.fSans, minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1200px) {
          .articles-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .articles-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Hero */}
      <section style={{
        background: c.paper2,
        padding: '72px 32px 56px',
        borderBottom: `1px solid ${c.rule}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          

          <h1 style={{
            fontFamily: c.fSerif,
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.02,
            color: c.ink,
            margin: '0 0 22px',
          }}>
            {lang === 'fr'
              ? <>Conseils, <em style={{ color: c.accent, fontStyle: 'italic' }}>témoignages</em><br />et guides pour réussir.</>
              : <>Tips, <em style={{ color: c.accent, fontStyle: 'italic' }}>stories</em><br />and guides to succeed.</>}
          </h1>

          <p style={{ fontSize: 17, color: c.ink2, lineHeight: 1.6, maxWidth: 620, margin: 0 }}>
            {lang === 'fr'
              ? 'Le journal éditorial d\'OppsTrack — tout pour maximiser vos chances d\'obtenir une bourse.'
              : 'The OppsTrack editorial journal — everything to maximize your chances of getting a scholarship.'}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section style={{ background: c.surface, borderBottom: `1px solid ${c.rule}`, padding: '20px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  background: active ? c.ink : 'transparent',
                  color: active ? c.paper : c.ink2,
                  border: `1px solid ${active ? c.ink : c.rule}`,
                  fontFamily: c.fMono, fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: c.tr,
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: '48px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="articles-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}>
            {filtered.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={i}
                c={c}
                lang={lang}
                onOpen={setSelectedArticle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          c={c}
          lang={lang}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </main>
  );
}
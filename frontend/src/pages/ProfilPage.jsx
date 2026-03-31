import React, { useState, useEffect } from 'react';
import axiosInstance from '@/config/axiosInstance';


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

export default function ProfilPage({ user, setUser, handleLogout, handleQuickReply }) {
  const [tab,     setTab]     = useState('personal');
  const [profile, setProfile] = useState(emptyProfile);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

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

      const { data: result } = await axiosInstance.patch(
        `/api/users/${user.id}/update-profile`,
        body
      );

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
      setTimeout(() => setSaved(false), 3001);
    } catch (err) {
      console.error('[ProfilPage]', err.response?.data || err.message);
    } finally {
      setSaving(false);
    }
  };

  // Score complétude
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
    <div style={S.locked}>
      <span style={{ fontSize: 48 }}>👤</span>
      <h3 style={{ color: '#e2e8f0' }}>Profil non disponible</h3>
      <p style={{ color: '#64748b' }}>Connectez-vous pour accéder à votre profil</p>
      <button style={S.lockBtn} onClick={() => handleQuickReply('Je veux me connecter')}>🔐 Se connecter</button>
    </div>
  );

  // Helpers mutation
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
      {/* Header */}
      <div style={S.header}>
        <div style={S.hLeft}>
          <div style={S.avatar}>{(user.name || user.email || 'U')[0].toUpperCase()}</div>
          <div>
            <div style={S.hName}>{user.name || 'Mon Profil'}</div>
            <div style={S.hEmail}>{user.email}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={S.scoreLabel}>Complétude du profil</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={S.scoreBarBg}>
              <div style={{ ...S.scoreBarFill, width: `${score}%`, background: score >= 80 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#6366f1' }} />
            </div>
            <span style={{ color: score >= 80 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#818cf8', fontWeight: 700 }}>{score}%</span>
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
            {scoreItems.filter(Boolean).length}/{scoreItems.length} sections remplies
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* Tabs */}
        <div style={S.tabBar}>
          {tabs.map(t => (
            <button key={t.id} style={{ ...S.tabBtn, ...(tab === t.id ? S.tabOn : {}) }} onClick={() => setTab(t.id)}>
              <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── PERSONNEL ─────────────────────────────────────────── */}
        {tab === 'personal' && (
          <div style={S.sec}>
            <T>Informations personnelles</T>
            <div style={S.g2}>
              <F label="Nom complet"       v={profile.name}               s={v => setProfile(p => ({ ...p, name: v }))}               ph="Prénom Nom" />
              <F label="Email"             v={profile.email}              readOnly />
              <F label="Téléphone"         v={profile.phone}              s={v => setProfile(p => ({ ...p, phone: v }))}              ph="+216 XX XXX XXX" />
              <F label="Date de naissance" v={profile.dateOfBirth}        s={v => setProfile(p => ({ ...p, dateOfBirth: v }))}        type="date" />
              <F label="Nationalité"       v={profile.nationality}        s={v => setProfile(p => ({ ...p, nationality: v }))}        ph="Ex: Tunisienne" />
              <F label="Pays de résidence" v={profile.countryOfResidence} s={v => setProfile(p => ({ ...p, countryOfResidence: v }))} ph="Ex: Tunisie" />
            </div>

            <T>Liens professionnels</T>
            <div style={S.g2}>
              <F label="LinkedIn"  v={profile.linkedin}  s={v => setProfile(p => ({ ...p, linkedin: v }))}  ph="linkedin.com/in/votre-profil" />
              <F label="GitHub"    v={profile.github}    s={v => setProfile(p => ({ ...p, github: v }))}    ph="github.com/votre-compte" />
              <div style={{ gridColumn: '1/-1' }}>
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
                  <div style={{ gridColumn: '1/-1' }}>
                    <F label="Description" v={a.description} s={v => upd('awards')(i, 'description', v)} ph="Brève description du prix" />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('awards')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('awards', { title: '', organization: '', year: '', description: '' })}>+ Ajouter une distinction</button>
          </div>
        )}

        {/* ── FORMATION ─────────────────────────────────────────── */}
        {tab === 'academic' && (
          <div style={S.sec}>
            <T>Formation actuelle</T>
            <div style={S.g2}>
              <div>
                <div style={S.lbl}>Niveau actuel</div>
                <select style={S.inp} value={profile.currentLevel} onChange={e => setProfile(p => ({ ...p, currentLevel: e.target.value }))}>
                  <option value="">Sélectionner...</option>
                  {['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat', 'Ingénieur 1', 'Ingénieur 2', 'Ingénieur 3'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <F label="Domaine d'études" v={profile.fieldOfStudy}   s={v => setProfile(p => ({ ...p, fieldOfStudy: v }))}   ph="Ex: Informatique de Gestion" />
              <div style={{ gridColumn: '1/-1' }}>
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
                  <F label="Domaine"         v={h.field}       s={v => upd('academicHistory')(i, 'field', v)}       ph="Ex: Mathématiques" />
                  <F label="Année"           v={h.year}        s={v => upd('academicHistory')(i, 'year', v)}        ph="2022" />
                  <div style={{ gridColumn: '1/-1' }}>
                    <F label="Mention / Note" v={h.grade}      s={v => upd('academicHistory')(i, 'grade', v)}      ph="Ex: Bien, Très bien, 15/20" />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('academicHistory')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('academicHistory', { degree: '', institution: '', field: '', year: '', grade: '' })}>+ Ajouter un diplôme</button>

            <T>Certifications & formations courtes</T>
            {profile.certifications.map((c, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label="Certification"       v={c.name}       s={v => upd('certifications')(i, 'name', v)}       ph="Ex: AWS, Google Analytics..." />
                  <F label="Organisme émetteur"  v={c.issuer}     s={v => upd('certifications')(i, 'issuer', v)}     ph="Ex: Coursera, Amazon..." />
                  <F label="Date d'obtention"    v={c.date}       s={v => upd('certifications')(i, 'date', v)}       ph="2024" />
                  <F label="ID / Lien vérif."    v={c.credential} s={v => upd('certifications')(i, 'credential', v)} ph="URL ou identifiant" />
                </div>
                <button style={S.rmBtn} onClick={() => del('certifications')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('certifications', { name: '', issuer: '', date: '', credential: '' })}>+ Ajouter une certification</button>

            <T>Publications & communications scientifiques</T>
            {profile.publications.map((p, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <F label="Titre complet" v={p.title}   s={v => upd('publications')(i, 'title', v)}   ph="Titre de l'article ou communication" />
                  </div>
                  <F label="Revue / Conférence" v={p.venue}   s={v => upd('publications')(i, 'venue', v)}   ph="Ex: IEEE, Conférence ICSI..." />
                  <F label="Année"              v={p.year}    s={v => upd('publications')(i, 'year', v)}    ph="2024" />
                  <div style={{ gridColumn: '1/-1' }}>
                    <F label="Co-auteurs"       v={p.authors} s={v => upd('publications')(i, 'authors', v)} ph="Noms des co-auteurs" />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('publications')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('publications', { title: '', venue: '', year: '', authors: '' })}>+ Ajouter une publication</button>
          </div>
        )}

        {/* ── EXPÉRIENCE ────────────────────────────────────────── */}
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
                  <F label="Ville"       v={w.city}        s={v => upd('workExperience')(i, 'city', v)}        ph="Ex: Tunis, Sfax..." />
                  <F label="Date début"  v={w.startDate}   s={v => upd('workExperience')(i, 'startDate', v)}   type="date" />
                  <F label="Date fin"    v={w.endDate}     s={v => upd('workExperience')(i, 'endDate', v)}     type="date" />
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={S.lbl}>Description des missions & réalisations</div>
                    <textarea style={{ ...S.inp, minHeight: 90, resize: 'vertical' }}
                      value={w.description || ''}
                      onChange={e => upd('workExperience')(i, 'description', e.target.value)}
                      placeholder="Décrivez vos missions, résultats obtenus, chiffres clés..." />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <F label="Technologies utilisées" v={w.technologies} s={v => upd('workExperience')(i, 'technologies', v)} ph="Ex: React, Laravel, MySQL, Docker..." />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('workExperience')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('workExperience', { position: '', company: '', city: '', startDate: '', endDate: '', description: '', type: 'internship', technologies: '' })}>+ Ajouter une expérience</button>

            <T>Bénévolat & associations</T>
            {profile.volunteerWork.map((v, i) => (
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <F label="Rôle"         v={v.role}         s={val => upd('volunteerWork')(i, 'role', val)}         ph="Ex: Team Manager, Membre actif..." />
                  <F label="Organisation" v={v.organization} s={val => upd('volunteerWork')(i, 'organization', val)} ph="Ex: JCI, Club Microsoft ISIMA..." />
                  <F label="Début"        v={v.startDate}    s={val => upd('volunteerWork')(i, 'startDate', val)}    ph="2022" />
                  <F label="Fin"          v={v.endDate}      s={val => upd('volunteerWork')(i, 'endDate', val)}      ph="2024 ou En cours" />
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={S.lbl}>Description</div>
                    <textarea style={{ ...S.inp, minHeight: 70, resize: 'vertical' }}
                      value={v.description || ''}
                      onChange={e => upd('volunteerWork')(i, 'description', e.target.value)}
                      placeholder="Responsabilités, compétences développées, impact..." />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={() => del('volunteerWork')(i)}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('volunteerWork', { role: '', organization: '', startDate: '', endDate: '', description: '' })}>+ Ajouter une activité</button>
          </div>
        )}

        {/* ── PROJETS ───────────────────────────────────────────── */}
        {tab === 'projects' && (
          <div style={S.sec}>
            <T>Projets académiques</T>
            <div style={{ fontSize: 12, color: '#64748b', padding: '10px 14px', borderRadius: 10, background: '#13131f', border: '1px solid #2a2a3d', lineHeight: 1.6 }}>
              💡 Les projets académiques sont essentiels pour un CV de bourse — ils montrent vos compétences pratiques, votre capacité à mener un projet et les technologies maîtrisées.
            </div>

            {profile.academicProjects.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: '#475569' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🚀</div>
                <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Aucun projet ajouté</div>
                <div style={{ fontSize: 13 }}>Ajoutez vos projets : PFE, projets de cours, projets personnels, startups...</div>
              </div>
            )}

            {profile.academicProjects.map((p, i) => (
              <div key={i} style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: '#818cf8', fontSize: 13 }}>
                    Projet #{i + 1} {p.title ? `— ${p.title}` : ''}
                  </div>
                  <button style={S.rmBtn} onClick={() => del('academicProjects')(i)}>✕ Supprimer</button>
                </div>
                <div style={S.g2}>
                  <div style={{ gridColumn: '1/-1' }}>
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
                  <F label="Encadrant / Professeur"      v={p.supervisor}   s={v => upd('academicProjects')(i, 'supervisor', v)}   ph="Ex: Prof. Ben Ali" />
                  <F label="Année"                       v={p.year}         s={v => upd('academicProjects')(i, 'year', v)}         ph="2024" />
                  <F label="Date début"                  v={p.startDate}    s={v => upd('academicProjects')(i, 'startDate', v)}    ph="Ex: 2023-09" />
                  <F label="Date fin"                    v={p.endDate}      s={v => upd('academicProjects')(i, 'endDate', v)}      ph="Ex: 2024-06 ou En cours" />
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={S.lbl}>Description du projet</div>
                    <textarea style={{ ...S.inp, minHeight: 100, resize: 'vertical' }}
                      value={p.description || ''}
                      onChange={e => upd('academicProjects')(i, 'description', e.target.value)}
                      placeholder="Objectif, fonctionnalités développées, problème résolu, résultats obtenus..." />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <F label="Langages & outils utilisés" v={p.technologies} s={v => upd('academicProjects')(i, 'technologies', v)} ph="Ex: HTML, CSS, JavaScript, PHP, MySQL, Laravel, Spring Boot..." />
                  </div>
                  <F label="Lien GitHub / Démo" v={p.link}   s={v => upd('academicProjects')(i, 'link', v)}   ph="https://github.com/..." />
                  <F label="Impact / Résultats"  v={p.impact} s={v => upd('academicProjects')(i, 'impact', v)} ph="Ex: Déployé en production, prix reçu, 100 utilisateurs..." />
                </div>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('academicProjects', { title: '', type: '', supervisor: '', year: '', startDate: '', endDate: '', description: '', technologies: '', link: '', teamSize: '', impact: '' })}>
              + Ajouter un projet académique
            </button>
          </div>
        )}

        {/* ── COMPÉTENCES ───────────────────────────────────────── */}
        {tab === 'skills' && (
          <div style={S.sec}>
            <T>Langues</T>
            {profile.languages.map((l, i) => (
              <div key={i} style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <F label="Langue"     v={l.language}    s={v => upd('languages')(i, 'language', v)}    ph="Ex: Anglais, Français..." />
                <div>
                  <div style={S.lbl}>Niveau CECRL</div>
                  <select style={S.inp} value={l.level} onChange={e => upd('languages')(i, 'level', e.target.value)}>
                    <option value="">Niveau...</option>
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Natif'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <F label="Certificat" v={l.certificate} s={v => upd('languages')(i, 'certificate', v)} ph="Ex: IELTS 7.5, TOEIC 900" />
                <button style={{ ...S.rmBtn, marginTop: 0 }} onClick={() => del('languages')(i)}>✕</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('languages', { language: '', level: '', certificate: '' })}>+ Ajouter une langue</button>

            <T>Compétences techniques</T>
            <div style={{ fontSize: 12, color: '#64748b', padding: '8px 12px', borderRadius: 8, background: '#13131f', border: '1px solid #2a2a3d', marginBottom: 4 }}>
              💡 Regroupez par catégorie : Langages de programmation, Frameworks, Bases de données, Outils DevOps...
            </div>
            {profile.skills.map((sk, i) => (
              <div key={i} style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                <F label="Compétence / Outil" v={sk.skill}    s={v => upd('skills')(i, 'skill', v)}    ph="Ex: Python, React, MySQL..." />
                <div>
                  <div style={S.lbl}>Catégorie</div>
                  <select style={S.inp} value={sk.category || ''} onChange={e => upd('skills')(i, 'category', e.target.value)}>
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
                  <select style={S.inp} value={sk.level} onChange={e => upd('skills')(i, 'level', e.target.value)}>
                    <option value="">Niveau...</option>
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <button style={{ ...S.rmBtn, marginTop: 0 }} onClick={() => del('skills')(i)}>✕</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={add('skills', { skill: '', level: '', category: '' })}>+ Ajouter une compétence</button>
          </div>
        )}

        {/* ── OBJECTIFS ─────────────────────────────────────────── */}
        {tab === 'goals' && (
          <div style={S.sec}>
            <T>Projet d'études à l'étranger</T>
            <div style={S.g2}>
              <div>
                <div style={S.lbl}>Niveau visé</div>
                <select style={S.inp} value={profile.targetDegree} onChange={e => setProfile(p => ({ ...p, targetDegree: e.target.value }))}>
                  <option value="">Sélectionner...</option>
                  {['Licence', 'Master', 'Doctorat', 'Ingénieur', 'Formation courte', 'Résidence de recherche'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div />
            </div>

            <div>
              <div style={S.lbl}>Pays cibles</div>
              {profile.targetCountries.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input style={{ ...S.inp, flex: 1 }} value={c.country}
                    onChange={e => upd('targetCountries')(i, 'country', e.target.value)}
                    placeholder="Ex: France, Canada, Belgique, Allemagne..." />
                  <button style={S.rmBtn} onClick={() => del('targetCountries')(i)}>✕</button>
                </div>
              ))}
              <button style={S.addBtn} onClick={add('targetCountries', { country: '' })}>+ Ajouter un pays</button>
            </div>

            <div>
              <div style={S.lbl}>Domaines visés</div>
              {profile.targetFields.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input style={{ ...S.inp, flex: 1 }} value={f.field}
                    onChange={e => upd('targetFields')(i, 'field', e.target.value)}
                    placeholder="Ex: Intelligence Artificielle, Data Science, Génie logiciel..." />
                  <button style={S.rmBtn} onClick={() => del('targetFields')(i)}>✕</button>
                </div>
              ))}
              <button style={S.addBtn} onClick={add('targetFields', { field: '' })}>+ Ajouter un domaine</button>
            </div>

            <div>
              <div style={S.lbl}>Résumé de motivation</div>
              <textarea style={{ ...S.inp, minHeight: 150, resize: 'vertical' }}
                value={profile.motivationSummary}
                onChange={e => setProfile(p => ({ ...p, motivationSummary: e.target.value }))}
                placeholder="Décrivez vos motivations, votre projet professionnel, pourquoi vous voulez étudier à l'étranger, vos ambitions..." />
              <div style={{ color: '#475569', fontSize: 12, textAlign: 'right', marginTop: 4 }}>
                {profile.motivationSummary.length} caractères
                {profile.motivationSummary.length > 0 && profile.motivationSummary.length < 200 && (
                  <span style={{ color: '#fbbf24', marginLeft: 8 }}>Recommandé : minimum 200 caractères</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={S.footer}>
          <button style={S.chatBtn} onClick={() => handleQuickReply('Je veux mettre à jour mon profil')}>🤖 Mettre à jour via l'IA</button>
          <button style={{ ...S.saveBtn, background: saved ? '#10b981' : 'linear-gradient(135deg,#4f46e5,#7c3aed)' }} onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Sauvegarde...' : saved ? '✅ Sauvegardé !' : '💾 Sauvegarder le profil'}
          </button>
          <button style={S.logoutBtn} onClick={handleLogout}>↩ Déconnexion</button>
        </div>
      </div>
    </div>
  );
}

function T({ children }) {
  return <div style={{ color: '#c8c8e8', fontSize: '0.9rem', fontWeight: 700, paddingBottom: 8, borderBottom: '1px solid #2a2a3d', letterSpacing: '0.02em', marginTop: 8 }}>{children}</div>;
}

function F({ label, v, s, ph, type = 'text', readOnly = false }) {
  return (
    <div>
      <div style={S.lbl}>{label}</div>
      <input style={{ ...S.inp, ...(readOnly ? { opacity: 0.5 } : {}) }}
        type={type} value={v || ''}
        onChange={e => s?.(e.target.value)}
        placeholder={ph} readOnly={readOnly} />
    </div>
  );
}

const S = {
  page:        { width: '100%', fontFamily: 'system-ui,sans-serif', color: '#e8e8f0', background: '#0a0a0f', minHeight: '100vh' },
  locked:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, textAlign: 'center' },
  lockBtn:     { padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  header:      { background: '#0d0d18', borderBottom: '1px solid #1e1e30', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  hLeft:       { display: 'flex', alignItems: 'center', gap: 14 },
  avatar:      { width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white', flexShrink: 0 },
  hName:       { fontSize: '1.05rem', fontWeight: 700, color: '#e8e8f0' },
  hEmail:      { fontSize: 12, color: '#64748b' },
  scoreLabel:  { fontSize: 10, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 },
  scoreBarBg:  { width: 120, height: 6, background: '#1e1e30', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill:{ height: '100%', borderRadius: 3, transition: 'width 0.5s' },
  body:        { maxWidth: 880, margin: '0 auto', padding: '24px 20px' },
  tabBar:      { display: 'flex', gap: 3, marginBottom: 22, background: '#0d0d18', padding: 4, borderRadius: 12, border: '1px solid #1e1e30', flexWrap: 'wrap' },
  tabBtn:      { flex: 1, minWidth: 80, padding: '8px 6px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(144,144,176,0.55)', fontWeight: 500, fontSize: '0.78rem', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  tabOn:       { background: 'linear-gradient(135deg,#7c6af7,#5b4de8)', color: '#fff', fontWeight: 700 },
  sec:         { display: 'flex', flexDirection: 'column', gap: 14 },
  g2:          { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  lbl:         { color: '#9090b0', fontSize: '0.75rem', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' },
  inp:         { width: '100%', padding: '9px 13px', borderRadius: 9, border: '1.5px solid #2a2a3d', background: '#13131f', color: '#e8e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui', transition: 'border .15s' },
  card:        { background: '#13131f', border: '1px solid #2a2a3d', borderRadius: 12, padding: 16, marginBottom: 6 },
  addBtn:      { background: 'transparent', border: '1.5px dashed #4a4a6a', color: '#7c6af7', padding: '8px 16px', borderRadius: 9, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all .15s' },
  rmBtn:       { background: 'rgba(255,80,80,0.1)', border: 'none', color: '#ff6060', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', marginTop: 8 },
  footer:      { display: 'flex', gap: 10, marginTop: 24, paddingTop: 18, borderTop: '1px solid #1e1e30', flexWrap: 'wrap' },
  saveBtn:     { flex: 2, padding: 11, borderRadius: 11, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' },
  chatBtn:     { flex: 1, padding: 11, borderRadius: 11, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  logoutBtn:   { padding: '11px 16px', borderRadius: 11, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
};
import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

const emptyProfile = {
  name: '', email: '', phone: '', dateOfBirth: '',
  nationality: '', countryOfResidence: '',
  currentLevel: '', fieldOfStudy: '', institution: '',
  gpa: '', graduationYear: '',
  academicHistory: [], workExperience: [],
  languages: [], skills: [],
  targetDegree: '', targetCountries: [], targetFields: [],
  motivationSummary: '',
};

export default function ProfilPage({ user, setUser, handleLogout, handleQuickReply }) {
  const [tab, setTab]         = useState('personal');
  const [profile, setProfile] = useState(emptyProfile);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);

  useEffect(() => {
    const savedProfile = (() => {
      try { return JSON.parse(localStorage.getItem('opps_profile') || '{}'); } catch { return {}; }
    })();

    if (user) {
      setProfile({
        ...emptyProfile,
        ...savedProfile,
        name:               user.name               || savedProfile.name || '',
        email:              user.email              || '',
        phone:              user.phone              || savedProfile.phone || '',
        nationality:        user.nationality        || savedProfile.nationality || '',
        countryOfResidence: user.countryOfResidence || savedProfile.countryOfResidence || '',
        currentLevel:       user.currentLevel       || user.niveau  || '',
        fieldOfStudy:       user.fieldOfStudy       || user.domaine || '',
        institution:        user.institution        || '',
        gpa:                user.gpa?.toString()    || '',
        graduationYear:     user.graduationYear?.toString() || '',
        academicHistory:    user.academicHistory    || [],
        workExperience:     user.workExperience     || [],
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
    if (!user?.id) {
      console.error('[ProfilPage] Pas de user.id');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name:               profile.name,
        pays:               profile.targetCountries[0]?.country || '',
        niveau:             profile.currentLevel,
        domaine:            profile.fieldOfStudy,
        phone:              profile.phone,
        nationality:        profile.nationality,
        countryOfResidence: profile.countryOfResidence,
        currentLevel:       profile.currentLevel,
        fieldOfStudy:       profile.fieldOfStudy,
        institution:        profile.institution,
        gpa:                profile.gpa,
        graduationYear:     profile.graduationYear,
        academicHistory:    profile.academicHistory,
        workExperience:     profile.workExperience,
        languages:          profile.languages,
        skills:             profile.skills,
        targetDegree:       profile.targetDegree,
        targetCountries:    profile.targetCountries,
        targetFields:       profile.targetFields,
        motivationSummary:  profile.motivationSummary,
      };

      console.log('[ProfilPage] Sauvegarde →', user.id, body);

      const res = await fetch(`${API_BASE}/users/${user.id}/update-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('[ProfilPage] Status:', res.status);
      const result = await res.json();
      console.log('[ProfilPage] Réponse:', result);

      if (!res.ok) throw new Error(result.error || `Erreur ${res.status}`);

      const updated = { ...user, ...(result.user || body) };
      localStorage.setItem('opps_user', JSON.stringify(updated));

      const localProfile = {
        dateOfBirth: profile.dateOfBirth,
        phone:       profile.phone,
        nationality: profile.nationality,
      };
      localStorage.setItem('opps_profile', JSON.stringify(localProfile));

      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[ProfilPage] Erreur:', err);
    } finally {
      setSaving(false);
    }
  };

  const score = [
    !!profile.name, !!profile.nationality, !!profile.currentLevel,
    !!profile.fieldOfStudy, !!profile.institution, !!profile.gpa,
    profile.languages.length > 0, !!profile.targetDegree,
    profile.targetCountries.length > 0, !!profile.motivationSummary,
  ].filter(Boolean).length * 10;

  if (!user) return (
    <div style={S.locked}>
      <span style={{ fontSize: 48 }}>👤</span>
      <h3 style={{ color: '#e2e8f0' }}>Profil non disponible</h3>
      <p style={{ color: '#64748b' }}>Connectez-vous pour accéder à votre profil</p>
      <button style={S.lockBtn} onClick={() => handleQuickReply('Je veux me connecter')}>🔐 Se connecter</button>
    </div>
  );

  const tabs = [
    { id: 'personal',   label: 'Personnel',   icon: '👤' },
    { id: 'academic',   label: 'Académique',  icon: '🎓' },
    { id: 'experience', label: 'Expérience',  icon: '💼' },
    { id: 'skills',     label: 'Compétences', icon: '🛠️' },
    { id: 'goals',      label: 'Objectifs',   icon: '🎯' },
  ];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.hLeft}>
          <div style={S.avatar}>{(user.name || user.email || 'U')[0].toUpperCase()}</div>
          <div>
            <div style={S.hName}>{user.name || 'Mon Profil'}</div>
            <div style={S.hEmail}>{user.email}</div>
          </div>
        </div>
        <div>
          <div style={S.scoreLabel}>Complétude du profil</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={S.scoreBarBg}>
              <div style={{ ...S.scoreBarFill, width:`${score}%`, background: score>=80?'#4ade80':score>=50?'#fbbf24':'#6366f1' }} />
            </div>
            <span style={{ color: score>=80?'#4ade80':score>=50?'#fbbf24':'#818cf8', fontWeight:700 }}>{score}%</span>
          </div>
        </div>
      </div>

      <div style={S.body}>
        <div style={S.tabBar}>
          {tabs.map(t => (
            <button key={t.id} style={{ ...S.tabBtn, ...(tab===t.id ? S.tabOn : {}) }} onClick={() => setTab(t.id)}>
              <span style={{ marginRight:5 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* PERSONAL */}
        {tab === 'personal' && (
          <div style={S.sec}>
            <div style={S.secTitle}>Informations Personnelles</div>
            <div style={S.g2}>
              <F label="Nom complet"        value={profile.name}               set={v=>setProfile(p=>({...p,name:v}))}               placeholder="Prénom Nom" />
              <F label="Email"              value={profile.email}              readOnly />
              <F label="Téléphone"          value={profile.phone}              set={v=>setProfile(p=>({...p,phone:v}))}              placeholder="+216 XX XXX XXX" />
              <F label="Date de naissance"  value={profile.dateOfBirth}        set={v=>setProfile(p=>({...p,dateOfBirth:v}))}        type="date" />
              <F label="Nationalité"        value={profile.nationality}        set={v=>setProfile(p=>({...p,nationality:v}))}        placeholder="Ex: Tunisienne" />
              <F label="Pays de résidence"  value={profile.countryOfResidence} set={v=>setProfile(p=>({...p,countryOfResidence:v}))} placeholder="Ex: Tunisie" />
            </div>
          </div>
        )}

        {/* ACADEMIC */}
        {tab === 'academic' && (
          <div style={S.sec}>
            <div style={S.secTitle}>Parcours Académique Actuel</div>
            <div style={S.g2}>
              <div>
                <div style={S.lbl}>Niveau actuel</div>
                <select style={S.inp} value={profile.currentLevel} onChange={e=>setProfile(p=>({...p,currentLevel:e.target.value}))}>
                  <option value="">Sélectionner...</option>
                  {['Licence','Master 1','Master 2','Doctorat','Ingénieur'].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
              <F label="Domaine d'études"  value={profile.fieldOfStudy}   set={v=>setProfile(p=>({...p,fieldOfStudy:v}))}   placeholder="Ex: Informatique" />
              <div style={{ gridColumn:'1/-1' }}>
                <F label="Établissement"   value={profile.institution}    set={v=>setProfile(p=>({...p,institution:v}))}    placeholder="Ex: Faculté des Sciences" />
              </div>
              <F label="Moyenne (sur 20)"  value={profile.gpa}            set={v=>setProfile(p=>({...p,gpa:v}))}            type="number" placeholder="Ex: 14.5" />
              <F label="Année de diplôme"  value={profile.graduationYear} set={v=>setProfile(p=>({...p,graduationYear:v}))} type="number" placeholder="Ex: 2026" />
            </div>
            <div style={S.secTitle}>Historique Académique</div>
            {profile.academicHistory.map((h,i)=>(
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  {['degree','institution','field','year','grade'].map(k=>(
                    <F key={k} label={{degree:'Diplôme',institution:'Établissement',field:'Domaine',year:'Année',grade:'Mention'}[k]}
                       value={h[k]} set={v=>{const a=[...profile.academicHistory];a[i][k]=v;setProfile(p=>({...p,academicHistory:a}));}} />
                  ))}
                </div>
                <button style={S.rmBtn} onClick={()=>setProfile(p=>({...p,academicHistory:p.academicHistory.filter((_,j)=>j!==i)}))}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={()=>setProfile(p=>({...p,academicHistory:[...p.academicHistory,{degree:'',institution:'',field:'',year:'',grade:''}]}))}>+ Ajouter un diplôme</button>
          </div>
        )}

        {/* EXPERIENCE */}
        {tab === 'experience' && (
          <div style={S.sec}>
            <div style={S.secTitle}>Expériences & Stages</div>
            {profile.workExperience.map((w,i)=>(
              <div key={i} style={S.card}>
                <div style={S.g2}>
                  <div>
                    <div style={S.lbl}>Type</div>
                    <select style={S.inp} value={w.type||''} onChange={e=>{const a=[...profile.workExperience];a[i].type=e.target.value;setProfile(p=>({...p,workExperience:a}));}}>
                      <option value="">Sélectionner...</option>
                      <option value="job">Emploi</option>
                      <option value="internship">Stage</option>
                      <option value="volunteer">Bénévolat</option>
                    </select>
                  </div>
                  <F label="Poste"      value={w.position}    set={v=>{const a=[...profile.workExperience];a[i].position=v;setProfile(p=>({...p,workExperience:a}));}}    placeholder="Ex: Développeur Web" />
                  <F label="Entreprise" value={w.company}     set={v=>{const a=[...profile.workExperience];a[i].company=v;setProfile(p=>({...p,workExperience:a}));}} />
                  <F label="Date début" value={w.startDate}   set={v=>{const a=[...profile.workExperience];a[i].startDate=v;setProfile(p=>({...p,workExperience:a}));}}   type="date" />
                  <F label="Date fin"   value={w.endDate}     set={v=>{const a=[...profile.workExperience];a[i].endDate=v;setProfile(p=>({...p,workExperience:a}));}}     type="date" />
                  <div style={{ gridColumn:'1/-1' }}>
                    <div style={S.lbl}>Description</div>
                    <textarea style={{ ...S.inp, minHeight:80, resize:'vertical' }} value={w.description}
                      onChange={e=>{const a=[...profile.workExperience];a[i].description=e.target.value;setProfile(p=>({...p,workExperience:a}));}}
                      placeholder="Décrivez vos missions..." />
                  </div>
                </div>
                <button style={S.rmBtn} onClick={()=>setProfile(p=>({...p,workExperience:p.workExperience.filter((_,j)=>j!==i)}))}>✕ Supprimer</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={()=>setProfile(p=>({...p,workExperience:[...p.workExperience,{position:'',company:'',startDate:'',endDate:'',description:'',type:'internship'}]}))}>+ Ajouter une expérience</button>
          </div>
        )}

        {/* SKILLS */}
        {tab === 'skills' && (
          <div style={S.sec}>
            <div style={S.secTitle}>Langues</div>
            {profile.languages.map((l,i)=>(
              <div key={i} style={{ ...S.card, display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, alignItems:'end' }}>
                <F label="Langue"     value={l.language}    set={v=>{const a=[...profile.languages];a[i].language=v;setProfile(p=>({...p,languages:a}));}}    placeholder="Ex: Anglais" />
                <div>
                  <div style={S.lbl}>Niveau</div>
                  <select style={S.inp} value={l.level} onChange={e=>{const a=[...profile.languages];a[i].level=e.target.value;setProfile(p=>({...p,languages:a}));}}>
                    <option value="">Niveau...</option>
                    {['A1','A2','B1','B2','C1','C2'].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
                <F label="Certificat" value={l.certificate} set={v=>{const a=[...profile.languages];a[i].certificate=v;setProfile(p=>({...p,languages:a}));}} placeholder="Ex: IELTS 7.5" />
                <button style={{ ...S.rmBtn, marginTop:0 }} onClick={()=>setProfile(p=>({...p,languages:p.languages.filter((_,j)=>j!==i)}))}>✕</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={()=>setProfile(p=>({...p,languages:[...p.languages,{language:'',level:'',certificate:''}]}))}>+ Ajouter une langue</button>

            <div style={{ ...S.secTitle, marginTop:24 }}>Compétences Techniques</div>
            {profile.skills.map((sk,i)=>(
              <div key={i} style={{ ...S.card, display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, alignItems:'end' }}>
                <F label="Compétence" value={sk.skill} set={v=>{const a=[...profile.skills];a[i].skill=v;setProfile(p=>({...p,skills:a}));}} placeholder="Ex: Python, React..." />
                <div>
                  <div style={S.lbl}>Niveau</div>
                  <select style={S.inp} value={sk.level} onChange={e=>{const a=[...profile.skills];a[i].level=e.target.value;setProfile(p=>({...p,skills:a}));}}>
                    <option value="">Niveau...</option>
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="advanced">Avancé</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <button style={{ ...S.rmBtn, marginTop:0 }} onClick={()=>setProfile(p=>({...p,skills:p.skills.filter((_,j)=>j!==i)}))}>✕</button>
              </div>
            ))}
            <button style={S.addBtn} onClick={()=>setProfile(p=>({...p,skills:[...p.skills,{skill:'',level:''}]}))}>+ Ajouter une compétence</button>
          </div>
        )}

        {/* GOALS */}
        {tab === 'goals' && (
          <div style={S.sec}>
            <div style={S.secTitle}>Projet d'Études à l'Étranger</div>
            <div style={{ marginBottom:16 }}>
              <div style={S.lbl}>Niveau visé</div>
              <select style={S.inp} value={profile.targetDegree} onChange={e=>setProfile(p=>({...p,targetDegree:e.target.value}))}>
                <option value="">Sélectionner...</option>
                <option value="Licence">Licence</option>
                <option value="Master">Master</option>
                <option value="Doctorat">Doctorat</option>
                <option value="short">Formation courte</option>
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={S.lbl}>Pays cibles</div>
              {profile.targetCountries.map((c,i)=>(
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <input style={{ ...S.inp, flex:1 }} value={c.country}
                    onChange={e=>{const a=[...profile.targetCountries];a[i].country=e.target.value;setProfile(p=>({...p,targetCountries:a}));}}
                    placeholder="Ex: France, Canada..." />
                  <button style={S.rmBtn} onClick={()=>setProfile(p=>({...p,targetCountries:p.targetCountries.filter((_,j)=>j!==i)}))}>✕</button>
                </div>
              ))}
              <button style={S.addBtn} onClick={()=>setProfile(p=>({...p,targetCountries:[...p.targetCountries,{country:''}]}))}>+ Ajouter un pays</button>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={S.lbl}>Domaines visés</div>
              {profile.targetFields.map((f,i)=>(
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <input style={{ ...S.inp, flex:1 }} value={f.field}
                    onChange={e=>{const a=[...profile.targetFields];a[i].field=e.target.value;setProfile(p=>({...p,targetFields:a}));}}
                    placeholder="Ex: IA, Data Science..." />
                  <button style={S.rmBtn} onClick={()=>setProfile(p=>({...p,targetFields:p.targetFields.filter((_,j)=>j!==i)}))}>✕</button>
                </div>
              ))}
              <button style={S.addBtn} onClick={()=>setProfile(p=>({...p,targetFields:[...p.targetFields,{field:''}]}))}>+ Ajouter un domaine</button>
            </div>
            <div>
              <div style={S.lbl}>Résumé de motivation</div>
              <textarea style={{ ...S.inp, minHeight:140, resize:'vertical' }} value={profile.motivationSummary}
                onChange={e=>setProfile(p=>({...p,motivationSummary:e.target.value}))}
                placeholder="Décrivez vos motivations pour étudier à l'étranger..." />
              <div style={{ color:'#475569', fontSize:12, textAlign:'right', marginTop:4 }}>{profile.motivationSummary.length} caractères</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={S.footer}>
          <button style={S.chatBtn} onClick={()=>handleQuickReply('Je veux mettre à jour mon profil')}>🤖 Mettre à jour via l'IA</button>
          <button style={{ ...S.saveBtn, background: saved?'#10b981':'linear-gradient(135deg,#4f46e5,#7c3aed)' }} onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Sauvegarde...' : saved ? '✅ Sauvegardé !' : '💾 Sauvegarder'}
          </button>
          <button style={S.logoutBtn} onClick={handleLogout}>↩ Déconnexion</button>
        </div>
      </div>
    </div>
  );
}

function F({ label, value, set, placeholder, type='text', readOnly=false }) {
  return (
    <div>
      <div style={S.lbl}>{label}</div>
      <input style={{ ...S.inp, ...(readOnly?{opacity:0.5}:{}) }} type={type} value={value||''}
        onChange={e=>set?.(e.target.value)} placeholder={placeholder} readOnly={readOnly} />
    </div>
  );
}

const S = {
  page:        { width:'100%', fontFamily:'system-ui,sans-serif', color:'#e8e8f0', background:'#0a0a0f', minHeight:'100vh' },
  locked:      { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16, textAlign:'center' },
  lockBtn:     { padding:'12px 24px', borderRadius:12, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', color:'white', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' },
  header:      { background:'#0d0d18', borderBottom:'1px solid #1e1e30', padding:'18px 32px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  hLeft:       { display:'flex', alignItems:'center', gap:14 },
  avatar:      { width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'white', flexShrink:0 },
  hName:       { fontSize:'1.05rem', fontWeight:700, color:'#e8e8f0' },
  hEmail:      { fontSize:12, color:'#64748b' },
  scoreLabel:  { fontSize:10, color:'#64748b', marginBottom:5, textTransform:'uppercase', letterSpacing:1 },
  scoreBarBg:  { width:110, height:5, background:'#1e1e30', borderRadius:3, overflow:'hidden' },
  scoreBarFill:{ height:'100%', borderRadius:3, transition:'width 0.5s' },
  body:        { maxWidth:860, margin:'0 auto', padding:'24px 20px' },
  tabBar:      { display:'flex', gap:3, marginBottom:22, background:'#0d0d18', padding:4, borderRadius:11, border:'1px solid #1e1e30' },
  tabBtn:      { flex:1, padding:'8px 4px', borderRadius:8, border:'none', cursor:'pointer', background:'transparent', color:'rgba(144,144,176,0.55)', fontWeight:500, fontSize:'0.8rem', transition:'all 0.2s' },
  tabOn:       { background:'linear-gradient(135deg,#7c6af7,#5b4de8)', color:'#fff', fontWeight:700 },
  sec:         { display:'flex', flexDirection:'column', gap:14 },
  secTitle:    { color:'#c8c8e8', fontSize:'0.9rem', fontWeight:700, paddingBottom:8, borderBottom:'1px solid #2a2a3d', letterSpacing:'0.02em' },
  g2:          { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  lbl:         { color:'#9090b0', fontSize:'0.75rem', fontWeight:600, marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' },
  inp:         { width:'100%', padding:'9px 13px', borderRadius:9, border:'1.5px solid #2a2a3d', background:'#13131f', color:'#e8e8f0', fontSize:'0.88rem', outline:'none', boxSizing:'border-box', fontFamily:'system-ui' },
  card:        { background:'#13131f', border:'1px solid #2a2a3d', borderRadius:11, padding:14, marginBottom:6 },
  addBtn:      { background:'transparent', border:'1.5px dashed #4a4a6a', color:'#7c6af7', padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:'0.8rem', fontWeight:600 },
  rmBtn:       { background:'rgba(255,80,80,0.1)', border:'none', color:'#ff6060', padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:'0.75rem', marginTop:6 },
  footer:      { display:'flex', gap:10, marginTop:24, paddingTop:18, borderTop:'1px solid #1e1e30', flexWrap:'wrap' },
  saveBtn:     { flex:2, padding:11, borderRadius:11, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.3s' },
  chatBtn:     { flex:1, padding:11, borderRadius:11, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:12, fontWeight:600, cursor:'pointer' },
  logoutBtn:   { padding:'11px 16px', borderRadius:11, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontSize:12, fontWeight:600, cursor:'pointer' },
};
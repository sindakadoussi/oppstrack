import type { CollectionConfig, PayloadRequest } from 'payload'
import crypto from 'crypto'
import { NextResponse } from 'next/server'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email' },
  auth: true,
  access: {
    read:   () => true,
    update: () => true,
    create: () => true,
    delete: () => true,
  },
  fields: [
    { name: 'name',    label: 'Nom complet',    type: 'text' },
    { name: 'pays',    label: 'Pays',           type: 'text' },
    { name: 'niveau',  label: 'Niveau',         type: 'text' },
    { name: 'domaine', label: 'Domaine',        type: 'text' },

    // ── Informations personnelles ──────────────────────────────────────
    { name: 'phone',               label: 'Téléphone',          type: 'text' },
    { name: 'nationality',         label: 'Nationalité',        type: 'text' },
    { name: 'countryOfResidence',  label: 'Pays de résidence',  type: 'text' },

    // ── Liens professionnels ───────────────────────────────────────────
    { name: 'linkedin',  label: 'LinkedIn',          type: 'text' },
    { name: 'github',    label: 'GitHub',             type: 'text' },
    { name: 'portfolio', label: 'Portfolio / Site web', type: 'text' },

    // ── Formation ─────────────────────────────────────────────────────
    { name: 'currentLevel',      label: 'Niveau actuel',       type: 'text' },
    { name: 'fieldOfStudy',      label: "Domaine d'études",    type: 'text' },
    { name: 'institution',       label: 'Établissement',       type: 'text' },
    { name: 'gpa',               label: 'Moyenne (sur 20)',    type: 'text' },
    { name: 'graduationYear',    label: 'Année de diplôme',    type: 'text' },
    { name: 'targetDegree',      label: 'Niveau visé',         type: 'text' },
    { name: 'motivationSummary', label: 'Résumé de motivation', type: 'textarea' },

    // ── Historique académique ──────────────────────────────────────────
    {
      name: 'academicHistory',
      label: 'Historique académique',
      type: 'array',
      fields: [
        { name: 'degree',      label: 'Diplôme',       type: 'text' },
        { name: 'institution', label: 'Établissement', type: 'text' },
        { name: 'field',       label: 'Domaine',       type: 'text' },
        { name: 'year',        label: 'Année',         type: 'text' },
        { name: 'grade',       label: 'Mention / Note', type: 'text' },
      ],
    },

    // ── Expériences professionnelles ───────────────────────────────────
    {
      name: 'workExperience',
      label: 'Expériences professionnelles',
      type: 'array',
      fields: [
        { name: 'type',         label: 'Type (Stage / Emploi / Freelance)', type: 'text' },
        { name: 'position',     label: 'Poste',                             type: 'text' },
        { name: 'company',      label: 'Entreprise',                        type: 'text' },
        { name: 'city',         label: 'Ville',                             type: 'text' },
        { name: 'startDate',    label: 'Date de début',                     type: 'text' },
        { name: 'endDate',      label: 'Date de fin',                       type: 'text' },
        { name: 'description',  label: 'Description des missions',          type: 'textarea' },
        { name: 'technologies', label: 'Technologies utilisées',            type: 'text' },
      ],
    },

    // ── Projets académiques ────────────────────────────────────────────
    {
      name: 'academicProjects',
      label: 'Projets académiques',
      type: 'array',
      fields: [
        { name: 'title',        label: 'Titre du projet',           type: 'text' },
        { name: 'type',         label: 'Type de projet',            type: 'text' },
        { name: 'supervisor',   label: 'Encadrant / Professeur',    type: 'text' },
        { name: 'year',         label: 'Année',                     type: 'text' },
        { name: 'startDate',    label: 'Date de début',             type: 'text' },
        { name: 'endDate',      label: 'Date de fin',               type: 'text' },
        { name: 'description',  label: 'Description du projet',     type: 'textarea' },
        { name: 'technologies', label: 'Langages & outils utilisés', type: 'text' },
        { name: 'link',         label: 'Lien GitHub / Démo',        type: 'text' },
        { name: 'teamSize',     label: "Taille de l'équipe",        type: 'text' },
        { name: 'impact',       label: 'Impact / Résultats',        type: 'text' },
      ],
    },

    // ── Certifications ─────────────────────────────────────────────────
    {
      name: 'certifications',
      label: 'Certifications & formations courtes',
      type: 'array',
      fields: [
        { name: 'name',       label: 'Certification',          type: 'text' },
        { name: 'issuer',     label: 'Organisme émetteur',     type: 'text' },
        { name: 'date',       label: "Date d'obtention",       type: 'text' },
        { name: 'credential', label: 'ID / Lien vérification', type: 'text' },
      ],
    },

    // ── Bénévolat & associations ───────────────────────────────────────
    {
      name: 'volunteerWork',
      label: 'Bénévolat & associations',
      type: 'array',
      fields: [
        { name: 'role',         label: 'Rôle',          type: 'text' },
        { name: 'organization', label: 'Organisation',  type: 'text' },
        { name: 'startDate',    label: 'Début',         type: 'text' },
        { name: 'endDate',      label: 'Fin',           type: 'text' },
        { name: 'description',  label: 'Description',   type: 'textarea' },
      ],
    },

    // ── Publications scientifiques ─────────────────────────────────────
    {
      name: 'publications',
      label: 'Publications scientifiques',
      type: 'array',
      fields: [
        { name: 'title',   label: 'Titre complet',        type: 'text' },
        { name: 'venue',   label: 'Revue / Conférence',   type: 'text' },
        { name: 'year',    label: 'Année',                type: 'text' },
        { name: 'authors', label: 'Co-auteurs',           type: 'text' },
      ],
    },

    // ── Distinctions & prix ────────────────────────────────────────────
    {
      name: 'awards',
      label: 'Distinctions & prix',
      type: 'array',
      fields: [
        { name: 'title',        label: 'Titre du prix / distinction', type: 'text' },
        { name: 'organization', label: 'Organisation',                type: 'text' },
        { name: 'year',         label: 'Année',                       type: 'text' },
        { name: 'description',  label: 'Description',                 type: 'text' },
      ],
    },

    // ── Langues ───────────────────────────────────────────────────────
    {
      name: 'languages',
      label: 'Langues',
      type: 'array',
      fields: [
        { name: 'language',    label: 'Langue',       type: 'text' },
        { name: 'level',       label: 'Niveau CECRL', type: 'text' },
        { name: 'certificate', label: 'Certificat',   type: 'text' },
      ],
    },

    // ── Compétences ────────────────────────────────────────────────────
    {
      name: 'skills',
      label: 'Compétences techniques',
      type: 'array',
      fields: [
        { name: 'skill',    label: 'Compétence / Outil', type: 'text' },
        { name: 'level',    label: 'Niveau',             type: 'text' },
        { name: 'category', label: 'Catégorie',          type: 'text' },
      ],
    },

    // ── Objectifs ─────────────────────────────────────────────────────
    {
      name: 'targetCountries',
      label: 'Pays cibles',
      type: 'array',
      fields: [{ name: 'country', label: 'Pays', type: 'text' }],
    },
    {
      name: 'targetFields',
      label: 'Domaines visés',
      type: 'array',
      fields: [{ name: 'field', label: 'Domaine', type: 'text' }],
    },

    // ── Progression bourses ───────────────────────────────────────────
    {
      name: 'progression',
      label: 'Progression bourses',
      type: 'array',
      fields: [
        { name: 'bourseNom', label: 'Nom de la bourse', type: 'text' },
        { name: 'etape',     label: 'Étape',            type: 'number' },
        { name: 'updatedAt', label: 'Mis à jour le',    type: 'date' },
      ],
    },

    // ── Auth ──────────────────────────────────────────────────────────
    { name: 'magicToken',           type: 'text', hidden: true },
    { name: 'magicTokenExpiration', type: 'date', hidden: true },

    // ── Bourses choisies ──────────────────────────────────────────────
    {
      name: 'bourses_choisies',
      label: 'Bourses choisies',
      type: 'array',
      fields: [
        { name: 'nom',      label: 'Nom de la bourse', type: 'text', required: true },
        { name: 'pays',     label: 'Pays',             type: 'text' },
        { name: 'url',      label: 'URL officielle',   type: 'text' },
        { name: 'deadline', label: 'Date limite',      type: 'text' },
        { name: 'langue',   label: 'Langue',           type: 'text' },
        { name: 'ajouteLe', label: 'Ajouté le',        type: 'date' },
      ],
    },

    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: {
        fr: 'Photo de profil',
        en: 'Profile picture'
      },
      admin: {
        position: 'sidebar',
      },
    }
  ],

  endpoints: [

    // ── POST /api/users/request-magic-link ────────────────────────────
    {
      path: '/request-magic-link',
      method: 'post',
      handler: async (req: PayloadRequest) => {
        console.log('[ENV CHECK]', process.env.GMAIL_USER, process.env.GMAIL_APP_PASSWORD?.slice(0,4))
        const body  = await req.json?.() || req.body || {}
        const email = (body.email || '').toLowerCase().trim()
        if (!email || !email.includes('@'))
          return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
        try {
          const found = await req.payload.find({ collection: 'users', where: { email: { equals: email } } })
          let userId: string
          if (found.docs.length === 0) {
            const created = await req.payload.create({
              collection: 'users',
              data: { email, password: crypto.randomBytes(32).toString('hex') },
            })
            userId = created.id
          } else {
            userId = found.docs[0].id
          }
          const token      = crypto.randomBytes(32).toString('hex')
          const expiration = new Date(Date.now() + 15 * 60 * 1000).toISOString()
          await req.payload.update({ collection: 'users', id: userId, data: { magicToken: token, magicTokenExpiration: expiration } })
          const baseUrl  = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'
          const magicUrl = `${baseUrl}/verify?email=${encodeURIComponent(email)}&token=${token}`
          try {
            await req.payload.sendEmail({
              to: email,
              subject: '🔐 Votre lien de connexion OppTrack',
              html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
                <h2 style="color:#6366f1;">OppTrack</h2>
                <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>
                <a href="${magicUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Se connecter</a>
                <p style="color:#64748b;font-size:13px;">Ce lien expire dans <strong>15 minutes</strong>.</p>
              </div>`,
            })
          } catch (emailErr: any) {
            console.error(`[EMAIL ERROR]`, emailErr.message)
          }
          console.log(`[MAGIC LINK] ${email} → ${magicUrl}`)
          return NextResponse.json({ message: `Lien envoyé à ${email}`, magicUrl: process.env.NODE_ENV !== 'production' ? magicUrl : undefined })
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 500 })
        }
      },
    },

    // ── POST /api/users/magic-login ───────────────────────────────────
    {
      path: '/magic-login',
      method: 'post',
      handler: async (req: PayloadRequest) => {
        const body  = await req.json?.() || req.body || {}
        let { email, token } = body
        if (!email || !token)
          return NextResponse.json({ message: 'Email et token requis' }, { status: 400 })
        email = email.toLowerCase().trim()
        try {
          const found = await req.payload.find({
            collection: 'users',
            where: { and: [
              { email:                { equals: email } },
              { magicToken:           { equals: token } },
              { magicTokenExpiration: { greater_than: new Date().toISOString() } },
            ]},
          })
          if (found.docs.length === 0)
            return NextResponse.json({ message: 'Lien invalide ou expiré' }, { status: 401 })
          const user = found.docs[0]
          await req.payload.update({ collection: 'users', id: user.id, data: { magicToken: null, magicTokenExpiration: null } })
          return NextResponse.json({
            message: 'Connexion réussie',
            user: serializeUser(user),
          })
        } catch (err: any) {
          return NextResponse.json({ message: err.message }, { status: 500 })
        }
      },
    },

    // ── PATCH /api/users/:id/update-profile ───────────────────────────
    {
      path: '/:id/update-profile',
      method: 'patch',
      handler: async (req: PayloadRequest) => {
        const id   = req.routeParams?.id as string
        const body = await req.json?.() || req.body || {}

        console.log('[UPDATE-PROFILE] id:', id, '| body keys:', Object.keys(body))
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

        const fields = [
          'name', 'pays', 'niveau', 'domaine',
          'phone', 'nationality', 'countryOfResidence',
          'linkedin', 'github', 'portfolio',
          'currentLevel', 'fieldOfStudy', 'institution',
          'gpa', 'graduationYear', 'targetDegree', 'motivationSummary',
          'academicHistory', 'workExperience', 'languages', 'skills',
          'targetCountries', 'targetFields',
          'academicProjects', 'certifications', 'volunteerWork',
          'publications', 'awards', 'avatar',
        ]

        const dataToUpdate: Record<string, any> = {}
        for (const field of fields) {
          if (body[field] !== undefined) dataToUpdate[field] = body[field]
        }

        if (body.currentLevel  && !body.niveau)  dataToUpdate.niveau  = body.currentLevel
        if (body.fieldOfStudy  && !body.domaine) dataToUpdate.domaine = body.fieldOfStudy
        if (body.targetCountries?.length > 0 && !body.pays) {
          dataToUpdate.pays = body.targetCountries[0]?.country || ''
        }

        console.log('[UPDATE-PROFILE] saving:', JSON.stringify(dataToUpdate).slice(0, 200))

        try {
          const updated = await req.payload.update({
            collection: 'users', id, data: dataToUpdate, overrideAccess: true,
          })
          console.log('[UPDATE-PROFILE] ✅', updated.id)
          return NextResponse.json({ message: 'Profil mis à jour', user: serializeUser(updated) })
        } catch (err: any) {
          console.error('[UPDATE-PROFILE] ❌', err.message)
          return NextResponse.json({ error: err.message }, { status: 500 })
        }
      },
    },

    // ── POST /api/users/:id/bourses-choisies ──────────────────────────
    {
      path: '/:id/bourses-choisies',
      method: 'post',
      handler: async (req: PayloadRequest) => {
        const id   = req.routeParams?.id as string
        const body = await req.json?.() || req.body || {}
        const { nom, pays, url, deadline, langue } = body
        if (!id || !nom) return NextResponse.json({ error: 'id et nom requis' }, { status: 400 })
        try {
          const existing  = await req.payload.findByID({ collection: 'users', id, depth: 0 })
          const actuelles: any[] = existing.bourses_choisies || []
          if (actuelles.some((b: any) => b.nom?.toLowerCase() === nom.toLowerCase()))
            return NextResponse.json({ message: 'Déjà dans votre liste', bourses_choisies: actuelles })
          const updated = await req.payload.update({
            collection: 'users', id,
            data: { bourses_choisies: [...actuelles, { nom, pays: pays||'', url: url||'', deadline: deadline||'', langue: langue||'', ajouteLe: new Date().toISOString() }] },
          })
          return NextResponse.json({ message: `"${nom}" ajoutée`, bourses_choisies: updated.bourses_choisies })
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 500 })
        }
      },
    },

    // ── PATCH /api/users/:id/progression ──────────────────────────────
    {
      path: '/:id/progression',
      method: 'patch',
      handler: async (req: PayloadRequest) => {
        const id   = req.routeParams?.id as string
        const body = await req.json?.() || req.body || {}
        const { bourseNom, etape } = body
        if (!id || !bourseNom || etape === undefined)
          return NextResponse.json({ error: 'id, bourseNom et etape requis' }, { status: 400 })
        try {
          const existing   = await req.payload.findByID({ collection: 'users', id, depth: 0 })
          const progression: any[] = existing.progression || []
          const idx = progression.findIndex((p: any) => p.bourseNom === bourseNom)
          if (idx >= 0) {
            progression[idx] = { bourseNom, etape, updatedAt: new Date().toISOString() }
          } else {
            progression.push({ bourseNom, etape, updatedAt: new Date().toISOString() })
          }
          const updated = await req.payload.update({ collection: 'users', id, data: { progression } })
          console.log(`[PROGRESSION] ${bourseNom} → étape ${etape}`)
          return NextResponse.json({ message: 'Progression mise à jour', progression: updated.progression })
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 500 })
        }
      },
    },

    // ── DELETE /api/users/:id ─────────────────────────────────────────
    {
      path: '/:id',
      method: 'delete',
      handler: async (req: PayloadRequest) => {
        const id = req.routeParams?.id as string
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
        try {
          await req.payload.delete({ collection: 'users', id })
          console.log('[DELETE-USER] ✅', id)
          return NextResponse.json({ message: 'Utilisateur supprimé', id })
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 500 })
        }
      },
    },

    // ── DELETE /api/users/:id/bourses-choisies/:nom ───────────────────
    {
      path: '/:id/bourses-choisies/:nom',
      method: 'delete',
      handler: async (req: PayloadRequest) => {
        const id  = req.routeParams?.id  as string
        const nom = req.routeParams?.nom as string
        try {
          const existing = await req.payload.findByID({ collection: 'users', id, depth: 0 })
          const filtrees = (existing.bourses_choisies || []).filter(
            (b: any) => b.nom?.toLowerCase() !== decodeURIComponent(nom).toLowerCase()
          )
          await req.payload.update({ collection: 'users', id, data: { bourses_choisies: filtrees } })
          return NextResponse.json({ message: 'Supprimée', bourses_choisies: filtrees })
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 500 })
        }
      },
    },
  ],
}

// ── Helper sérialisation user ──────────────────────────────────────────────────
function serializeUser(u: any) {
  // Extraire l'ID de l'avatar s'il s'agit d'un objet
  let avatarId = null;
  if (u.avatar) {
    if (typeof u.avatar === 'string') avatarId = u.avatar;
    else if (typeof u.avatar === 'object' && u.avatar.id) avatarId = u.avatar.id;
  }

  return {
    id:                u.id,
    email:             u.email,
    name:              u.name              || '',
    pays:              u.pays              || '',
    niveau:            u.niveau            || '',
    domaine:           u.domaine           || '',
    phone:             u.phone             || '',
    nationality:       u.nationality       || '',
    countryOfResidence:u.countryOfResidence|| '',
    linkedin:          u.linkedin          || '',
    github:            u.github            || '',
    portfolio:         u.portfolio         || '',
    currentLevel:      u.currentLevel      || u.niveau  || '',
    fieldOfStudy:      u.fieldOfStudy      || u.domaine || '',
    institution:       u.institution       || '',
    gpa:               u.gpa               || '',
    graduationYear:    u.graduationYear    || '',
    targetDegree:      u.targetDegree      || '',
    motivationSummary: u.motivationSummary || '',
    academicHistory:   u.academicHistory   || [],
    workExperience:    u.workExperience    || [],
    academicProjects:  u.academicProjects  || [],
    certifications:    u.certifications    || [],
    volunteerWork:     u.volunteerWork     || [],
    publications:      u.publications      || [],
    awards:            u.awards            || [],
    languages:         u.languages         || [],
    skills:            u.skills            || [],
    targetCountries:   u.targetCountries   || [],
    targetFields:      u.targetFields      || [],
    bourses_choisies:  u.bourses_choisies  || [],
    progression:       u.progression       || [],
    avatar:            avatarId, // ← ID en chaîne ou null
  };
}

export default Users
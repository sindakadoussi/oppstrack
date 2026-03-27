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
    { name: 'name',    type: 'text' },
    { name: 'pays',    type: 'text' },
    { name: 'niveau',  type: 'text' },
    { name: 'domaine', type: 'text' },

    // ── Informations personnelles ──────────────────────────────────────
    { name: 'phone',               type: 'text' },
    { name: 'nationality',         type: 'text' },
    { name: 'countryOfResidence',  type: 'text' },

    // ── Liens professionnels ───────────────────────────────────────────
    { name: 'linkedin',  type: 'text' },
    { name: 'github',    type: 'text' },
    { name: 'portfolio', type: 'text' },

    // ── Formation ─────────────────────────────────────────────────────
    { name: 'currentLevel',      type: 'text' },
    { name: 'fieldOfStudy',      type: 'text' },
    { name: 'institution',       type: 'text' },
    { name: 'gpa',               type: 'text' },
    { name: 'graduationYear',    type: 'text' },
    { name: 'targetDegree',      type: 'text' },
    { name: 'motivationSummary', type: 'textarea' },

    // ── Historique académique ──────────────────────────────────────────
    {
      name: 'academicHistory',
      type: 'array',
      fields: [
        { name: 'degree',      type: 'text' },
        { name: 'institution', type: 'text' },
        { name: 'field',       type: 'text' },
        { name: 'year',        type: 'text' },
        { name: 'grade',       type: 'text' },
      ],
    },

    // ── Expériences professionnelles (enrichi) ─────────────────────────
    {
      name: 'workExperience',
      type: 'array',
      fields: [
        { name: 'type',         type: 'text' },
        { name: 'position',     type: 'text' },
        { name: 'company',      type: 'text' },
        { name: 'city',         type: 'text' },
        { name: 'startDate',    type: 'text' },
        { name: 'endDate',      type: 'text' },
        { name: 'description',  type: 'textarea' },
        { name: 'technologies', type: 'text' },
      ],
    },

    // ── Projets académiques (NOUVEAU) ──────────────────────────────────
    {
      name: 'academicProjects',
      type: 'array',
      fields: [
        { name: 'title',        type: 'text' },
        { name: 'type',         type: 'text' },
        { name: 'supervisor',   type: 'text' },
        { name: 'year',         type: 'text' },
        { name: 'startDate',    type: 'text' },
        { name: 'endDate',      type: 'text' },
        { name: 'description',  type: 'textarea' },
        { name: 'technologies', type: 'text' },
        { name: 'link',         type: 'text' },
        { name: 'teamSize',     type: 'text' },
        { name: 'impact',       type: 'text' },
      ],
    },

    // ── Certifications (NOUVEAU) ───────────────────────────────────────
    {
      name: 'certifications',
      type: 'array',
      fields: [
        { name: 'name',       type: 'text' },
        { name: 'issuer',     type: 'text' },
        { name: 'date',       type: 'text' },
        { name: 'credential', type: 'text' },
      ],
    },

    // ── Bénévolat & associations (NOUVEAU) ────────────────────────────
    {
      name: 'volunteerWork',
      type: 'array',
      fields: [
        { name: 'role',         type: 'text' },
        { name: 'organization', type: 'text' },
        { name: 'startDate',    type: 'text' },
        { name: 'endDate',      type: 'text' },
        { name: 'description',  type: 'textarea' },
      ],
    },

    // ── Publications scientifiques (NOUVEAU) ──────────────────────────
    {
      name: 'publications',
      type: 'array',
      fields: [
        { name: 'title',   type: 'text' },
        { name: 'venue',   type: 'text' },
        { name: 'year',    type: 'text' },
        { name: 'authors', type: 'text' },
      ],
    },

    // ── Distinctions & prix (NOUVEAU) ─────────────────────────────────
    {
      name: 'awards',
      type: 'array',
      fields: [
        { name: 'title',        type: 'text' },
        { name: 'organization', type: 'text' },
        { name: 'year',         type: 'text' },
        { name: 'description',  type: 'text' },
      ],
    },

    // ── Langues ───────────────────────────────────────────────────────
    {
      name: 'languages',
      type: 'array',
      fields: [
        { name: 'language',    type: 'text' },
        { name: 'level',       type: 'text' },
        { name: 'certificate', type: 'text' },
      ],
    },

    // ── Compétences (enrichi) ─────────────────────────────────────────
    {
      name: 'skills',
      type: 'array',
      fields: [
        { name: 'skill',    type: 'text' },
        { name: 'level',    type: 'text' },
        { name: 'category', type: 'text' },
      ],
    },

    // ── Objectifs ─────────────────────────────────────────────────────
    {
      name: 'targetCountries',
      type: 'array',
      fields: [{ name: 'country', type: 'text' }],
    },
    {
      name: 'targetFields',
      type: 'array',
      fields: [{ name: 'field', type: 'text' }],
    },

    // ── Progression bourses ───────────────────────────────────────────
    {
      name: 'progression',
      type: 'array',
      fields: [
        { name: 'bourseNom', type: 'text' },
        { name: 'etape',     type: 'number' },
        { name: 'updatedAt', type: 'date' },
      ],
    },

    // ── Auth ──────────────────────────────────────────────────────────
    { name: 'magicToken',           type: 'text', hidden: true },
    { name: 'magicTokenExpiration', type: 'date', hidden: true },

    // ── Bourses choisies ──────────────────────────────────────────────
    {
      name: 'bourses_choisies',
      type: 'array',
      fields: [
        { name: 'nom',      type: 'text', required: true },
        { name: 'pays',     type: 'text' },
        { name: 'url',      type: 'text' },
        { name: 'deadline', type: 'text' },
        { name: 'langue',   type: 'text' },
        { name: 'ajouteLe', type: 'date' },
      ],
    },
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
          // Base
          'name', 'pays', 'niveau', 'domaine',
          // Perso
          'phone', 'nationality', 'countryOfResidence',
          // Liens
          'linkedin', 'github', 'portfolio',
          // Formation
          'currentLevel', 'fieldOfStudy', 'institution',
          'gpa', 'graduationYear', 'targetDegree', 'motivationSummary',
          // Arrays existants
          'academicHistory', 'workExperience', 'languages', 'skills',
          'targetCountries', 'targetFields',
          // Nouveaux arrays
          'academicProjects', 'certifications', 'volunteerWork',
          'publications', 'awards',
        ]

        const dataToUpdate: Record<string, any> = {}
        for (const field of fields) {
          if (body[field] !== undefined) dataToUpdate[field] = body[field]
        }

        // Sync champs courts
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
  }
}

export default Users
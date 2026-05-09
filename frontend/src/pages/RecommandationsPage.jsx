"use client";

import React, { useState, useEffect } from 'react';
import axiosInstance from '@/config/axiosInstance';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

const tokens = (theme) => ({
  accent: theme === "dark" ? "#4c9fd9" : "#0066b3",
  paper: theme === "dark" ? "#15140f" : "#faf8f3",
  surface: theme === "dark" ? "#1a1912" : "#ffffff",
  ink: theme === "dark" ? "#f2efe7" : "#141414",
  ink2: theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3: theme === "dark" ? "#a19f96" : "#6b6b6b",
  rule: theme === "dark" ? "#2b2a22" : "#d9d5cb",
  ruleSoft: theme === "dark" ? "#24231c" : "#e8e4d9",
  success: "#0d7a6b",
  warning: "#b06a12",
  danger: "#b4321f",
  fSerif: `"Playfair Display", serif`,
  fSans: `"DM Sans", sans-serif`,
})

export default function RecommendationsPage() {
  const { lang } = useT()
  const { theme } = useTheme()
  const c = tokens(theme)

  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(0)

  const STEPS = lang === 'fr'
    ? ['Chargement profil...', 'Génération embeddings...', 'Comparaison sémantique...', 'Tri résultats...']
    : ['Loading profile...', 'Generating embeddings...', 'Semantic comparison...', 'Sorting results...']

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        setStep(0)

        console.log('🔄 Fetching all users...')
        
        // Alternative : récupère directement l'user courant via une autre route
        const allUsersRes = await axiosInstance.get('/api/users')
        const currentUser = allUsersRes.data.docs?.[0] // First user
        
        if (!currentUser?.id) {
          throw new Error('No users found')
        }

        console.log('✅ Current user:', currentUser.id)

        setStep(1)
        const recRes = await axiosInstance.post('/api/recommendations', {
          userId: currentUser.id,
        })

        setStep(3)
        setScholarships(recRes.data.recommendations || [])
        setLoading(false)
      } catch (err) {
        console.error('❌ Error:', err.message)
        setError(err.message)
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!loading) return
    const timer = setInterval(() => {
      setStep(p => (p < STEPS.length - 1 ? p + 1 : p))
    }, 1200)
    return () => clearInterval(timer)
  }, [loading])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.paper }}>
        <div style={{ background: c.surface, padding: '56px 48px', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, border: `3px solid ${c.ruleSoft}`, borderTopColor: c.accent, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 28px' }} />
          <h3 style={{ fontFamily: c.fSerif, fontSize: 22, fontWeight: 700, color: c.ink, marginBottom: 28 }}>🧠 {lang === 'fr' ? 'Analyse...' : 'Analyzing...'}</h3>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 8, background: i <= step ? `${c.accent}15` : c.paper, borderRadius: 4 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: i < step ? c.success : i === step ? c.accent : c.ruleSoft }} />
              <span style={{ fontSize: 12, flex: 1, textAlign: 'left' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.paper }}>
        <div style={{ background: c.surface, padding: '40px', maxWidth: 400, textAlign: 'center' }}>
          <p style={{ color: c.danger }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', background: c.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <main style={{ background: c.paper, padding: '40px 32px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontFamily: c.fSerif, fontSize: 32, fontWeight: 700, color: c.ink, marginBottom: 32 }}>
          🧠 {scholarships.length} Recommandations par embeddings
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {scholarships.map((rec, i) => (
            <div key={i} style={{ background: c.surface, padding: 24, borderRadius: 8, border: `1px solid ${c.rule}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}>
                <h3 style={{ fontFamily: c.fSerif, fontSize: 16, fontWeight: 700, color: c.ink, margin: 0, flex: 1 }}>
                  {rec.bourseNom}
                </h3>
                <div style={{ fontSize: 24, fontWeight: 800, color: rec.similarity >= 70 ? c.success : c.warning, marginLeft: 12 }}>
                  {rec.similarity}%
                </div>
              </div>
              <p style={{ fontSize: 12, color: c.ink2, margin: '0 0 14px' }}>
                📍 {rec.bourse?.pays} • 🎓 {rec.bourse?.niveau}
              </p>
              {rec.matchReasons && (
                <div style={{ fontSize: 11, color: c.ink3 }}>
                  {rec.matchReasons.map((r, j) => (
                    <div key={j} style={{ marginBottom: 4 }}>✓ {r}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
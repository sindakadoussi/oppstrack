import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PAYLOAD_URL = 'http://localhost:3000'

// Décoder JWT sans librairie (pour le cas où Payload envoie un JWT)
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    const padded  = payload + '='.repeat((4 - payload.length % 4) % 4)
    return JSON.parse(atob(padded))
  } catch { return null }
}

export default function VerifyMagicLink({ setUser }) {
  const [status,  setStatus]  = useState('loading')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    // Cas 1 : notre endpoint → email dans l'URL
    let email    = params.get('email')

    if (!token) {
      setStatus('error')
      setMessage('Token manquant dans le lien.')
      return
    }

    // Cas 2 : Payload natif → email dans le JWT
    if (!email) {
      const decoded = decodeJWT(token)
      email = decoded?.email || null
    }

    if (!email) {
      setStatus('error')
      setMessage('Email introuvable dans le lien.')
      return
    }

    // Appel vers notre endpoint /magic-login
    fetch(`${PAYLOAD_URL}/api/users/magic-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase(), token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          // Stocker l'user — même clé que App.jsx utilise
          localStorage.setItem('opps_user',    JSON.stringify(data.user))
          localStorage.setItem('opps_user_id', data.user.id)
          // Mettre à jour l'état React si setUser est passé
          if (setUser) setUser(data.user)
          setStatus('success')
          setMessage(`Bienvenue ${data.user.name || data.user.email} !`)
          setTimeout(() => navigate('/'), 1500)
        } else {
          setStatus('error')
          setMessage(data.message || 'Lien invalide ou expiré.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Erreur de connexion au serveur.')
      })
  }, [])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a', fontFamily:'sans-serif' }}>
      <div style={{ background:'#1e293b', borderRadius:16, padding:'48px 40px', maxWidth:400, width:'100%', textAlign:'center', boxShadow:'0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🌍</div>
        <h2 style={{ color:'#f1f5f9', margin:'0 0 24px', fontSize:22 }}>OppsTrack</h2>

        {status === 'loading' && (
          <>
            <div style={{ width:48, height:48, borderRadius:'50%', border:'3px solid #334155', borderTop:'3px solid #6366f1', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
            <p style={{ color:'#94a3b8', margin:0 }}>Vérification en cours...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <p style={{ color:'#4ade80', fontWeight:600, fontSize:18, margin:'0 0 8px' }}>Connexion réussie !</p>
            <p style={{ color:'#94a3b8', margin:0 }}>{message}</p>
            <p style={{ color:'#64748b', fontSize:13, marginTop:12 }}>Redirection...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
            <p style={{ color:'#f87171', fontWeight:600, fontSize:18, margin:'0 0 8px' }}>Lien invalide</p>
            <p style={{ color:'#94a3b8', margin:'0 0 24px' }}>{message}</p>
            <button onClick={() => navigate('/')} style={{ background:'#6366f1', color:'white', border:'none', borderRadius:8, padding:'12px 24px', cursor:'pointer', fontSize:14, fontWeight:600 }}>
              Retourner à l'accueil
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
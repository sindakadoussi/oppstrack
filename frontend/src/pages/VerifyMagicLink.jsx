import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';

// Tokens identiques à la HomePage
const tokens = (theme) => ({
  accent:     theme === "dark" ? "#4c9fd9" : "#0066b3",
  accentInk:  theme === "dark" ? "#8ec1e6" : "#004f8a",
  ink:        theme === "dark" ? "#f2efe7" : "#141414",
  ink2:       theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3:       theme === "dark" ? "#a19f96" : "#6b6b6b",
  paper:      theme === "dark" ? "#15140f" : "#faf8f3",
  paper2:     theme === "dark" ? "#1d1c16" : "#f2efe7",
  rule:       theme === "dark" ? "#2b2a22" : "#d9d5cb",
  surface:    theme === "dark" ? "#1a1912" : "#ffffff",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans:  `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
});

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function VerifyMagicLink({ setUser }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const c = tokens(theme);
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    let email = params.get('email');

    if (!token) {
      setStatus('error');
      setMessage('Token manquant dans le lien.');
      return;
    }

    if (!email) {
      const decoded = decodeJWT(token);
      email = decoded?.email || null;
    }

    if (!email) {
      setStatus('error');
      setMessage('Email introuvable dans le lien.');
      return;
    }

    axiosInstance
      .post(API_ROUTES.auth.magicLogin, { email: email.toLowerCase(), token })
      .then((res) => {
        const data = res.data;
        if (data.user) {
          localStorage.setItem('opps_user', JSON.stringify(data.user));
          localStorage.setItem('opps_user_id', data.user.id);
          localStorage.setItem('opps_token', data.token || '');
          if (setUser) setUser(data.user);
          setUserData(data.user);
          setStatus('success');
          setMessage(lang === 'fr' ? `Bienvenue ${data.user.name || data.user.email} !` : `Welcome ${data.user.name || data.user.email}!`);
          setTimeout(() => navigate('/'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || (lang === 'fr' ? 'Lien invalide ou expiré.' : 'Invalid or expired link.'));
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage(lang === 'fr' ? 'Erreur de connexion au serveur.' : 'Server connection error.');
      });
  }, [navigate, setUser, lang]);

  const getAvatar = () => {
    if (userData?.photoURL) {
      return <img src={userData.photoURL} alt="avatar" style={{ ...styles.avatarImage, borderColor: c.paper }} />;
    }
    const firstLetter = (userData?.name?.[0] || userData?.email?.[0] || '?').toUpperCase();
    const bgColor = getColorFromString(userData?.name || userData?.email || '');
    return (
      <div style={{ ...styles.avatarInitial, background: bgColor, borderColor: c.paper }}>
        {firstLetter}
      </div>
    );
  };

  const getColorFromString = (str) => {
    if (!str) return c.accent;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  if (status === 'loading') {
    return (
      <div style={{ ...styles.container, background: c.paper }}>
        <div style={{ ...styles.card, background: c.surface, border: `1px solid ${c.rule}` }}>
          <div style={{ ...styles.spinner, borderTopColor: c.accent }} />
          <p style={{ ...styles.loadingText, color: c.ink3, fontFamily: c.fSans }}>
            {lang === 'fr' ? 'Vérification en cours...' : 'Verifying...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ ...styles.container, background: c.paper }}>
        <div style={{ ...styles.card, background: c.surface, border: `1px solid ${c.rule}` }}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={{ ...styles.errorTitle, color: c.danger, fontFamily: c.fSerif }}>
            {lang === 'fr' ? 'Lien invalide' : 'Invalid link'}
          </h2>
          <p style={{ ...styles.errorMessage, color: c.ink2, fontFamily: c.fSans }}>{message}</p>
          <button
            onClick={() => navigate('/')}
            style={{ ...styles.button, background: c.accent, fontFamily: c.fSans }}
            onMouseEnter={(e) => (e.currentTarget.style.background = c.accentInk)}
            onMouseLeave={(e) => (e.currentTarget.style.background = c.accent)}
          >
            {lang === 'fr' ? 'Retourner à l’accueil' : 'Back to home'}
          </button>
        </div>
      </div>
    );
  }

  // Succès
  return (
    <div style={{ ...styles.container, background: `linear-gradient(135deg, ${c.paper} 0%, ${c.paper2} 100%)` }}>
      {windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.2}
          colors={[c.accent, '#f5a623', '#2ecc71', '#e74c3c']}
        />
      )}
      <div style={{ ...styles.cardSuccess, background: c.surface, border: `1px solid ${c.rule}` }}>
        <div style={styles.avatarWrapper}>
          {getAvatar()}
          <div style={{ ...styles.checkmark, background: '#2ecc71', borderColor: c.surface }}>✓</div>
        </div>
        <h1 style={{ ...styles.title, color: c.ink, fontFamily: c.fSerif }}>
          🎉 {lang === 'fr' ? 'Connexion réussie !' : 'Successfully connected!'}
        </h1>
        <p style={{ ...styles.welcome, color: c.ink2, fontFamily: c.fSans }}>
          {userData?.name
            ? (lang === 'fr' ? `Bienvenue ${userData.name} !` : `Welcome ${userData.name}!`)
            : (lang === 'fr' ? 'Bienvenue !' : 'Welcome!')}
        </p>
        <p style={{ ...styles.redirect, color: c.ink3, fontFamily: c.fSans }}>
          {lang === 'fr' ? 'Redirection dans quelques secondes...' : 'Redirecting in a few seconds...'}
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: '48px 32px',
    textAlign: 'center',
    maxWidth: 400,
    width: '100%',
    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
  },
  cardSuccess: {
    borderRadius: 16,
    padding: '40px 32px',
    textAlign: 'center',
    maxWidth: 450,
    width: '100%',
    animation: 'fadeInUp 0.6s ease',
    boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
  },
  avatarWrapper: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: 24,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  avatarInitial: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
    border: '3px solid',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  checkmark: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    border: '2px solid',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 12,
  },
  welcome: {
    fontSize: 18,
    marginBottom: 24,
  },
  redirect: {
    fontSize: 13,
    marginTop: 8,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    margin: 0,
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  errorMessage: {
    marginBottom: 24,
    fontSize: 14,
  },
  button: {
    border: 'none',
    borderRadius: 40,
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    transition: 'all 0.2s ease',
    color: '#fff',
  },
};
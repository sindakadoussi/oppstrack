// StudentFeedback.jsx
import React, { useState, useEffect } from 'react';
import { useT } from '../i18n';
import { useTheme } from '../components/Navbar';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

const tokens = (theme) => ({
  bg: theme === "dark" ? "#15140f" : "#f5f7fa",
  bgCard: theme === "dark" ? "#1a1912" : "#ffffff",
  bgHero: theme === "dark" ? "#1a1912" : "#255cae",
  ink: theme === "dark" ? "#f2efe7" : "#141414",
  ink2: theme === "dark" ? "#cfccc2" : "#3a3a3a",
  ink3: theme === "dark" ? "#a19f96" : "#6b6b6b",
  ink4: theme === "dark" ? "#6d6b64" : "#9a9794",
  border: theme === "dark" ? "#2b2a22" : "#e1e5e9",
  borderLight: theme === "dark" ? "#24231c" : "#f0f0f0",
  accent: "#0066b3",
  accentLight: "#4c9fd9",
  danger: "#b4321f",
  dangerBg: theme === "dark" ? "rgba(180,50,31,0.15)" : "#fed7d7",
  dangerText: theme === "dark" ? "#ff6b5c" : "#742a2a",
  successBg: theme === "dark" ? "rgba(0,102,179,0.15)" : "#255cae",
  starActive: "#f5a623",
  starInactive: theme === "dark" ? "#4a4a4a" : "#cbd5e0",
  fSerif: `"Playfair Display", "Times New Roman", Georgia, serif`,
  fSans: `"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  fMono: `"DM Sans", monospace`,
});

export default function StudentFeedback({ setView, user }) {
  const { lang } = useT();
  const { theme } = useTheme();
  const C = tokens(theme);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: '',
    agreeTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (submitStatus) setSubmitStatus(null);
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setSubmitStatus({ type: 'error', message: lang === 'fr' ? 'Veuillez entrer votre nom' : 'Please enter your name' });
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setSubmitStatus({ type: 'error', message: lang === 'fr' ? 'Email valide requis' : 'Valid email required' });
      return;
    }
    if (!formData.comment.trim()) {
      setSubmitStatus({ type: 'error', message: lang === 'fr' ? 'Veuillez laisser un commentaire' : 'Please leave a comment' });
      return;
    }
    if (!formData.agreeTerms) {
      setSubmitStatus({ type: 'error', message: lang === 'fr' ? 'Vous devez accepter les conditions' : 'You must agree to the terms' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await axiosInstance.post(API_ROUTES.feedbacks.create, {
        name: formData.name,
        email: formData.email,
        rating: formData.rating,
        comment: formData.comment,
      });

      setSubmitStatus({
        type: 'success',
        message: lang === 'fr' ? 'Merci pour votre retour !' : 'Thank you for your feedback!'
      });

      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        rating: 5,
        comment: '',
        agreeTerms: false,
      });
    } catch (error) {
      console.error('Erreur lors de l’envoi du feedback :', error);
      setSubmitStatus({
        type: 'error',
        message: lang === 'fr'
          ? 'Erreur lors de l’envoi. Réessayez plus tard.'
          : 'Submission error. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  return (
    <div className="feedback-page" style={{ background: C.bg }}>
      <div className="back-button-container">
        <button 
          onClick={() => {
            if (setView) setView('accueil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="back-button"
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            color: C.accent,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}</span>
        </button>
      </div>

      <div className="feedback-hero" style={{ background: C.bgHero }}>
        <div className="feedback-hero-content">
          <h1 style={{ color: '#fff' }}>{lang === 'fr' ? 'Donnez votre avis' : 'Share your feedback'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.95)' }}>
            {lang === 'fr' 
              ? 'Votre opinion nous aide à améliorer OppsTrack pour tous les étudiants.' 
              : 'Your opinion helps us improve OppsTrack for all students.'}
          </p>
        </div>
      </div>

      <div className="feedback-container">
        <div className="feedback-form-section" style={{ background: C.bgCard, boxShadow: `0 10px 40px rgba(0,0,0,${theme === 'dark' ? '0.3' : '0.1'})` }}>
          <div className="form-header" style={{ background: C.bgHero }}>
            <h2 style={{ color: '#fff' }}>{lang === 'fr' ? 'Partagez votre expérience' : 'Share your experience'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>{lang === 'fr' ? 'Nous lisons chaque avis avec attention' : 'We read every feedback carefully'}</p>
          </div>

          {submitStatus?.type === 'success' ? (
            <div className="success-message">
              <div className="success-icon" style={{ background: C.accent }}>✓</div>
              <h3 style={{ color: C.ink }}>{submitStatus.message}</h3>
              <p style={{ color: C.ink3 }}>{lang === 'fr' ? 'Votre avis a bien été enregistré.' : 'Your feedback has been recorded.'}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-group">
                <label style={{ color: C.ink }}>{lang === 'fr' ? 'Nom complet' : 'Full name'} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={lang === 'fr' ? 'Jean Dupont' : 'John Doe'}
                  style={{
                    background: C.bg,
                    border: `2px solid ${submitStatus?.type === 'error' && !formData.name ? C.danger : C.border}`,
                    color: C.ink,
                  }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: C.ink }}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  style={{
                    background: C.bg,
                    border: `2px solid ${submitStatus?.type === 'error' && !formData.email ? C.danger : C.border}`,
                    color: C.ink,
                  }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: C.ink }}>{lang === 'fr' ? 'Note' : 'Rating'} *</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${formData.rating >= star ? 'active' : ''}`}
                      onClick={() => handleRatingClick(star)}
                      style={{
                        color: formData.rating >= star ? C.starActive : C.starInactive,
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="rating-label" style={{ color: C.ink3 }}>
                  {formData.rating === 1 && (lang === 'fr' ? 'Très insatisfait' : 'Very dissatisfied')}
                  {formData.rating === 2 && (lang === 'fr' ? 'Insatisfait' : 'Dissatisfied')}
                  {formData.rating === 3 && (lang === 'fr' ? 'Moyen' : 'Average')}
                  {formData.rating === 4 && (lang === 'fr' ? 'Satisfait' : 'Satisfied')}
                  {formData.rating === 5 && (lang === 'fr' ? 'Très satisfait' : 'Very satisfied')}
                </span>
              </div>

              <div className="form-group">
                <label style={{ color: C.ink }}>{lang === 'fr' ? 'Votre message' : 'Your message'} *</label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  rows={5}
                  placeholder={lang === 'fr' 
                    ? 'Partagez votre expérience avec OppsTrack, suggestions d\'amélioration...' 
                    : 'Share your experience with OppsTrack, suggestions for improvement...'}
                  style={{
                    background: C.bg,
                    border: `2px solid ${submitStatus?.type === 'error' && !formData.comment ? C.danger : C.border}`,
                    color: C.ink,
                  }}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label" style={{ color: C.ink3 }}>
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                  />
                  <span>
                    {lang === 'fr' 
                      ? 'J\'autorise OppsTrack à utiliser mon retour pour améliorer ses services.' 
                      : 'I allow OppsTrack to use my feedback to improve its services.'}
                  </span>
                </label>
              </div>

              {submitStatus?.type === 'error' && (
                <div className="error-message-global" style={{ background: C.dangerBg, color: C.dangerText }}>
                  {submitStatus.message}
                </div>
              )}

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isSubmitting}
                style={{
                  background: C.accent,
                  color: '#fff',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    {lang === 'fr' ? 'Envoi en cours...' : 'Submitting...'}
                  </>
                ) : (
                  lang === 'fr' ? 'Envoyer mon avis' : 'Submit feedback'
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=DM+Sans:opsz,wght@9..40,100;9..40,200;9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900;9..40,1000&display=swap');
        
        .feedback-page {
          min-height: 100vh;
        }

        .back-button-container {
          display: flex;
          justify-content: center;
          padding-top: 40px;
          padding-bottom: 20px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 50px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          font-family: ${C.fSans};
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .back-button:hover {
          transform: translateX(-5px);
          box-shadow: ${theme === 'dark' ? '0 5px 15px rgba(76,159,217,0.2)' : '0 5px 15px rgba(0,102,179,0.2)'};
        }

        .feedback-hero {
          padding: 60px 20px;
          text-align: center;
        }

        .feedback-hero-content h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: 700;
          font-family: ${C.fSerif};
        }

        .feedback-hero-content p {
          font-size: 1.2rem;
          font-family: ${C.fSans};
        }

        .feedback-container {
          max-width: 800px;
          margin: -50px auto 0;
          padding: 0 20px 80px;
        }

        .feedback-form-section {
          border-radius: 20px;
          overflow: hidden;
        }

        .form-header {
          padding: 40px;
          text-align: center;
        }

        .form-header h2 {
          font-size: 1.8rem;
          margin-bottom: 10px;
          font-family: ${C.fSerif};
        }

        .form-header p {
          font-family: ${C.fSans};
        }

        .feedback-form {
          padding: 40px;
        }

        .form-group {
          margin-bottom: 25px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-family: ${C.fSans};
          font-size: 13px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px 15px;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-family: ${C.fSans};
          outline: none;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          border-color: ${C.accent} !important;
          box-shadow: 0 0 0 3px rgba(0,102,179,0.1);
        }

        .rating-stars {
          display: flex;
          gap: 12px;
          margin-bottom: 10px;
        }

        .star-btn {
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          transition: transform 0.1s;
          padding: 0;
        }

        .star-btn:hover {
          transform: scale(1.1);
        }

        .rating-label {
          font-size: 12px;
          font-family: ${C.fSans};
        }

        .checkbox-group {
          margin: 20px 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-weight: normal;
          font-size: 12px;
          font-family: ${C.fSans};
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .error-message-global {
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13px;
          text-align: center;
          font-family: ${C.fSans};
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: ${C.fSans};
          letter-spacing: 0.5px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: ${theme === 'dark' ? '0 5px 20px rgba(76,159,217,0.4)' : '0 5px 20px rgba(0,102,179,0.4)'};
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .success-message {
          text-align: center;
          padding: 60px 40px;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          font-size: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .success-message h3 {
          font-size: 1.5rem;
          margin-bottom: 15px;
          font-family: ${C.fSerif};
        }

        .success-message p {
          font-family: ${C.fSans};
          margin-bottom: 30px;
        }

        @media (max-width: 768px) {
          .back-button-container {
            padding-top: 20px;
          }
          .feedback-hero-content h1 {
            font-size: 2rem;
          }
          .feedback-form {
            padding: 25px;
          }
          .form-header {
            padding: 30px 20px;
          }
          .form-header h2 {
            font-size: 1.5rem;
          }
          .star-btn {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}
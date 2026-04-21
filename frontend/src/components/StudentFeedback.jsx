// StudentFeedback.jsx
import React, { useState, useEffect } from 'react';
import { useT } from '../i18n';
import axiosInstance from '@/config/axiosInstance';
import { API_ROUTES } from '@/config/routes';

export default function StudentFeedback({ setView, user }) { // ✅ Ajout de la prop user
  const { lang } = useT();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: '',
    agreeTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // ✅ Pré-remplir avec les données utilisateur si disponibles
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
    <div className="feedback-page">
      <div className="back-button-container">
        <button 
          onClick={() => {
            if (setView) setView('accueil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="back-button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}</span>
        </button>
      </div>

      <div className="feedback-hero">
        <div className="feedback-hero-content">
          <h1>{lang === 'fr' ? 'Donnez votre avis' : 'Share your feedback'}</h1>
          <p>
            {lang === 'fr' 
              ? 'Votre opinion nous aide à améliorer OppsTrack pour tous les étudiants.' 
              : 'Your opinion helps us improve OppsTrack for all students.'}
          </p>
        </div>
      </div>

      <div className="feedback-container">
        <div className="feedback-form-section">
          <div className="form-header">
            <h2>{lang === 'fr' ? 'Partagez votre expérience' : 'Share your experience'}</h2>
            <p>{lang === 'fr' ? 'Nous lisons chaque avis avec attention' : 'We read every feedback carefully'}</p>
          </div>

          {submitStatus?.type === 'success' ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3>{submitStatus.message}</h3>
              <p>{lang === 'fr' ? 'Votre avis a bien été enregistré.' : 'Your feedback has been recorded.'}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-group">
                <label htmlFor="name">{lang === 'fr' ? 'Nom complet' : 'Full name'} *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={lang === 'fr' ? 'Jean Dupont' : 'John Doe'}
                  className={submitStatus?.type === 'error' && !formData.name ? 'error' : ''}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  className={submitStatus?.type === 'error' && !formData.email ? 'error' : ''}
                />
              </div>

              <div className="form-group">
                <label>{lang === 'fr' ? 'Note' : 'Rating'} *</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${formData.rating >= star ? 'active' : ''}`}
                      onClick={() => handleRatingClick(star)}
                      aria-label={`Noter ${star} étoiles`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="rating-label">
                  {formData.rating === 1 && (lang === 'fr' ? 'Très insatisfait' : 'Very dissatisfied')}
                  {formData.rating === 2 && (lang === 'fr' ? 'Insatisfait' : 'Dissatisfied')}
                  {formData.rating === 3 && (lang === 'fr' ? 'Moyen' : 'Average')}
                  {formData.rating === 4 && (lang === 'fr' ? 'Satisfait' : 'Satisfied')}
                  {formData.rating === 5 && (lang === 'fr' ? 'Très satisfait' : 'Very satisfied')}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="comment">{lang === 'fr' ? 'Votre message' : 'Your message'} *</label>
                <textarea
                  id="comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  rows={5}
                  placeholder={lang === 'fr' 
                    ? 'Partagez votre expérience avec OppsTrack, suggestions d\'amélioration...' 
                    : 'Share your experience with OppsTrack, suggestions for improvement...'}
                  className={submitStatus?.type === 'error' && !formData.comment ? 'error' : ''}
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
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
                <div className="error-message-global">
                  {submitStatus.message}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
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


      <style jsx>{`
        .feedback-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e1e5e9;
          border-radius: 50px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: #667eea;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .back-button:hover {
          background: white;
          transform: translateX(-5px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
          border-color: #667eea;
        }

        .feedback-hero {
          background: #255cae;
          padding: 60px 20px;
          text-align: center;
          color: white;
        }

        .feedback-hero-content h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .feedback-hero-content p {
          font-size: 1.2rem;
          opacity: 0.95;
        }

        .feedback-container {
          max-width: 800px;
          margin: -50px auto 0;
          padding: 0 20px 80px;
        }

        .feedback-form-section {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .form-header {
          background: #255cae;
          padding: 40px;
          text-align: center;
          color: white;
        }

        .form-header h2 {
          font-size: 1.8rem;
          margin-bottom: 10px;
        }

        .form-header p {
          opacity: 0.95;
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
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group input.error,
        .form-group textarea.error {
          border-color: #e74c3c;
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
          color: #cbd5e0;
          transition: color 0.2s, transform 0.1s;
          padding: 0;
        }

        .star-btn.active {
          color: #f5a623;
        }

        .star-btn:hover {
          transform: scale(1.1);
        }

        .rating-label {
          font-size: 13px;
          color: #718096;
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
          font-size: 13px;
          color: #4a5568;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .error-message-global {
          background: #fed7d7;
          color: #742a2a;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
          text-align: center;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #255cae;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
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
          background: #255cae;
          color: white;
          font-size: 3rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .success-message h3 {
          font-size: 1.8rem;
          color: #333;
          margin-bottom: 15px;
        }

        .success-message p {
          color: #666;
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
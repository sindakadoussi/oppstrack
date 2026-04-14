// ContactPage.jsx
import React, { useState } from "react";

export default function ContactPage({ setView }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: ""
  });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Le nom est requis";
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.category) newErrors.category = "Veuillez sélectionner une catégorie";
    if (!formData.message.trim()) newErrors.message = "Le message est requis";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSent(true);
    
    setTimeout(() => {
      setSent(false);
      setFormData({ name: "", email: "", category: "", message: "" });
    }, 3000);
  };

  return (
    <div className="contact-page">
      {/* Flèche de retour au milieu */}
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
          <span>Back to home</span>
        </button>
      </div>

      <div className="contact-hero">
        <div className="contact-hero-content">
          <h1>Contactez notre équipe</h1>
          <p>Nous sommes là pour répondre à toutes vos questions</p>
        </div>
      </div>

      <div className="contact-container">
        <div className="contact-info-section">
          <div className="info-card">
            <div className="info-icon">📧</div>
            <h3>Email</h3>
            <p>contact@oppstrack.com</p>
            <p className="info-detail">Réponse sous 24h</p>
          </div>

          <div className="info-card">
            <div className="info-icon">📞</div>
            <h3>Téléphone</h3>
            <p>+216 51 551 456</p>
            <p className="info-detail">Lun-Ven, 9h-18h</p>
          </div>

          <div className="info-card">
            <div className="info-icon">📍</div>
            <h3>Adresse</h3>
            <p>Tunis, Tunisie</p>
            <p className="info-detail">Nous rencontrer</p>
          </div>
        </div>

        <div className="contact-form-section">
          <div className="form-header">
            <h2>Envoyez-nous un message</h2>
            <p>Remplissez le formulaire ci-dessous et nous vous répondrons rapidement</p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Nom complet *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? "error" : ""}
                  placeholder="Jean Dupont"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                  placeholder="jean@example.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Catégorie *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={errors.category ? "error" : ""}
                >
                  <option value="">Sélectionnez une catégorie</option>
                  <option value="support">📩 Support technique</option>
                  <option value="bourse">🎓 Question sur une bourse</option>
                  <option value="partenariat">💼 Partenariat</option>
                  <option value="bug">🐞 Signaler un bug</option>
                  <option value="autre">❓ Autre</option>
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className={errors.message ? "error" : ""}
                  rows="5"
                  placeholder="Décrivez votre demande en détail..."
                />
                {errors.message && <span className="error-message">{errors.message}</span>}
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le message"
                )}
              </button>
            </form>
          ) : (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3>Message envoyé avec succès !</h3>
              <p>Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.</p>
              <button onClick={() => setSent(false)} className="new-message-btn">
                Envoyer un nouveau message
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .contact-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        /* Conteneur de la flèche - centré */
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

        .back-button svg {
          transition: transform 0.3s ease;
        }

        .back-button:hover svg {
          transform: translateX(-3px);
        }

        .contact-hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 60px 20px;
          text-align: center;
          color: white;
        }

        .contact-hero-content h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .contact-hero-content p {
          font-size: 1.2rem;
          opacity: 0.95;
        }

        .contact-container {
          max-width: 1200px;
          margin: -50px auto 0;
          padding: 0 20px 80px;
        }

        .contact-info-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
        }

        .info-card {
          background: white;
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .info-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .info-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .info-card h3 {
          font-size: 1.3rem;
          color: #333;
          margin-bottom: 10px;
        }

        .info-card p {
          color: #666;
          margin: 5px 0;
        }

        .info-detail {
          font-size: 0.85rem;
          color: #999;
        }

        .contact-form-section {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .form-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

        .contact-form {
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
        .form-group select,
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
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
          border-color: #e74c3c;
        }

        .error-message {
          color: #e74c3c;
          font-size: 0.85rem;
          margin-top: 5px;
          display: block;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

        .new-message-btn {
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.2s ease;
        }

        .new-message-btn:hover {
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .back-button-container {
            padding-top: 20px;
          }

          .contact-hero-content h1 {
            font-size: 2rem;
          }

          .contact-form {
            padding: 25px;
          }

          .form-header {
            padding: 30px 20px;
          }

          .form-header h2 {
            font-size: 1.5rem;
          }
        }
          
      `}</style>
    </div>
  );
}
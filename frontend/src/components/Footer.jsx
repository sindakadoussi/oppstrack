import React from 'react';
import { useT } from '../i18n';

export default function Footer({ setView }) {
  const { t, lang } = useT();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Colonne 1 : Logo & description */}
        <div className="footer-col">
          <div className="footer-logo">
            <img 
              src="logo.png"
              alt="OppsTrack" 
              className="footer-logo-img"
              style={{ height: '28px', width: 'auto', background: 'none' }}
            />
            <span className="footer-logo-text">OppsTrack</span>
          </div>
          <p className="footer-desc">
            {lang === 'fr' 
              ? 'La plateforme qui centralise les bourses 100% financées et vous accompagne de la recherche à l\'acceptation.'
              : 'The platform that centralizes 100% funded scholarships and guides you from search to acceptance.'}
          </p>
          <div className="footer-social">
            <a href="#" className="social-link" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" fill="currentColor"/>
                <rect x="2" y="9" width="4" height="12" fill="currentColor"/>
                <circle cx="4" cy="4" r="2" fill="currentColor"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" fill="currentColor"/>
              </svg>
            </a>
            <a href="#" className="social-link" aria-label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Colonne 2 : Liens / Explorer */}
        <div className="footer-col">
          <h4 className="footer-heading">{lang === 'fr' ? 'Explorer' : 'Explore'}</h4>
          <ul className="footer-links">
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('accueil'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {lang === 'fr' ? 'Accueil' : 'Home'}
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('bourses'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {lang === 'fr' ? 'Bourses' : 'Scholarships'}
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('recommandations'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {lang === 'fr' ? 'Recommandations' : 'Recommendations'}
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('roadmap'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {lang === 'fr' ? 'Roadmap' : 'Roadmap'}
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('entretien'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {lang === 'fr' ? 'Entretien virtuel' : 'Mock Interview'}
              </a>
            </li>
          </ul>
        </div>

    {/* Colonne 3 : Ressources */}
<div className="footer-col">
  <h4 className="footer-heading">{lang === 'fr' ? 'Ressources' : 'Resources'}</h4>
  <ul className="footer-links">
    <li><a href="#">{lang === 'fr' ? 'Blog' : 'Blog'}</a></li>
    <li><a href="#">{lang === 'fr' ? 'FAQ' : 'FAQ'}</a></li>
    {/* Témoignages remplace l'ancien "Avis étudiants" */}
    <li>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (setView) setView('feedback');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        {lang === 'fr' ? 'Témoignages' : 'Testimonials'}
      </a>
    </li>
    <li><a href="#">{lang === 'fr' ? 'Guide complet' : 'Complete Guide'}</a></li>
  </ul>
</div>

        {/* Colonne 4 : Contact */}
        <div className="footer-col">
          <h4 className="footer-heading">{lang === 'fr' ? 'Contact' : 'Contact'}</h4>
          <ul className="footer-links">
            <li><a href="mailto:contact@oppstrack.com">contact@oppstrack.com</a></li>
            <li><a href="#">+216 51 551 456</a></li>
            <li>
              <a
                href="#"
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (setView) setView('contact'); 
                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                }}
              >
                {lang === 'fr' ? 'Nous écrire' : 'Contact us'}
              </a>
            </li>
          </ul>
        </div>
      </div>

      

      <style>{`
        .footer {
          background: #255cae;
          border-top: 3px solid #f5a623;
          padding: 48px 32px 24px;
          margin-top: 0;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
        }
        .footer-col { display: flex; flex-direction: column; gap: 14px; }
        .footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .footer-logo-img {
          width: 28px;
          height: 28px;
          object-fit: contain;
          background: none;
        }
        .footer-logo-text {
          font-size: 1.1rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 1px;
        }
        .footer-desc {
          color: rgba(255,255,255,0.6);
          font-size: 13px;
          line-height: 1.6;
          margin: 0;
        }
        .footer-social {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }
        .social-link {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.6);
          font-size: 14px;
          transition: all 0.2s;
          text-decoration: none;
        }
        .social-link:hover {
          background: #f5a623;
          border-color: #f5a623;
          color: #255cae;
        }
        .footer-heading {
          font-size: 12px;
          font-weight: 700;
          color: #f5a623;
          margin: 0 0 6px 0;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-links li a {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
        }
        .footer-links li a:hover {
          color: #f5a623;
        }
        .footer-bottom {
          max-width: 1200px;
          margin: 32px auto 0;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
        }
        .footer-bottom p {
          margin: 0;
        }
        .footer-legal {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .footer-legal a {
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-legal a:hover {
          color: #f5a623;
        }
        .footer-legal span {
          color: rgba(255,255,255,0.15);
        }

        @media (max-width: 768px) {
          .footer {
            padding: 40px 20px 24px;
          }
          .footer-container {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
          .footer-legal {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}
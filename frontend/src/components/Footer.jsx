import React from 'react';

export default function Footer({ setView }) {
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
              style={{ height: '28px', width: 'auto', background:'none'}}
            />
            <span className="footer-logo-text">OppsTrack</span>
          </div>
          <p className="footer-desc">
            La plateforme qui centralise les bourses 100% financées et vous accompagne de la recherche à l'acceptation.
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

        {/* Colonne 2 : Liens */}
        <div className="footer-col">
          <h4 className="footer-heading">Explorer</h4>
          <ul className="footer-links">
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('accueil'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >Accueil</a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('bourses'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >Bourses</a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('recommandations'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >Recommandations</a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('roadmap'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >Roadmap</a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (setView) setView('entretien'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >Entretien virtuel</a>
            </li>
          </ul>
        </div>

        {/* Colonne 3 : Ressources */}
        <div className="footer-col">
          <h4 className="footer-heading">Ressources</h4>
          <ul className="footer-links">
            <li><a href="#">Blog</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Témoignages</a></li>
            <li><a href="#">Guide complet</a></li>
          </ul>
        </div>

        {/* Colonne 4 : Contact */}
        <div className="footer-col">
          <h4 className="footer-heading">Contact</h4>
          <ul className="footer-links">
            <li><a href="mailto:contact@oppstrack.com">contact@oppstrack.com</a></li>
            <li><a href="#">+216 12 345 678</a></li>
            <li><a href="#">Nous écrire</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} OppsTrack – Tous droits réservés.</p>
        <div className="footer-legal">
          <a href="#">Mentions légales</a>
          <span>•</span>
          <a href="#">Confidentialité</a>
          <span>•</span>
          <a href="#">CGU</a>
        </div>
      </div>
    </footer>
  );
}
// src/server.ts — Compatible PayloadCMS 3.x
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { getPayload } from 'payload';
import config from './payload.config';
import { sendMagicLink, verifyMagicToken } from './auth';

dotenv.config();

const PORT = process.env.PORT || 3000;

const start = async () => {
  // ✅ Initialisation Payload v3
  const payload = await getPayload({ config });

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5678',
    ],
    credentials: true,
  }));

  // ✅ Envoyer le magic link
  app.post('/api/auth/magic-link/request', async (req, res) => {
    try {
      const rawEmail = req.body?.email;
      const email = typeof rawEmail === 'string'
        ? rawEmail.replace(/^=/, '').trim()
        : null;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Email invalide' });
      }

      await sendMagicLink(email);
      return res.json({ success: true, email, message: 'Email envoyé !' });
    } catch (err: any) {
      console.error('❌ Erreur magic link:', err);
      return res.status(500).json({ error: 'Échec envoi email', details: err.message });
    }
  });

  // ✅ Vérifier le token magic link
  app.post('/api/auth/magic-link/verify', async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: 'Token manquant' });

      const { email } = verifyMagicToken(token);
      return res.json({
        success: true,
        session: { user: { email } },
      });
    } catch {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
  });

  app.get('/', (_, res) => res.redirect('/admin'));

  app.listen(PORT, () => {
    console.log(`🚀 Serveur sur http://localhost:${PORT}`);
    console.log(`🔐 POST /api/auth/magic-link/request`);
    console.log(`🔐 POST /api/auth/magic-link/verify`);
    console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
  });
};

start();
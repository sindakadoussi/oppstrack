import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const SECRET = process.env.PAYLOAD_SECRET!;

export async function sendMagicLink(email: string): Promise<void> {
  const token = jwt.sign({ email }, SECRET, { expiresIn: "5m" });
  const magicUrl = `http://localhost:5173/verify?token=${token}`;

  await transporter.sendMail({
    from: `"OppsTrack" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "🔐 Votre lien de connexion OppsTrack",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#2563eb;text-align:center">👋 Bienvenue sur OppsTrack</h2>
        <p style="text-align:center;color:#64748b">Cliquez ci-dessous pour vous connecter :</p>
        <div style="text-align:center;margin:30px 0">
          <a href="${magicUrl}" style="background:linear-gradient(135deg,#2563eb,#7c3aed);color:white;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:600;display:inline-block">
            🔐 Se connecter
          </a>
        </div>
        <p style="color:#94a3b8;font-size:13px;text-align:center">Lien valable 5 minutes</p>
      </div>
    `,
  });

  console.log("✅ Email envoyé à", email);
}

export function verifyMagicToken(token: string): { email: string } {
  return jwt.verify(token, SECRET) as { email: string };
}
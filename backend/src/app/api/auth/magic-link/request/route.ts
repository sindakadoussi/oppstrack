import { NextRequest, NextResponse } from 'next/server';
import { sendMagicLink } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    let body;
    try { body = JSON.parse(text); } 
    catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }); }

    const rawEmail = body?.email;
    const email = typeof rawEmail === 'string' ? rawEmail.replace(/^=/, '').trim() : null;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    await sendMagicLink(email);

    return NextResponse.json({ success: true, email, message: 'Email envoyé !' });

  } catch (err: any) {
    console.error('❌ Erreur:', err);
    return NextResponse.json({ error: 'Server error', details: err?.message }, { status: 500 });
  }
}
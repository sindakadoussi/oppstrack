import { NextRequest, NextResponse } from 'next/server';
import payload from 'payload';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    // Récupérer le media sans authentification
    const media = await payload.findByID({
      collection: 'media',
      id: id,
      user: null,
      depth: 0,
    });

    if (!media || !media.url) {
      return NextResponse.json({ error: 'Media non trouvé' }, { status: 404 });
    }

    // Rediriger vers l'URL réelle du fichier
    const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3000';
    const mediaUrl = `${baseUrl}${media.url}`;
    
    // Redirection 302 vers l'URL du fichier
    return NextResponse.redirect(mediaUrl);

  } catch (err: any) {
    console.error('❌ Erreur media:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
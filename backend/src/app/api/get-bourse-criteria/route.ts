import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers });
}

export async function POST(req: NextRequest) {
  try {
    const { bourseId } = await req.json();

    if (!bourseId) {
      return NextResponse.json(
        { error: 'bourseId requis' },
        { status: 400, headers }
      );
    }

    const payload = await getPayload({ config });

    // Récupérer la bourse avec tous les critères
    const bourse = await payload.findByID({
      collection: 'bourses',
      id: bourseId,
    });

    if (!bourse) {
      return NextResponse.json(
        { error: 'Bourse non trouvée' },
        { status: 404, headers }
      );
    }

    // Extraire les critères
    const criteria = {
      id: bourse.id,
      nom: bourse.nom,
      pays: bourse.pays,
      niveau: bourse.niveau || [],
      langue: bourse.langue,
      tunisienEligible: bourse.tunisienEligible || false,
      domaines: bourse.domaine || [],
      description: bourse.description || '',
    };

    return NextResponse.json(
      { success: true, criteria },
      { headers }
    );
  } catch (error) {
    console.error('❌ Erreur get-bourse-criteria:', error);
    return NextResponse.json(
      { error: String(error), details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers }
    );
  }
}
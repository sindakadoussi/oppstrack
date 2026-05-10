import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '../../../services/huggingface.service';
import { searchSimilarBourses } from '../../../services/supabase.service';

// CORS headers
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
    const { profileText, limit = 10 } = await req.json();

    if (!profileText) {
      return NextResponse.json(
        { error: 'profileText requis' },
        { status: 400, headers }
      );
    }

    console.log("🔍 Génération embedding du profil...");
    const userEmbedding = await generateEmbedding(profileText);
    console.log("✅ Embedding généré:", userEmbedding.length, "dimensions");

    console.log("🔍 Recherche des bourses similaires...");
    const results = await searchSimilarBourses(userEmbedding, { limit });
    console.log("✅ Résultats:", results.length, "bourses");

    return NextResponse.json({
      success: true,
      count: results.length,
      bourses: results,
    }, { headers });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500, headers }
    );
  }
}
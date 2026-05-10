import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../services/supabase.service';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('bourses_embeddings')
      .select('id, bourse_id, titre, embedding')
      .limit(3);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Raw data from Supabase:', data);
    return NextResponse.json({ data, count: data?.length || 0 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
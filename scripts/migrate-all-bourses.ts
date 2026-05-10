/**
 * Migre tous les embeddings des bourses existantes
 * À exécuter UNE fois:
 * npx ts-node scripts/migrate-embeddings.ts
 */

import axios from 'axios';
import { generateEmbeddingsBatch } from '../src/services/embedding.service.js';
import { saveBourseEmbeddingsBatch, getSupabaseAdmin } from '../src/services/supabase.service.js';

const API_BASE = process.env.PAYLOAD_SERVER_URL || 'http://localhost:3000';

async function migrate() {
  console.log('🚀 Migration des embeddings...\n');

  try {
    // 1. Récupérer toutes les bourses
    console.log('1️⃣ Récupération des bourses...');
    const { data: allBourses } = await axios.get(
      `${API_BASE}/api/bourses`,
      {
        params: { limit: 500, depth: 0 },
      }
    );

    const bourses = allBourses.docs || [];
    console.log(`   ✅ ${bourses.length} bourses trouvées\n`);

    // 2. Préparer les textes
    console.log('2️⃣ Préparation des textes...');
    const texts = bourses.map(
      (b) => `
        ${b.nom}
        ${b.description || ''}
        ${b.domaine || ''}
        ${b.niveau || ''}
      `
    );
    console.log(`   ✅ ${texts.length} textes prêts\n`);

    // 3. Générer embeddings par batch (max 32 à la fois)
    console.log('3️⃣ Génération des embeddings (par batch)...');
    const BATCH_SIZE = 10;
    const embeddings: Record<string, number[]> = {};

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      console.log(`   Batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(texts.length / BATCH_SIZE)}...`);

      const batchEmbeddings = await generateEmbeddingsBatch(batch);
      batch.forEach((text, idx) => {
        const bourseIdx = i + idx;
        embeddings[bourses[bourseIdx].id] = batchEmbeddings[idx];
      });
    }
    console.log(`   ✅ ${Object.keys(embeddings).length} embeddings générés\n`);

    // 4. Sauvegarder dans Supabase
    console.log('4️⃣ Sauvegarde dans Supabase...');
    const admin = getSupabaseAdmin();

    const toInsert = bourses.map((b) => ({
      bourse_id: b.id,
      nom: b.nom,
      description_text: b.description || '',
      embedding: embeddings[b.id],
    }));

    const { error } = await admin
      .from('bourses_embeddings')
      .upsert(toInsert);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log(`   ✅ ${toInsert.length} embeddings sauvegardés\n`);

    console.log('✅ Migration terminée!');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

migrate();
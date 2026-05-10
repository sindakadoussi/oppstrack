import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Configuration Supabase incomplète");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function saveEmbedding(
  bourseId: string,
  titre: string,
  embedding: number[]
) {
  const { data, error } = await supabase
    .from("bourses_embeddings")
    .upsert(
      {
        bourse_id: bourseId,
        titre,
        embedding,
      },
      { onConflict: "bourse_id" }
    )
    .select();

  if (error) {
    console.error("❌ Erreur Supabase :", error);
    throw error;
  }

  console.log(`✅ Embedding sauvegardé : ${titre}`);
  return data;
}

export async function searchSimilarBourses(
  userEmbedding: number[],
  options: {
    limit?: number;
    minSimilarity?: number;
  } = {}
) {
  const { limit = 10, minSimilarity = 0.3 } = options;

  const { data, error } = await supabase
    .from("bourses_embeddings")
    .select("id, bourse_id, titre, embedding");

  if (error) {
    console.error("❌ Erreur:", error);
    throw error;
  }

  console.log(`📊 ${data?.length || 0} bourses trouvées`);

  const cosineSimilarity = (a: number[], b: number[]) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const withScores = (data || [])
    .map((item: any) => {
      // Parser l'embedding (c'est une string)
      let embeddingArray = item.embedding;
      if (typeof embeddingArray === "string") {
        embeddingArray = JSON.parse(embeddingArray);
      }
      
      return {
        ...item,
        similarity: cosineSimilarity(userEmbedding, embeddingArray),
      };
    })
    .filter((item: any) => !isNaN(item.similarity) && item.similarity >= minSimilarity)
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, limit);

  console.log(`✅ ${withScores.length} bourses pertinentes`);
  return withScores;
}
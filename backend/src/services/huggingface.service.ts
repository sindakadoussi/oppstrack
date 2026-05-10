import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = true;
env.allowRemoteModels = true;

let extractor: any = null;

async function initializeModel() {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return extractor;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Le texte à vectoriser ne peut pas être vide");
  }

  try {
    const model = await initializeModel();
    const output = await model(text, {
      pooling: "mean",
      normalize: true,
    });

    const embedding = Array.from(output.data as Float32Array);
    return embedding;
  } catch (error) {
    console.error("❌ Erreur vectorisation :", error);
    throw error;
  }
}

export async function generateUserProfileEmbedding(
  profileText: string
): Promise<number[]> {
  return generateEmbedding(profileText);
}
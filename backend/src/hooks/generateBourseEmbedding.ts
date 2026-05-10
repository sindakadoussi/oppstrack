import { CollectionBeforeChangeHook } from "payload";
import { generateEmbedding } from "../services/huggingface.service";
import { saveEmbedding } from "../services/supabase.service";

export const generateBourseEmbedding: CollectionBeforeChangeHook = async ({
  data,
  operation,
}) => {
  if (operation === "create" || operation === "update") {
    console.log(`🔄 [HOOK] Vectorisation : ${data.nom}`);

    try {
      if (!data.nom) {
        console.warn("⚠️ Pas de nom");
        return data;
      }

      const textToEmbed = [
        data.nom ? `Titre: ${data.nom}` : "",
        data.description ? `Description: ${data.description}` : "",
        data.criteres ? `Critères: ${data.criteres}` : "",
        data.niveau ? `Niveau: ${data.niveau}` : "",
      ]
        .filter((line) => line.length > 0)
        .join("\n");

      if (textToEmbed.length < 10) {
        return data;
      }

      const embedding = await generateEmbedding(textToEmbed);
      const bourseId = data.id || `bourse_${Date.now()}`;
      await saveEmbedding(bourseId, data.nom, embedding);

      console.log(`✅ [HOOK] Bourse vectorisée : ${data.nom}`);
    } catch (error) {
      console.error(`❌ [HOOK] Erreur : ${data.nom}`, error);
    }
  }

  return data;
};
import { CollectionBeforeChangeHook } from 'payload';

export const generateEmbedding: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create' || operation === 'update') {
    const textToVectorize = `
      Nom: ${data.nom} 
      Description: ${data.description}
      Critères: ${data.criteres}
    `.trim();

    try {
      // On envoie le texte à un nouveau workflow n8n dédié à la vectorisation
      const response = await fetch('http://localhost:5678/webhook/vectorize-bourse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: textToVectorize,
          id: data.id 
        }),
      });

      const result = await response.json();
      // On récupère le vecteur généré par n8n
      data.embedding = result.embedding;
      
    } catch (error) {
      console.error("Erreur de liaison avec n8n pour vectorisation:", error);
    }
  }
  return data;
};
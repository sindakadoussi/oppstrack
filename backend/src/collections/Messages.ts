import { CollectionConfig } from 'payload';

const Messages: CollectionConfig = {
  slug: 'messages',
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    { name: 'text', type: 'text', required: true },
    { name: 'role', type: 'select', options: ['user', 'assistant'], required: true },
    { name: 'conversationId', type: 'text', required: true },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          console.log("🚀 Tentative d'envoi à n8n via localhost...");
          try {
            // Utilisation de localhost car Payload et n8n (via ports) sont sur la même machine
            const response = await fetch('http://localhost:5678/webhook/webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(doc),
            });

            if (response.ok) {
              console.log("✅ n8n a reçu le message !");
            } else {
              console.log("⚠️ Erreur n8n, Status:", response.status);
            }
          }catch (error) {
  if (error instanceof Error) {
    console.error("❌ Erreur de connexion n8n :", error.message);
    console.error("Stack :", error.stack);
  } else {
    console.error("❌ Erreur inconnue :", JSON.stringify(error));
  }}
        }
      },
    ],
  },
};

export default Messages;
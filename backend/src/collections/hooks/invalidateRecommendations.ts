// backend/src/collections/hooks/invalidateRecommendations.js

import { CollectionAfterChangeHook } from "payload";

/**
 * Hook qui invalide les recommandations quand le profil utilisateur change
 * Déclenche également la régénération automatique via n8n
 */
export const invalidateRecommendationsOnProfileChange: CollectionAfterChangeHook = async ({
  doc,           // Document après modification
  previousDoc,   // Document avant modification
  req,
  operation,
}) => {
  // Ne s'exécute que lors d'une mise à jour (pas création)
  if (operation !== 'update') return doc;

  // Champs critiques qui invalident les recommandations
  const criticalFields = [
    'paysCibles',      // Changement de pays cible (ex: France → Canada)
    'domaine',         // Domaine d'étude
    'niveau',          // Niveau d'étude (Bachelor, Master, PhD)
    'experiences',     // Expériences professionnelles
    'diplomes',        // Diplômes obtenus
    'competences',     // Compétences techniques
    'langues',         // Langues parlées
    'publications',    // Publications scientifiques
    'certifications'   // Certifications professionnelles
  ];

  // Vérifie si un champ critique a changé
  let shouldInvalidate = false;
  let changedFields = [];
  
  for (const field of criticalFields) {
    const oldValue = JSON.stringify(previousDoc[field] || null);
    const newValue = JSON.stringify(doc[field] || null);
    
    if (oldValue !== newValue) {
      shouldInvalidate = true;
      changedFields.push(field);
      console.log(`🔄 [Profile Hook] Changement détecté sur: ${field}`);
    }
  }

  // Si aucun changement critique, on conserve les recommandations
  if (!shouldInvalidate) {
    console.log('✅ [Profile Hook] Aucun changement critique, recommandations conservées');
    return doc;
  }

  console.log(`📢 [Profile Hook] Changements détectés: ${changedFields.join(', ')}`);
  console.log(`🆔 Utilisateur: ${doc.id} (${doc.email})`);

  // Supprime les anciennes recommandations
  let deletedCount = 0;
  try {
    const deleted = await req.payload.delete({
      collection: 'recommendations',
      where: {
        studentProfile: {
          equals: doc.id,
        },
      },
    });
    
    deletedCount = deleted.docs?.length || 0;
    console.log(`🗑️ [Profile Hook] ${deletedCount} recommandation(s) supprimée(s)`);
    
  } catch (error) {
    console.error('❌ [Profile Hook] Erreur lors de la suppression des recommandations:', error);
    // Continue même si la suppression échoue (peut-être pas de recommandations existantes)
  }

  // ✅ DÉCLENCHER LA RÉGÉNÉRATION AUTOMATIQUE VIA N8N
  try {
    console.log('🚀 [Profile Hook] Déclenchement de la régénération des recommandations...');
    
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/recommandation';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Trigger-Source': 'profile-hook'  // Pour tracer la source
      },
      body: JSON.stringify({ 
        email: doc.email, 
        userId: doc.id,
        forceRefresh: true,           // Force la régénération
        triggerSource: 'profile-update',
        changedFields: changedFields,  // Envoyer les champs modifiés pour info
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ [Profile Hook] Régénération déclenchée avec succès: ${result.recommandations?.length || 0} nouvelles recommandations`);
    
  } catch (error) {
    console.error('❌ [Profile Hook] Erreur lors du déclenchement du webhook n8n:', error);
    // Ne pas bloquer l'opération principale si le webhook échoue
    // Les recommandations seront régénérées au prochain chargement de la page
  }

  // ✅ Optionnel: Notifier via Socket.IO si vous avez du temps réel
  // (Décommentez si vous utilisez Socket.IO)
  /*
  try {
    const io = req.payload.socketIO;
    if (io) {
      io.to(`user-${doc.id}`).emit('profile-updated', {
        userId: doc.id,
        changedFields: changedFields,
        requiresRefresh: true
      });
    }
  } catch (error) {
    console.warn('⚠️ [Profile Hook] Notification Socket.IO échouée:', error);
  }
  */

  return doc;
};
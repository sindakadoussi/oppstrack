import { CollectionConfig } from 'payload';

const Recommendations: CollectionConfig = {
  slug: 'recommendations',
  admin: {
    useAsTitle: 'id',
   
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'studentProfile',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'L\'étudiant pour lequel les recommandations sont générées',
      },
    },
    {
      name: 'scholarships',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'bourseId',
          type: 'text',
          required: true,
        },
        {
          name: 'titre',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'domaine',
          type: 'text',
        },
        {
          name: 'niveau',
          type: 'text',
        },
        {
          name: 'pays',
          type: 'text',
        },
        {
          name: 'montant',
          type: 'text',
        },
        {
          name: 'deadline',
          type: 'date',
        },
        {
          name: 'lien',
          type: 'text',
        },
        {
          name: 'score',
          type: 'number',
          required: true,
        },
        {
          name: 'raisons',
          type: 'array',
          fields: [
            {
              name: 'raison',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'scoreMax',
      type: 'number',
      required: true,
      admin: {
        description: 'Score maximum de la meilleure recommandation',
      },
    },
    {
      name: 'dateGeneration',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        description: 'Date et heure de génération des recommandations',
      },
    },
  ],

  endpoints: [
  {
    path: '/',
    method: 'post',
    handler: async (req) => {
      const body = await req.json?.() || req.body || {};
      
      console.log('[RECOMMENDATIONS] Données reçues');
      
      try {
        // Supprimer les anciennes recommandations
        const existing = await req.payload.find({
          collection: 'recommendations',
          where: {
            studentProfile: {
              equals: body.studentProfile,
            },
          },
        });

        for (const rec of existing.docs) {
          await req.payload.delete({
            collection: 'recommendations',
            id: rec.id,
          });
        }

        console.log(`[RECOMMENDATIONS] ${existing.docs.length} anciennes recommandations supprimées`);

        // ✅ CONVERSION : array de strings → array d'objets
        const scholarshipsFormatted = body.scholarships.map((s: any) => {
          // Si raisons est déjà un array d'objets, le garder
          // Sinon, convertir array de strings en array d'objets
          let raisonsFormatted;
          
          if (Array.isArray(s.raisons)) {
            if (s.raisons.length > 0 && typeof s.raisons[0] === 'string') {
              // C'est un array de strings → convertir
              raisonsFormatted = s.raisons.map((r: string) => ({ raison: r }));
            } else {
              // C'est déjà un array d'objets → garder tel quel
              raisonsFormatted = s.raisons;
            }
          } else {
            raisonsFormatted = [];
          }

          return {
            bourseId: s.bourseId,
            titre: s.titre,
            description: s.description,
            domaine: s.domaine,
            niveau: s.niveau,
            pays: s.pays,
            deadline: s.deadline,
            lien: s.lien,
            financement: s.financement,
            score: s.score,
            raisons: raisonsFormatted,
          };
        });

        // Créer nouvelle recommandation
        const created = await req.payload.create({
          collection: 'recommendations',
          data: {
            studentProfile: body.studentProfile,
            scholarships: scholarshipsFormatted,
            scoreMax: body.scoreMax || 0,
            dateGeneration: body.dateGeneration || new Date().toISOString(),
          },
        });

        console.log(`[RECOMMENDATIONS] ✅ Nouvelle recommandation créée avec ${scholarshipsFormatted.length} bourses`);

        return Response.json({
          success: true,
          doc: created,
        });
        
      } catch (error: any) {
        console.error('[RECOMMENDATIONS] ❌ Erreur:', error.message);
        console.error('[RECOMMENDATIONS] Stack:', error.stack);
        return Response.json({
          success: false,
          error: error.message,
        }, { status: 500 });
      }
    },
  },
],
};

export default Recommendations;
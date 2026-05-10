import { NextRequest, NextResponse } from 'next/server';

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
    const { user, bourse, criteria, similarity } = await req.json();

    console.log('📥 DONNÉES REÇUES:');
    console.log('User:', JSON.stringify(user, null, 2));
    console.log('Criteria:', JSON.stringify(criteria, null, 2));
    console.log('Similarity:', similarity);
    if (!user || !bourse || !criteria) {
      return NextResponse.json(
        { error: 'user, bourse et criteria requis' },
        { status: 400, headers }
      );
    }

    // Parser les critères
    let niveaux = [];
    if (typeof criteria.niveau === 'string') {
      niveaux = criteria.niveau.split(',').map((n: string) => n.trim());
    } else if (Array.isArray(criteria.niveau)) {
      niveaux = criteria.niveau;
    }

    let domaines = [];
    if (typeof criteria.domaines === 'string') {
      domaines = criteria.domaines.split(',').map((d: string) => d.trim());
    } else if (Array.isArray(criteria.domaines)) {
      domaines = criteria.domaines;
    }

    const pointsForts = [];
    const pointsFaibles = [];
    let scorePoints = 0; // Points accumulés
    const maxPoints = 100; // Score max

    // 1. VÉRIFIER LA NATIONALITÉ (critère BLOQUANT)
    if (criteria.tunisienEligible === 'non' || criteria.tunisienEligible === false) {
      pointsFaibles.push({
        titre: 'Nationalité',
        description: `❌ Cette bourse n'est pas ouverte aux Tunisiens`,
        emoji: '❌',
      });
      // Score bloqué à 0
      return NextResponse.json(
        {
          success: true,
          scoreGlobal: 0,
          similarity: (similarity || 0).toFixed(2),
          criteresTotal: 6,
          criteresValides: 0,
          pointsForts,
          pointsFaibles,
          planAmelioration: [{
            action: 'Chercher d\'autres bourses',
            details: 'Cette bourse n\'est pas accessible aux Tunisiens',
            timeline: 'N/A',
          }],
          recommendation: 'Non éligible',
        },
        { headers }
      );
    } else {
      pointsForts.push({
        titre: 'Nationalité',
        description: `✅ Les Tunisiens sont éligibles`,
        emoji: '✅',
      });
      scorePoints += 15;
    }

    // 2. VÉRIFIER LE NIVEAU D'ÉTUDES (20 points)
    if (niveaux.length > 0) {
      const niveauMatch = niveaux.some((n: string) =>
        user.formation?.toLowerCase().includes(n.toLowerCase()) ||
        n.toLowerCase().includes(user.formation?.toLowerCase() || '')
      );
      
      if (niveauMatch) {
        pointsForts.push({
          titre: 'Niveau d\'études',
          description: `✅ ${user.formation} correspond aux critères (${niveaux.join(', ')})`,
          emoji: '✅',
        });
        scorePoints += 20;
      } else {
        pointsFaibles.push({
          titre: 'Niveau d\'études',
          description: `⚠️ ${user.formation} ne correspond pas (${niveaux.join(', ')})`,
          emoji: '⚠️',
        });
      }
    }

    // 3. VÉRIFIER LA LANGUE (20 points)
    if (criteria.langue) {
      if (user.hasLanguageTest) {
        pointsForts.push({
          titre: 'Test de langue',
          description: `✅ Vous avez un test de langue (${criteria.langue})`,
          emoji: '✅',
        });
        scorePoints += 20;
      } else {
        pointsFaibles.push({
          titre: 'Test de langue',
          description: `⚠️ Pas de test. ${criteria.langue} requis`,
          emoji: '⚠️',
        });
      }
    }

    // 4. VÉRIFIER LES DOMAINES (20 points)
    if (domaines.length > 0) {
      const domaineMatch = domaines.some((d: string) =>
        user.formation?.toLowerCase().includes(d.toLowerCase()) ||
        d.toLowerCase().includes(user.formation?.toLowerCase() || '')
      );
      
      if (domaineMatch) {
        pointsForts.push({
          titre: 'Domaine d\'études',
          description: `✅ Votre domaine correspond aux domaines acceptés`,
          emoji: '✅',
        });
        scorePoints += 20;
      } else {
        pointsFaibles.push({
          titre: 'Domaine d\'études',
          description: `⚠️ Domaine ne correspond pas`,
          emoji: '⚠️',
        });
      }
    }

    // 5. VÉRIFIER LE GPA (15 points)
    if (user.gpa) {
      if (user.gpa >= 3.0) {
        pointsForts.push({
          titre: 'GPA/Notes',
          description: `✅ GPA ${user.gpa} satisfaisant`,
          emoji: '✅',
        });
        scorePoints += 15;
      } else {
        pointsFaibles.push({
          titre: 'GPA/Notes',
          description: `⚠️ GPA ${user.gpa} < 3.0`,
          emoji: '⚠️',
        });
      }
    }

    // 6. VÉRIFIER L'EXPÉRIENCE (10 points)
    const experienceMonths = user.experienceMonths || 0;
    if (experienceMonths >= 24) {
      pointsForts.push({
        titre: 'Expérience professionnelle',
        description: `✅ ${Math.floor(experienceMonths / 12)} ans d'expérience`,
        emoji: '✅',
      });
      scorePoints += 10;
    } else if (experienceMonths > 0) {
      pointsFaibles.push({
        titre: 'Expérience professionnelle',
        description: `⚠️ ${experienceMonths} mois (2+ ans recommandés)`,
        emoji: '⚠️',
      });
      scorePoints += 5; // Points partiels
    } else {
      pointsFaibles.push({
        titre: 'Expérience professionnelle',
        description: `⚠️ Pas d'expérience documentée`,
        emoji: '⚠️',
      });
    }

    // Bonus similarité sémantique (+10 points si bon match)
    if (similarity > 0.5) {
      scorePoints += 10;
      pointsForts.push({
        titre: 'Adéquation sémantique',
        description: `✅ Votre profil s'aligne bien avec cette bourse (${(similarity * 100).toFixed(0)}%)`,
        emoji: '✅',
      });
    }

    // Plan d'amélioration
    const planAmelioration = pointsFaibles.map((faible) => {
      const timeline = {
        'Niveau d\'études': '1-2 ans',
        'Test de langue': '2-3 mois',
        'Domaine d\'études': '6-12 mois',
        'GPA/Notes': '1-2 ans',
        'Expérience professionnelle': `${Math.max(0, 24 - experienceMonths)} mois`,
      };

      return {
        action: `Améliorer: ${faible.titre}`,
        details: faible.description.replace(/^⚠️ /, ''),
        timeline: timeline[faible.titre as keyof typeof timeline] || 'Variable',
      };
    });

    const scoreGlobal = Math.min(100, scorePoints);

    return NextResponse.json(
      {
        success: true,
        scoreGlobal,
        similarity: (similarity || 0).toFixed(2),
        criteresTotal: 6,
        criteresValides: pointsForts.length,
        pointsForts,
        pointsFaibles,
        planAmelioration,
        recommendation:
          scoreGlobal >= 85
            ? '🏆 Match Parfait! Postulez immédiatement!'
            : scoreGlobal >= 70
            ? '⭐ Excellent! Vous êtes un bon candidat'
            : scoreGlobal >= 50
            ? '👍 Bon profil, postulez'
            : scoreGlobal >= 30
            ? '⚠️ Profil faible, améliorez-vous'
            : '❌ Non adapté',
      },
      { headers }
    );
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500, headers }
    );
  }
}
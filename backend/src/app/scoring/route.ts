export const POST = async (request: Request) => {
  try {
    const body = await request.json()
    const { userId, bourseId } = body

    console.log('✅ POST /scoring called', { userId, bourseId })

    if (!userId || !bourseId) {
      return Response.json(
        { error: 'userId et bourseId requis' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }

    const n8nResponse = await fetch(
      'http://localhost:5678/webhook/match-scoring',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bourseId }),
      }
    )

    if (!n8nResponse.ok) {
      console.error('❌ n8n error:', n8nResponse.statusText)
      return Response.json(
        { error: 'Erreur lors du calcul du score' },
        { 
          status: n8nResponse.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }

    // ✅ FIX: Vérifier que la réponse n8n n'est pas vide
    const text = await n8nResponse.text()
    console.log('📦 n8n raw response:', text)

    if (!text || text.trim() === '') {
      console.error('❌ n8n returned empty response')
      return Response.json(
        { 
          error: 'n8n returned empty response',
          // Retourner un score par défaut
          matchScore: 0,
          hasLanguageTest: false,
          breakdown: {
            eligibility: 0,
            experience: 0,
            certifications: 0,
            bonus: 0,
          },
          matchReasons: ['Erreur du calcul - score par défaut'],
        },
        { status: 200 }
      )
    }

    // ✅ Parser le JSON avec gestion d'erreur
    let scoreData
    try {
      scoreData = JSON.parse(text)
    } catch (parseErr) {
      console.error('❌ Failed to parse n8n response:', parseErr, 'text:', text)
      return Response.json(
        { 
          error: 'Invalid JSON from n8n',
          matchScore: 0,
          hasLanguageTest: false,
          breakdown: {
            eligibility: 0,
            experience: 0,
            certifications: 0,
            bonus: 0,
          },
          matchReasons: ['Erreur du calcul - score par défaut'],
        },
        { status: 200 }
      )
    }

    // ✅ Valider la structure de scoreData
    if (!scoreData || scoreData.matchScore === undefined) {
      console.error('❌ Invalid score data structure:', scoreData)
      return Response.json(
        { 
          error: 'Invalid score data',
          matchScore: 0,
          hasLanguageTest: false,
          breakdown: {
            eligibility: 0,
            experience: 0,
            certifications: 0,
            bonus: 0,
          },
          matchReasons: ['Erreur du calcul - score par défaut'],
        },
        { status: 200 }
      )
    }

    console.log('✅ Score calculated:', scoreData.matchScore)

    return Response.json(scoreData, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('❌ Scoring error:', error)
    return Response.json(
      { 
        error: error instanceof Error ? error.message : 'Erreur serveur',
        matchScore: 0,
        hasLanguageTest: false,
        breakdown: {
          eligibility: 0,
          experience: 0,
          certifications: 0,
          bonus: 0,
        },
        matchReasons: ['Erreur du calcul - score par défaut'],
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
  
}
export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cosineSimilarity } from '@/utils/similarity'

// ⚠️ IMPORTANT: Cache global pour le modèle
let embeddingModel: any = null

async function getEmbeddingModel() {
  if (!embeddingModel) {
    console.log('🔄 Loading Xenova model for recommendations...')
    const { pipeline } = await import('@xenova/transformers')
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    )
    console.log('✅ Xenova model ready')
  }
  return embeddingModel
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = await getEmbeddingModel()
    const result = await model(text, {
      pooling: 'mean',
      normalize: true,
    })
    return Array.from(result.data)
  } catch (error) {
    console.error('❌ Embedding error:', error)
    // Fallback: vecteur aléatoire (ça ne devrait jamais arriver)
    return Array.from({ length: 384 }, () => Math.random())
  }
}

export const POST = async (request: NextRequest) => {
  try {
    console.log('📍 POST /api/recommendations')
    
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    // ✅ Récupère l'user
    console.log('🔄 Fetching user:', userId)
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 3,
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ User found:', user.email)

    // ✅ Crée le texte du profil
    const profileText = `
      Domaine d'études: ${user.domaine || 'Non spécifié'}
      Niveau d'études: ${user.niveau || 'Non spécifié'}
      Pays d'intérêt: ${(user as any).paysCibles?.join(', ') || 'Tous'}
      Expériences professionnelles: ${user.workExperience?.map((e: any) => e.position || '').filter(Boolean).join(', ') || 'Aucune'}
      Langues parlées: ${user.languages?.join(', ') || 'Non spécifiées'}
      GPA ou moyenne: ${user.gpa || 'Non spécifié'}
      Certifications: ${user.certifications?.join(', ') || 'Aucune'}
    `.trim()

    console.log('🔄 Generating user embedding...')
    const userEmbedding = await generateEmbedding(profileText)
    console.log('✅ User embedding:', userEmbedding.length, 'dims')

    // ✅ Récupère les bourses
    console.log('🔄 Fetching scholarships...')
    const bourses = await payload.find({
      collection: 'bourses',
      limit: 500,
      where: { statut: { equals: 'active' } },
    })

    console.log('📚 Found', bourses.docs.length, 'scholarships')

    // ✅ Génère embeddings et calcule similarité
    console.log('🔄 Generating scholarship embeddings and calculating similarities...')
    const scores = await Promise.all(
      bourses.docs.slice(0, 100).map(async (bourse: any, idx: number) => {
        if (idx % 10 === 0) console.log(`  Processing: ${idx}/${Math.min(100, bourses.docs.length)}`)

        const bourseText = `
          Nom de la bourse: ${bourse.nom}
          Pays: ${bourse.pays || 'Non spécifié'}
          Domaine d'études: ${bourse.domaine || 'Non spécifié'}
          Niveau requis: ${bourse.niveau || 'Tous niveaux'}
          Type de financement: ${bourse.financement || 'Non spécifié'}
          Description: ${bourse.description || ''}
          Critères d'éligibilité: ${bourse.eligibiliteCriteria?.join(', ') || 'Non spécifiés'}
        `.trim()

        const bourseEmbedding = await generateEmbedding(bourseText)
        const similarity = cosineSimilarity(userEmbedding, bourseEmbedding)
        
        // Raisons du match basées sur le profil
        const matchReasons: string[] = []
        
        if (similarity >= 0.7) {
          matchReasons.push(`Correspondance très forte: ${Math.round(similarity * 100)}%`)
        } else if (similarity >= 0.5) {
          matchReasons.push(`Bonne correspondance sémantique: ${Math.round(similarity * 100)}%`)
        }

        if (bourse.domaine && user.domaine?.toLowerCase().includes(bourse.domaine.toLowerCase())) {
          matchReasons.push(`📚 Domaine correspondant: ${bourse.domaine}`)
        }

        if (bourse.niveau && user.niveau?.toLowerCase().includes(bourse.niveau.toLowerCase())) {
          matchReasons.push(`🎓 Niveau requis: ${bourse.niveau}`)
        }

        if (bourse.pays && (user as any).paysCibles?.includes(bourse.pays)) {
          matchReasons.push(`📍 Pays d'intérêt: ${bourse.pays}`)
        }

        if (bourse.financement) {
          matchReasons.push(`💰 Financement: ${bourse.financement}`)
        }

        return {
          bourseId: bourse.id,
          bourseNom: bourse.nom,
          bourse,
          similarity: Math.round(similarity * 100),
          matchReasons: matchReasons.slice(0, 3), // Top 3 raisons
        }
      })
    )

    // ✅ Trie et filtre
    const recommendations = scores
      .filter(s => s.similarity >= 30)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)

    console.log('✅ Recommendations ready:', recommendations.length)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

export const OPTIONS = async () => new Response(null, {
  status: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
})
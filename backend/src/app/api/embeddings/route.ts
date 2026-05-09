import { NextRequest, NextResponse } from 'next/server'

// ⚠️ IMPORTANT: Xenova s'initialise au premier appel
let embeddingModel: any = null

async function getEmbeddingModel() {
  if (!embeddingModel) {
    console.log('🔄 Loading Xenova embedding model...')
    const { pipeline } = await import('@xenova/transformers')
    
    // all-MiniLM-L6-v2 = 384 dimensions, très rapide
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    )
    console.log('✅ Xenova model loaded')
  }
  return embeddingModel
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = await getEmbeddingModel()
    
    // Génère l'embedding
    const result = await model(text, {
      pooling: 'mean',
      normalize: true,
    })

    // Convertit en array JavaScript
    return Array.from(result.data)
  } catch (error) {
    console.error('❌ Embedding error:', error)
    throw error
  }
}

export const POST = async (request: NextRequest) => {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }

    console.log('🔄 Generating embedding for:', text.substring(0, 50) + '...')
    
    const embedding = await generateEmbedding(text)

    console.log('✅ Embedding generated:', embedding.length, 'dimensions')

    return NextResponse.json({
      embedding,
      dimensions: embedding.length,
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
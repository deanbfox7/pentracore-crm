import { NextResponse } from 'next/server'
import { reviewDocumentCompliance } from '@/lib/pentracore/document-review'

export async function POST(req: Request) {
  try {
    const { document_text, documentText, document_type, documentType } = (await req.json()) as {
      document_text?: string
      documentText?: string
      document_type?: string
      documentType?: string
    }

    const text = document_text || documentText || ''
    const type = document_type || documentType || ''

    if (!text.trim()) {
      return NextResponse.json({ error: 'document text required' }, { status: 400 })
    }

    if (!type.trim()) {
      return NextResponse.json({ error: 'document_type required' }, { status: 400 })
    }

    const result = await reviewDocumentCompliance(text, type)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Document review failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

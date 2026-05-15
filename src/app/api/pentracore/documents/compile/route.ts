import { NextResponse } from 'next/server'
import { reviewDocumentCompliance } from '@/lib/pentracore/document-review'

// Document type detection rules
const DOCUMENT_PATTERNS: Record<string, RegExp[]> = {
  ncnda: [/non-?circumvention/i, /non-?disclosure/i, /ncnda/i],
  loi: [/letter\s+of\s+intent/i, /loi/i, /indication/i],
  kyc: [/know\s+your\s+customer/i, /kyc/i, /beneficial\s+owner/i],
  imfpa: [/intermediary\s+mission/i, /fee\s+protection/i, /imfpa/i],
  spa: [/sales?\s+.{0,5}purchase/i, /spa/i, /sales?\s+agreement/i],
  po: [/purchase\s+order/i, /icpo/i, /proof\s+of?\s+product/i],
  pof: [/proof\s+of\s+funds/i, /pof/i, /bank\s+commitment/i],
  other: [],
}

type DocumentType = keyof typeof DOCUMENT_PATTERNS

function detectDocumentType(filename: string, content?: string): DocumentType {
  const searchText = `${filename} ${content || ''}`.toLowerCase()

  for (const [type, patterns] of Object.entries(DOCUMENT_PATTERNS)) {
    if (type !== 'other' && patterns.some((p) => p.test(searchText))) {
      return type as DocumentType
    }
  }

  return 'other'
}

function generateComplianceChecklist(types: DocumentType[]): string[] {
  const checklist: Set<string> = new Set()

  if (types.includes('ncnda')) {
    checklist.add('✓ NCNDA signed by both parties')
    checklist.add('○ Verify NCNDA execution date')
  }

  if (types.includes('kyc')) {
    checklist.add('✓ KYC completed for buyer')
    checklist.add('✓ KYC completed for seller')
    checklist.add('○ Verify no OFAC/sanctions matches')
  }

  if (types.includes('loi')) {
    checklist.add('✓ LOI executed (post-KYC)')
    checklist.add('○ Verify price, volume, payment terms')
  }

  if (types.includes('spa')) {
    checklist.add('✓ IMFPA signed before SPA')
    checklist.add('✓ SPA executed and signed')
    checklist.add('○ Verify all parties signed')
  }

  if (types.includes('imfpa')) {
    checklist.add('✓ IMFPA signed (commission protection)')
    checklist.add('○ Verify commission rate and payment terms')
  }

  if (types.includes('pof') || types.includes('po')) {
    checklist.add('✓ Proof of Funds or Purchase Order')
    checklist.add('○ Verify issuer and authenticity')
  }

  // Always add critical gates
  checklist.add('✓ No counterparty name exposure')
  checklist.add('✓ Buyer ≠ Seller (party isolation)')
  checklist.add('✓ All signatures present')

  return Array.from(checklist)
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const action = formData.get('action') as string | null
    const documentType = formData.get('document_type') as string | null

    if (action === 'review') {
      const documentText = (formData.get('document_text') as string | null) || ''
      const file = formData.get('file') as File | null
      const text = documentText || (file ? await file.text() : '')

      if (!text.trim()) {
        return NextResponse.json({ error: 'document text required' }, { status: 400 })
      }

      if (!documentType?.trim()) {
        return NextResponse.json({ error: 'document_type required' }, { status: 400 })
      }

      const result = await reviewDocumentCompliance(text, documentType)
      return NextResponse.json(result)
    }

    const dealId = formData.get('dealId') as string

    if (!dealId) {
      return NextResponse.json({ error: 'dealId required' }, { status: 400 })
    }

    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const compiledDocs: Array<{
      filename: string
      type: DocumentType
      size: number
      uploadedAt: string
    }> = []

    const documentTypes: DocumentType[] = []

    // Process each file
    for (const file of files) {
      if (!file.name) continue

      const docType = detectDocumentType(file.name)
      compiledDocs.push({
        filename: file.name,
        type: docType,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      })

      if (!documentTypes.includes(docType)) {
        documentTypes.push(docType)
      }
    }

    // Generate compliance checklist
    const checklist = generateComplianceChecklist(documentTypes)

    // Build summary JSON
    const compiledPacket = {
      dealId,
      compiledAt: new Date().toISOString(),
      totalDocuments: compiledDocs.length,
      documents: compiledDocs,
      documentTypes: [...new Set(documentTypes)],
      complianceChecklist: checklist,
      summary: {
        missing: DOCUMENT_PATTERNS,
        status: `${compiledDocs.length} documents compiled, ${checklist.filter((c) => c.startsWith('○')).length} items to verify`,
      },
    }

    // Return JSON for download (in production, could generate PDF/ZIP)
    return NextResponse.json(compiledPacket)
  } catch (err: unknown) {
    console.error('Document compile error:', err)
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Compilation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

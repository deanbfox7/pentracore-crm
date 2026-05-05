import { NextRequest, NextResponse } from 'next/server'
import { buildDealDocumentContent, DealDocumentType } from '@/lib/deal-documents'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDeanRequest } from '@/lib/server-auth'

type RouteContext = {
  params: {
    dealId: string
  }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)

    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .select('id, document_type, status, generated_at, created_at')
      .eq('deal_id', params.dealId)
      .order('generated_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

const GENERATABLE_TYPES: DealDocumentType[] = ['loi', 'ncnda', 'kyc']

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)
    const body = await req.json()
    const documentType = String(body.document_type || '').toLowerCase() as DealDocumentType

    if (!GENERATABLE_TYPES.includes(documentType)) {
      return NextResponse.json({ error: 'Unsupported document type' }, { status: 400 })
    }

    const { data: deal, error: dealError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deals')
      .select('*, deal_documents(*)')
      .eq('id', params.dealId)
      .single()

    if (dealError) throw dealError

    const existingDocuments = Array.isArray(deal.deal_documents) ? deal.deal_documents : []
    const hasNcnda = existingDocuments.some((document: any) => document.document_type === 'ncnda')

    if (documentType === 'loi' && !hasNcnda) {
      return NextResponse.json({ error: 'NCNDA must be generated before LOI' }, { status: 400 })
    }

    const content = buildDealDocumentContent(documentType, deal)

    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .insert([
        {
          deal_id: Number(params.dealId),
          document_type: documentType,
          status: 'draft',
          generated_at: new Date().toISOString(),
          content,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message?.includes('Forbidden') ? 403 : 401 })
  }
}

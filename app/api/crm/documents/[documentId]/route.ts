import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDeanRequest } from '@/lib/server-auth'

type RouteContext = {
  params: {
    documentId: string
  }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)

    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .select('id, deal_id, document_type, status, content, generated_at')
      .eq('id', params.documentId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)

    const body = await req.json()
    const newStatus = body.status?.toLowerCase()

    const validStatuses = ['draft', 'internal_review', 'approved', 'sent', 'signed', 'rejected']
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .update({ status: newStatus })
      .eq('id', params.documentId)
      .select('id, deal_id, document_type, status, generated_at, created_at')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Document not found or update failed' }, { status: 404 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

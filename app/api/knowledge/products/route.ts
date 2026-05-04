import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyKnowledgeRequest } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  try {
    await verifyKnowledgeRequest(req)

    const { data, error } = await supabaseAdmin
      .schema('pentracore_knowledge')
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Unable to load protected knowledge data' }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unauthorized'
    const status = message === 'No auth token' || message === 'Invalid token' ? 401 : 500
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}

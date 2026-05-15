import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('shareholders')
      .select('id, name, email, role, portfolio_deal_ids')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Shareholder not found' }, { status: 404 })
    }

    return NextResponse.json({ shareholder: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Shareholder lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

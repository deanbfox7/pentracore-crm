import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string }
    const normalizedEmail = email?.trim().toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('shareholders')
      .select('id, name, email, role')
      .ilike('email', normalizedEmail)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'No shareholder found' }, { status: 404 })
    }

    return NextResponse.json({ shareholder: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDeanRequest } from '@/lib/server-auth'

export async function GET(req: NextRequest) {
  try {
    await verifyDeanRequest(req)

    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('counterparties')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyDeanRequest(req)

    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('counterparties')
      .insert([{
        ...body,
        kyc_status: body.kyc_status || 'pending'
      }])
      .select()

    if (error) throw error
    return NextResponse.json(data[0], { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

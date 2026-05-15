import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const data = await req.formData()
  const from = data.get('From') as string
  const body = data.get('Body') as string

  const supabase = await createServiceClient()

  const { data: lead } = await supabase.from('leads').select('id').eq('phone', from).single()
  if (lead) {
    await supabase.from('activities').insert({
      lead_id: lead.id, type: 'sms_replied',
      body: body?.substring(0, 500),
      metadata: { from, direction: 'inbound' }
    })
    await supabase.from('campaign_enrollments').update({ status: 'replied' }).eq('lead_id', lead.id).eq('status', 'active')
  }

  return new NextResponse('<?xml version="1.0"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' }
  })
}

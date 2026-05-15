import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Twilio from 'twilio'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, body } = await req.json()

  const { data: lead } = await supabase.from('leads').select('*').eq('id', lead_id).single()
  if (!lead?.phone) return NextResponse.json({ error: 'Lead has no phone number' }, { status: 400 })

  const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: lead.phone,
    })

    await supabase.from('activities').insert({
      lead_id, user_id: user.id, type: 'sms_sent',
      body: body.substring(0, 500),
      metadata: { twilio_sid: message.sid, to: lead.phone }
    })

    return NextResponse.json({ success: true, sid: message.sid })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/services/sendgrid'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, subject, body, template_id } = await req.json()

  const { data: lead } = await supabase.from('leads').select('*').eq('id', lead_id).single()
  if (!lead?.email) return NextResponse.json({ error: 'Lead has no email' }, { status: 400 })

  try {
    const messageId = await sendEmail({
      to: lead.email,
      subject,
      html: body.replace(/\n/g, '<br/>'),
      text: body,
    })

    await supabase.from('activities').insert({
      lead_id, user_id: user.id,
      type: 'email_sent',
      subject,
      body: body.substring(0, 500),
      metadata: { resend_message_id: messageId, template_id }
    })

    return NextResponse.json({ success: true, message_id: messageId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

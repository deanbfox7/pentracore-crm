import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import sgMail from '@sendgrid/mail'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lead_id, subject, body, template_id } = await req.json()

  const { data: lead } = await supabase.from('leads').select('*').eq('id', lead_id).single()
  if (!lead?.email) return NextResponse.json({ error: 'Lead has no email' }, { status: 400 })

  sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

  try {
    const msg = {
      to: lead.email,
      from: { email: process.env.SENDGRID_FROM_EMAIL!, name: process.env.SENDGRID_FROM_NAME || 'Pentracore International' },
      subject,
      html: body.replace(/\n/g, '<br/>'),
      text: body,
      customArgs: { lead_id, user_id: user.id },
      trackingSettings: { clickTracking: { enable: true }, openTracking: { enable: true } },
    }

    const [response] = await sgMail.send(msg)
    const messageId = response.headers['x-message-id'] || ''

    await supabase.from('activities').insert({
      lead_id, user_id: user.id,
      type: 'email_sent',
      subject,
      body: body.substring(0, 500),
      metadata: { sendgrid_message_id: messageId, template_id }
    })

    return NextResponse.json({ success: true, message_id: messageId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

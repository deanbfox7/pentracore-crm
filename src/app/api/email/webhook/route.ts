import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const events = await req.json()
  const supabase = await createServiceClient()

  for (const event of events) {
    const leadId = event.lead_id || event.customArgs?.lead_id
    if (!leadId) continue

    if (event.event === 'open') {
      await supabase.from('activities').insert({ lead_id: leadId, type: 'email_opened', subject: 'Email opened', metadata: { email: event.email } })
    } else if (event.event === 'click') {
      await supabase.from('activities').insert({ lead_id: leadId, type: 'email_clicked', subject: 'Email link clicked', metadata: { url: event.url } })
    } else if (event.event === 'bounce' || event.event === 'blocked') {
      await supabase.from('activities').insert({ lead_id: leadId, type: 'email_bounced', subject: 'Email bounced', metadata: { reason: event.reason } })
      await supabase.from('campaign_enrollments').update({ status: 'bounced' }).eq('lead_id', leadId).eq('status', 'active')
    }
  }

  return NextResponse.json({ received: true })
}

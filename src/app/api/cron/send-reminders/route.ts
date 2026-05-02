import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/services/sendgrid'
import Twilio from 'twilio'

export async function GET() {
  const supabase = await createServiceClient()
  const now = new Date()

  // Find appointments due for reminders (24h and 1h before)
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)
  const in65min = new Date(now.getTime() + 65 * 60 * 1000)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, lead:leads(*)')
    .eq('status', 'scheduled')
    .eq('reminder_sent', false)
    .or(`start_time.gte.${in1h.toISOString()},start_time.lte.${in65min.toISOString()},start_time.gte.${in24h.toISOString()},start_time.lte.${in25h.toISOString()}`)

  if (!appointments?.length) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const apt of appointments) {
    const lead = apt.lead as Record<string, any>
    if (!lead?.email) continue

    const startTime = new Date(apt.start_time).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
    const body = `Hi ${lead.first_name},\n\nThis is a reminder for your upcoming meeting: "${apt.title}" on ${startTime}.\n\n${apt.meeting_link ? `Join here: ${apt.meeting_link}\n\n` : ''}${apt.notes ? `Notes: ${apt.notes}\n\n` : ''}Best regards,\nPentracore International`

    try {
      await sendEmail({
        to: lead.email,
        subject: `Reminder: ${apt.title}`,
        html: body.replace(/\n/g, '<br/>'),
        text: body,
      })
      await supabase.from('appointments').update({ reminder_sent: true }).eq('id', apt.id)
      sent++
    } catch {}
  }

  return NextResponse.json({ sent })
}

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/services/sendgrid'
import Twilio from 'twilio'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function interpolate(template: string, lead: Record<string, any>): string {
  return template
    .replace(/\{\{first_name\}\}/g, lead.first_name || '')
    .replace(/\{\{last_name\}\}/g, lead.last_name || '')
    .replace(/\{\{company_name\}\}/g, lead.company_name || '')
    .replace(/\{\{country\}\}/g, lead.country || '')
    .replace(/\{\{commodity\}\}/g, (lead.commodities_of_interest || [])[0] || 'minerals')
    .replace(/\{\{industry\}\}/g, lead.industry || 'your industry')
}

export async function GET() {
  const supabase = await createServiceClient()

  const { data: enrollments } = await supabase
    .from('campaign_enrollments')
    .select(`*, campaign:campaigns(id, name), lead:leads(*)`)
    .eq('status', 'active')
    .lte('next_step_at', new Date().toISOString())
    .limit(50)

  if (!enrollments?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const enrollment of enrollments) {
    const lead = enrollment.lead as Record<string, any>
    const nextStepOrder = enrollment.current_step + 1

    const { data: step } = await supabase
      .from('campaign_steps')
      .select('*')
      .eq('campaign_id', enrollment.campaign_id)
      .eq('step_order', nextStepOrder)
      .single()

    if (!step) {
      await supabase.from('campaign_enrollments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', enrollment.id)
      continue
    }

    let subject = interpolate(step.subject_template || '', lead)
    let body = interpolate(step.body_template, lead)

    if (step.use_ai_personalization && lead.email) {
      try {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `Personalize this sales email for ${lead.first_name} at ${lead.company_name} (${lead.industry}, ${lead.country}). Keep same structure, under 150 words.\n\nSubject: ${subject}\n\nBody: ${body}\n\nReturn JSON: {"subject": "...", "body": "..."}` }],
          response_format: { type: 'json_object' }, max_tokens: 300,
        })
        const result = JSON.parse(resp.choices[0].message.content || '{}')
        if (result.subject) subject = result.subject
        if (result.body) body = result.body
      } catch {}
    }

    try {
      if (step.channel === 'email' && lead.email) {
        await sendEmail({
          to: lead.email,
          subject,
          html: body.replace(/\n/g, '<br/>'),
          text: body,
        })
        await supabase.from('activities').insert({ lead_id: lead.id, type: 'email_sent', subject, body: body.substring(0, 500), metadata: { campaign_id: enrollment.campaign_id, step_order: step.step_order } })
      } else if (step.channel === 'sms' && lead.phone) {
        const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        const msg = await client.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER!, to: lead.phone })
        await supabase.from('activities').insert({ lead_id: lead.id, type: 'sms_sent', body: body.substring(0, 500), metadata: { twilio_sid: msg.sid, campaign_id: enrollment.campaign_id } })
      }

      const { data: nextStep } = await supabase.from('campaign_steps').select('*').eq('campaign_id', enrollment.campaign_id).eq('step_order', nextStepOrder + 1).single()
      const nextStepAt = nextStep ? new Date(Date.now() + (nextStep.delay_days * 86400000) + (nextStep.delay_hours * 3600000)).toISOString() : null

      await supabase.from('campaign_enrollments').update({
        current_step: nextStepOrder,
        last_step_at: new Date().toISOString(),
        next_step_at: nextStepAt,
        status: nextStepAt ? 'active' : 'completed',
        completed_at: nextStepAt ? null : new Date().toISOString(),
      }).eq('id', enrollment.id)

      processed++
    } catch {}
  }

  return NextResponse.json({ processed })
}

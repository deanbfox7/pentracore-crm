import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createCachedChatCompletion } from '@/lib/ai/claude'
import { sendEmail } from '@/lib/services/sendgrid'
import { sendWhatsAppMessage, sendSMSMessage } from '@/lib/services/twilio'

const SALES_PROMPT = `You are Dean Fox, PentraCore International's lead broker. Generate a brief, professional outreach message for a mineral trade prospect. NEVER promise pricing, allocation, or timeline. Always mention NCNDA requirement. Keep it under 150 words. End with clear next step: email reply or phone call.

Prospect commodity: {commodity}
Prospect volume: {volume}
Prospect role: {role}
Contact: {contact}`

export async function POST(req: Request) {
  try {
    const { lead_id, channel = 'email' } = (await req.json()) as {
      lead_id: string
      channel?: 'email' | 'whatsapp' | 'sms'
    }

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id required' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Generate personalized message
    const prompt = SALES_PROMPT.replace('{commodity}', lead.commodity_type || 'unknown')
      .replace('{volume}', lead.volume || 'TBD')
      .replace('{role}', lead.role || 'buyer/seller')
      .replace('{contact}', lead.contact_info || 'contact info pending')

    const message = await createCachedChatCompletion({
      system: prompt,
      messages: [
        {
          role: 'user',
          content: `Generate outreach message for ${lead.commodity_type} deal.`,
        },
      ],
      maxTokens: 200,
    })

    // Send via channel
    let sent = false
    let sentTo = ''

    if (channel === 'email' && lead.contact_info?.includes('@')) {
      await sendEmail({
        to: lead.contact_info,
        subject: `${lead.commodity_type} Opportunity - PentraCore International`,
        html: `<p>${message}</p><p>Best regards,<br/>Dean Fox<br/>PentraCore International</p>`,
      })
      sent = true
      sentTo = lead.contact_info
    } else if (channel === 'whatsapp' && lead.contact_info?.includes('+')) {
      await sendWhatsAppMessage({
        to: lead.contact_info,
        body: message,
      })
      sent = true
      sentTo = lead.contact_info
    } else if (channel === 'sms' && lead.contact_info?.match(/^\d+/)) {
      await sendSMSMessage({
        to: lead.contact_info,
        body: message,
      })
      sent = true
      sentTo = lead.contact_info
    }

    // Log outreach
    if (sent) {
      await supabase.from('outreach_history').insert({
        lead_id,
        channel,
        message,
        sent_to: sentTo,
        sent_at: new Date().toISOString(),
      })

      // Update lead status
      await supabase
        .from('crm_leads')
        .update({ status: 'outreach_sent', updated_at: new Date().toISOString() })
        .eq('id', lead_id)
    }

    return NextResponse.json({ success: sent, message, channel, sentTo })
  } catch (err: unknown) {
    console.error('Sales outreach error:', err)
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Outreach failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

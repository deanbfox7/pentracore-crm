import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createCachedChatCompletion } from '@/lib/ai/claude'
import { initiateOutboundCall } from '@/lib/services/twilio'

const FOLLOWUP_PROMPT = `You are Dean Fox calling ${name} about their ${commodity} opportunity. Be warm, professional, direct. This is a follow-up to their inbound lead.

Current info:
- Commodity: ${commodity}
- Volume: ${volume}
- Origin: ${origin}
- Role: ${role}

Objective: Confirm interest, answer initial questions, schedule next step (video call or email docs). Keep it under 2 min call length.`

export async function POST(req: Request) {
  try {
    const { lead_id } = (await req.json()) as { lead_id: string }

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

    // Generate call script
    const callScript = await createCachedChatCompletion({
      system: FOLLOWUP_PROMPT.replace('${name}', lead.contact_info || 'there')
        .replace('${commodity}', lead.commodity_type || 'mineral')
        .replace('${volume}', lead.volume || 'TBD')
        .replace('${origin}', lead.country_of_origin || 'TBD')
        .replace('${role}', lead.role || 'buyer'),
      messages: [
        {
          role: 'user',
          content: `Generate a 2-minute call opening script for Dean to follow up on this lead.`,
        },
      ],
      maxTokens: 250,
    })

    // Initiate outbound call (Twilio)
    if (!lead.contact_info?.match(/^\+?\d+/)) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 })
    }

    const callSid = await initiateOutboundCall({
      to: lead.contact_info,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      script: callScript,
    })

    // Log outbound call
    await supabase.from('voice_sessions').insert({
      call_sid: callSid,
      from_phone: process.env.TWILIO_PHONE_NUMBER || '',
      to_phone: lead.contact_info,
      lead_id,
      stage: 'outbound_initiated',
      data: { script: callScript },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, callSid, script: callScript })
  } catch (err: unknown) {
    console.error('Voice outbound error:', err)
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Outbound call failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

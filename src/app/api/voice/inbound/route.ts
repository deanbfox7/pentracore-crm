import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Voice bot stages for inbound qualification
const VOICE_STAGES = {
  welcome: 'Thanks for calling PentraCore International. I\'m Dean\'s trading assistant. I\'ll help qualify your mineral opportunity. Let\'s start: what commodity are you interested in? Chrome, gold, copper, or other?',
  commodity: 'And approximately how many metric tons are you looking for?',
  volume: 'What country is the origin?',
  origin: 'Are you a buyer or seller?',
  role: 'What\'s your timeline? ASAP, next month, or next quarter?',
  timeline: 'Perfect. What\'s the best phone number to reach you?',
  phone: 'Excellent. Dean will call you within 24 hours to discuss details. Goodbye!',
}

type VoiceStage = keyof typeof VOICE_STAGES

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const callSid = formData.get('CallSid') as string
    const digitsPressed = formData.get('Digits') as string | null
    const speechResult = formData.get('SpeechResult') as string | null
    const fromPhone = formData.get('From') as string

    if (!callSid || !fromPhone) {
      return NextResponse.json({ error: 'Missing Twilio data' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Get or create voice session
    let session = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('call_sid', callSid)
      .single()

    if (!session.data) {
      await supabase.from('voice_sessions').insert({
        call_sid: callSid,
        from_phone: fromPhone,
        stage: 'welcome',
        data: {},
        created_at: new Date().toISOString(),
      })
      session = await supabase
        .from('voice_sessions')
        .select('*')
        .eq('call_sid', callSid)
        .single()
    }

    const currentSession = session.data

    // Process input and advance stage
    let nextStage: VoiceStage = 'welcome'
    const data = currentSession.data || {}

    if (currentSession.stage === 'welcome') {
      data.commodity = speechResult || 'not_specified'
      nextStage = 'commodity'
    } else if (currentSession.stage === 'commodity') {
      data.volume = speechResult || 'not_specified'
      nextStage = 'volume'
    } else if (currentSession.stage === 'volume') {
      data.origin = speechResult || 'not_specified'
      nextStage = 'origin'
    } else if (currentSession.stage === 'origin') {
      data.role = speechResult || 'not_specified'
      nextStage = 'role'
    } else if (currentSession.stage === 'role') {
      data.timeline = speechResult || 'not_specified'
      nextStage = 'timeline'
    } else if (currentSession.stage === 'timeline') {
      data.phone = speechResult || fromPhone
      nextStage = 'phone'

      // Create lead record
      await supabase.from('crm_leads').insert({
        commodity_type: data.commodity,
        volume: data.volume,
        country_of_origin: data.origin,
        role: data.role,
        contact_info: data.phone,
        source: 'voice_inbound',
        status: 'qualified',
        conversation_history: JSON.stringify({ stage: currentSession.stage, data }),
      })
    }

    // Update session
    await supabase
      .from('voice_sessions')
      .update({
        stage: nextStage,
        data,
        updated_at: new Date().toISOString(),
      })
      .eq('call_sid', callSid)

    // Build TwiML response
    const prompt = VOICE_STAGES[nextStage]

    if (nextStage === 'phone') {
      return NextResponse.json(
        {
          twiml: `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Say voice="alice">${prompt}</Say>
              <Hangup/>
            </Response>`,
        },
        { headers: { 'Content-Type': 'application/xml' } }
      )
    }

    return NextResponse.json(
      {
        twiml: `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Gather input="speech" timeout="8" speechTimeout="auto" language="en-US">
              <Say voice="alice">${prompt}</Say>
            </Gather>
            <Say voice="alice">I did not hear a response. Goodbye.</Say>
            <Hangup/>
          </Response>`,
      },
      { headers: { 'Content-Type': 'application/xml' } }
    )
  } catch (err: unknown) {
    console.error('Voice inbound error:', err)
    const message =
      typeof err === 'object' && err !== null && 'message' in err
        ? (err as { message: string }).message
        : 'Voice call failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

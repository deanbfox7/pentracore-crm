import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromPhone = process.env.TWILIO_PHONE_NUMBER

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

export async function sendWhatsAppMessage({
  to,
  body,
}: {
  to: string
  body: string
}): Promise<string> {
  if (!client) throw new Error('Twilio not configured')

  const message = await client.messages.create({
    from: `whatsapp:${fromPhone}`,
    body,
    to: `whatsapp:${to}`,
  })

  return message.sid
}

export async function sendSMSMessage({
  to,
  body,
}: {
  to: string
  body: string
}): Promise<string> {
  if (!client) throw new Error('Twilio not configured')

  const message = await client.messages.create({
    from: fromPhone,
    body,
    to,
  })

  return message.sid
}

export async function initiateOutboundCall({
  to,
  from,
  script,
}: {
  to: string
  from: string
  script: string
}): Promise<string> {
  if (!client) throw new Error('Twilio not configured')

  const call = await client.calls.create({
    from,
    to,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/outbound-twiml?script=${encodeURIComponent(script)}`,
  })

  return call.sid
}

export async function getCallRecording(callSid: string): Promise<string | null> {
  if (!client) throw new Error('Twilio not configured')

  const recordings = await client.calls(callSid).recordings.list()
  return recordings.length > 0 ? recordings[0].uri : null
}

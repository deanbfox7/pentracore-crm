import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<string> {
  const from = process.env.RESEND_FROM_EMAIL || 'noreply@pentracore.com'

  const response = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  })

  if (response.error) {
    throw new Error(`Email send failed: ${response.error.message}`)
  }

  return response.data?.id || ''
}

export async function sendEmailTemplate({
  to,
  templateId,
  dynamicData,
}: {
  to: string
  templateId: string
  dynamicData: Record<string, string>
}): Promise<string> {
  const from = process.env.RESEND_FROM_EMAIL || 'noreply@pentracore.com'

  let html = templateId
  Object.entries(dynamicData).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })

  const response = await resend.emails.send({
    from,
    to,
    subject: 'PentraCore Update',
    html,
  })

  if (response.error) {
    throw new Error(`Email send failed: ${response.error.message}`)
  }

  return response.data?.id || ''
}

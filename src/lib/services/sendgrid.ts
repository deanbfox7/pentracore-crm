import sgMail from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

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
  const from = process.env.SENDGRID_FROM_EMAIL || 'noreply@pentracore.com'

  const message = {
    to,
    from,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  }

  const response = await sgMail.send(message)
  return response[0].messageId || ''
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
  const from = process.env.SENDGRID_FROM_EMAIL || 'noreply@pentracore.com'

  const message = {
    to,
    from,
    templateId,
    dynamicTemplateData: dynamicData,
  }

  const response = await sgMail.send(message)
  return response[0].messageId || ''
}

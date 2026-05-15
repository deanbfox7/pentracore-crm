import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not configured in environment variables')
}

export const resendClient = new Resend(RESEND_API_KEY)

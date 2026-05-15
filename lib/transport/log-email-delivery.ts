import { SupabaseClient } from '@supabase/supabase-js'

export interface DeliveryLogEntry {
  deal_id: number
  document_id: number
  document_type: string
  recipient_email: string
  recipient_type: string
  status: 'sent' | 'failed'
  error_message?: string | null
  resend_message_id?: string | null
  sent_at?: string | null
}

export async function logEmailDelivery(
  supabaseAdmin: SupabaseClient,
  entry: DeliveryLogEntry
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .schema('dean_crm')
      .from('email_delivery_log')
      .insert({
        deal_id: entry.deal_id,
        document_id: entry.document_id,
        document_type: entry.document_type,
        recipient_email: entry.recipient_email,
        recipient_type: entry.recipient_type,
        status: entry.status,
        error_message: entry.error_message || null,
        resend_message_id: entry.resend_message_id || null,
        sent_at: entry.sent_at || null
      })

    if (error) {
      console.error('Failed to log delivery:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Failed to log delivery:', err)
    return {
      success: false,
      error: err.message || 'Unknown error logging delivery'
    }
  }
}

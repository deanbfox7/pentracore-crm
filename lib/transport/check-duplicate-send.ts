import { SupabaseClient } from '@supabase/supabase-js'

export interface PreviousSend {
  sent_at: string
  resend_message_id: string | null
}

export interface DuplicateSendCheckResult {
  isDuplicate: boolean
  previousSend?: PreviousSend
  error?: string
}

export async function checkDuplicateSend(
  supabaseAdmin: SupabaseClient,
  dealId: number,
  documentId: number,
  recipientEmail: string,
  documentType: string
): Promise<DuplicateSendCheckResult> {
  try {
    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('email_delivery_log')
      .select('sent_at, resend_message_id')
      .eq('deal_id', dealId)
      .eq('document_id', documentId)
      .eq('recipient_email', recipientEmail)
      .eq('document_type', documentType)
      .eq('status', 'sent')
      .maybeSingle()

    if (error) {
      return {
        isDuplicate: false,
        error: `Failed to check delivery history: ${error.message}`
      }
    }

    if (data) {
      return {
        isDuplicate: true,
        previousSend: data as PreviousSend
      }
    }

    return { isDuplicate: false }
  } catch (err: any) {
    return {
      isDuplicate: false,
      error: err.message || 'Unknown error checking delivery history'
    }
  }
}

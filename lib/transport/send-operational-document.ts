import { SupabaseClient } from '@supabase/supabase-js'
import { resendClient } from './resend-client'
import { resolveCounterparty } from './resolve-counterparty'
import { checkDuplicateSend } from './check-duplicate-send'
import { buildDocumentPdf } from './build-document-pdf'
import { logEmailDelivery } from './log-email-delivery'

const PENTRACORE_FROM_EMAIL = (() => {
  const email = process.env.PENTRACORE_EMAIL
  if (!email) {
    throw new Error('Missing required server env var: PENTRACORE_EMAIL')
  }
  return email
})()

export interface SendOperationalDocumentRequest {
  dealId: number
  documentType: string
  recipientType: 'buyer' | 'seller'
  supabaseAdmin: SupabaseClient
  resendOverride?: boolean
}

export interface SendOperationalDocumentResult {
  success: boolean
  messageId?: string
  error?: string
  isDuplicate?: boolean
}

export async function sendOperationalDocument(
  req: SendOperationalDocumentRequest
): Promise<SendOperationalDocumentResult> {
  const { dealId, documentType, recipientType, supabaseAdmin, resendOverride = false } = req

  try {
    // STEP 1: Fetch deal
    const { data: deal, error: dealError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return { success: false, error: 'Deal not found' }
    }

    // STEP 2: Resolve counterparty (get real name + email)
    const counterpartyId = recipientType === 'seller' ? deal.seller_id : deal.buyer_id
    if (!counterpartyId) {
      return { success: false, error: `No ${recipientType} specified for this deal` }
    }

    const counterparty = await resolveCounterparty(supabaseAdmin, counterpartyId)
    if (!counterparty) {
      return { success: false, error: 'Counterparty not found or no email address on file' }
    }

    // STEP 3: Fetch document (verify status='approved', content exists)
    const { data: document, error: docError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_documents')
      .select('id, document_type, content, status, created_at')
      .eq('deal_id', dealId)
      .eq('document_type', documentType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (docError) {
      return { success: false, error: `Failed to fetch document: ${docError.message}` }
    }

    if (!document) {
      return {
        success: false,
        error: `No ${documentType.toUpperCase()} document found for this deal. Generate one first.`
      }
    }

    if (document.status !== 'approved') {
      return {
        success: false,
        error: `Cannot send: ${documentType.toUpperCase()} status is '${document.status}', not 'approved'. Document must be approved before sending.`
      }
    }

    if (!document.content) {
      return { success: false, error: 'Document content is empty. Cannot send.' }
    }

    // STEP 4: Check duplicate-send (block unless override)
    const dupCheck = await checkDuplicateSend(
      supabaseAdmin,
      dealId,
      document.id,
      counterparty.email,
      documentType
    )

    if (dupCheck.error) {
      return { success: false, error: dupCheck.error }
    }

    if (dupCheck.isDuplicate && !resendOverride) {
      return {
        success: false,
        error: 'Document already sent to this recipient',
        isDuplicate: true
      }
    }

    // STEP 5: Build PDF attachment (immutable artifact)
    const pdfAttachment = buildDocumentPdf(documentType, dealId, document.content)

    // STEP 6: Send via Resend SDK
    const emailSubject = getEmailSubject(documentType, dealId)
    const emailHtml = formatEmailBody(documentType, counterparty.company_name)

    const sendResult = await resendClient.emails.send({
      from: PENTRACORE_FROM_EMAIL,
      to: counterparty.email,
      subject: emailSubject,
      html: emailHtml,
      replyTo: 'operations@pentracore.com',
      attachments: [
        {
          filename: pdfAttachment.filename,
          content: pdfAttachment.content,
          contentType: pdfAttachment.content_type
        }
      ]
    })

    if (sendResult.error) {
      // STEP 7a: Log failed delivery
      await logEmailDelivery(supabaseAdmin, {
        deal_id: dealId,
        document_id: document.id,
        document_type: documentType,
        recipient_email: counterparty.email,
        recipient_type: recipientType,
        status: 'failed',
        error_message: sendResult.error.message || 'Failed to send email',
        resend_message_id: null,
        sent_at: null
      })

      return { success: false, error: sendResult.error.message || 'Failed to send email' }
    }

    // STEP 7b: Log successful delivery
    const sentAt = new Date().toISOString()
    const messageId = sendResult.data?.id

    await logEmailDelivery(supabaseAdmin, {
      deal_id: dealId,
      document_id: document.id,
      document_type: documentType,
      recipient_email: counterparty.email,
      recipient_type: recipientType,
      status: 'sent',
      error_message: null,
      resend_message_id: messageId,
      sent_at: sentAt
    })

    // CRITICAL: DO NOT UPDATE deal_documents.status
    // document.status remains 'approved' (workflow state, immutable)
    // Delivery state tracked separately in email_delivery_log

    return { success: true, messageId }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error sending document' }
  }
}

function getEmailSubject(documentType: string, dealId: number): string {
  const typeLabel: Record<string, string> = {
    loi: 'Letter of Intent',
    ncnda: 'Non-Circumvention & Non-Disclosure Agreement',
    kyc: 'Know Your Customer (KYC) Form',
    imfpa: 'Instrument for Form of Payment Agreement',
    spa: 'Sale and Purchase Agreement'
  }

  return `[PentraCore] ${typeLabel[documentType] || documentType} - Deal #${dealId}`
}

function formatEmailBody(documentType: string, counterpartyName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f5f5f5; padding: 20px; border-radius: 4px; }
    .footer { margin-top: 20px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Document from PentraCore International</h2>
      <p>Dear ${counterpartyName},</p>
      <p>Please find the requested document attached. This is an operational document for transaction processing.</p>
      <p>If you have any questions, please contact operations@pentracore.com</p>
    </div>

    <div class="footer">
      <p><strong>NOTICE:</strong> This email contains confidential and proprietary information intended only for the named recipient. If you received this in error, please notify operations@pentracore.com immediately.</p>
      <p>© 2026 PentraCore International. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

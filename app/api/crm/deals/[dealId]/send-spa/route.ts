import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDeanRequest } from '@/lib/server-auth'
import { sendOperationalDocument } from '@/lib/transport/send-operational-document'

type RouteContext = {
  params: {
    dealId: string
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)

    const dealId = parseInt(params.dealId, 10)
    if (isNaN(dealId)) {
      return NextResponse.json({ error: 'Invalid deal ID' }, { status: 400 })
    }

    const { recipient_type = 'buyer', resend_override = false } = await req.json().catch(() => ({}))

    // Call transport orchestrator
    const result = await sendOperationalDocument({
      dealId,
      documentType: 'spa',
      recipientType: recipient_type,
      supabaseAdmin,
      resendOverride: resend_override
    })

    // Handle result
    if (!result.success) {
      const statusCode = result.isDuplicate ? 409 : 500
      return NextResponse.json(
        { error: result.error, isDuplicate: result.isDuplicate },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      {
        success: true,
        deal_id: dealId,
        resend_message_id: result.messageId,
        sent_at: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.message?.includes('Forbidden') ? 403 : 401 }
    )
  }
}

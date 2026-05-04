import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyDeanRequest } from '@/lib/server-auth'
import { validateTransition, type DealStage } from '@/lib/deals/stages'

type RouteContext = {
  params: {
    dealId: string
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await verifyDeanRequest(req)

    const body = await req.json()
    const targetStage = body.targetStage as string

    if (!targetStage) {
      return NextResponse.json({ error: 'targetStage is required' }, { status: 400 })
    }

    // Fetch current deal
    const { data: deal, error: fetchError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deals')
      .select('*')
      .eq('id', params.dealId)
      .single()

    if (fetchError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Validate transition
    const validation = validateTransition(deal, targetStage as DealStage)

    if (!validation.allowed) {
      return NextResponse.json(
        {
          error: validation.reason || 'Invalid stage transition',
          currentStage: deal.stage,
          targetStage,
        },
        { status: 400 }
      )
    }

    // Update deal stage
    const { data: updated, error: updateError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deals')
      .update({ stage: targetStage })
      .eq('id', params.dealId)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log the stage change
    const { data: auditLog, error: auditError } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_audit_log')
      .insert([
        {
          deal_id: params.dealId,
          previous_stage: deal.stage,
          new_stage: targetStage,
          action: 'stage_transition',
          notes: body.notes || null
        }
      ])
      .select('id')
      .single()

    return NextResponse.json({
      success: true,
      deal_id: updated.id,
      previous_stage: deal.stage,
      new_stage: updated.stage,
      updated_at: updated.updated_at,
      audit_log_id: auditLog?.id || null,
      audit_error: auditError ? auditError.message : null
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message?.includes('Forbidden') ? 403 : 401 })
  }
}

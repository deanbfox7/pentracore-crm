// Deal audit log utilities
import { supabaseAdmin } from '@/lib/supabase'

export interface DealAuditLog {
  id: number
  deal_id: number
  previous_stage: string | null
  new_stage: string
  action: string
  notes: string | null
  created_at: string
}

export interface AuditLogResult {
  logs: DealAuditLog[]
  error?: string
}

/**
 * Fetch audit log for a deal (most recent first)
 */
export async function getDealAuditLog(dealId: string | number, limit = 50): Promise<AuditLogResult> {
  try {
    const { data, error } = await supabaseAdmin
      .schema('dean_crm')
      .from('deal_audit_log')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { logs: [], error: error.message }
    }

    return { logs: data || [] }
  } catch (err: any) {
    return { logs: [], error: err.message }
  }
}

/**
 * Get audit log summary for a deal (stage transitions only)
 */
export async function getDealStageSummary(dealId: string | number) {
  const result = await getDealAuditLog(dealId)

  if (result.error) {
    return { stages: [], error: result.error }
  }

  const stages = result.logs
    .filter((log) => log.action === 'stage_transition')
    .map((log) => ({
      from: log.previous_stage,
      to: log.new_stage,
      date: log.created_at,
      notes: log.notes
    }))

  return { stages, error: null }
}

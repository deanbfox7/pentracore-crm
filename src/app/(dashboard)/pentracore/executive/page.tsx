import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ExecutiveDashboardClient from '@/components/pentracore/executive/ExecutiveDashboardClient'

type Deal = {
  deal_code: string
  stage: string
  stage_index: number
  commodity: string
  volume: number | null
  estimated_gmv: number | null
  estimated_commission: number | null
  probability: number | null
  next_action: string | null
  blocker: string | null
  origin_region: string | null
  origin_country: string | null
}

type DealTask = {
  id: string
  title: string
  due_at: string | null
  priority: string
  status: string
  deal?: { deal_code?: string } | null
}

type InvestorRow = {
  deal?: {
    deal_code?: string
    commodity?: string
    estimated_gmv?: number | null
    estimated_commission?: number | null
    probability?: number | null
    stage_index?: number | null
  } | null
  investor_company?: { name?: string } | null
}

export default async function PentraCoreExecutivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deals } = await supabase
    .from('deals')
    .select(`
      deal_code,
      stage,
      stage_index,
      commodity,
      volume,
      estimated_gmv,
      estimated_commission,
      probability,
      next_action,
      blocker,
      origin_region,
      origin_country
    `)
    .eq('owner_id', user.id)
    .order('stage_index', { ascending: true })

  const { data: tasks } = await supabase
    .from('deal_tasks')
    .select(`
      id,
      title,
      due_at,
      priority,
      status,
      deal:deals(deal_code)
    `)
    .eq('owner_id', user.id)
    .order('due_at', { ascending: true, nullsFirst: false })

  const { data: investorRows } = await supabase
    .from('deal_participants')
    .select(`
      deal:deals(deal_code, commodity, estimated_gmv, estimated_commission, probability, stage_index),
      investor_company:companies(name)
    `)
    .eq('owner_id', user.id)
    .eq('role', 'investor')

  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now()

  return (
    <ExecutiveDashboardClient
      deals={(deals || []) as unknown as Deal[]}
      tasks={(tasks || []) as unknown as DealTask[]}
      investorRows={(investorRows || []) as unknown as InvestorRow[]}
      nowMs={nowMs}
    />
  )
}


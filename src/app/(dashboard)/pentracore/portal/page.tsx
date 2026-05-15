import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StakeholderPortalClient from '@/components/pentracore/portal/StakeholderPortalClient'

type Deal = {
  id: string
  deal_code: string
  stage_index: number
  stage: string
  commodity: string
  volume: number | null
  estimated_gmv: number | null
  estimated_commission: number | null
  probability: number | null
  next_action: string | null
  blocker: string | null
  origin_region: string | null
}

type ParticipantRow = {
  deal_code: string
  deal_id: string
  role: string
  company_name?: string | null
  stage_index?: number | null
  probability?: number | null
}

type ParticipantJoinRow = {
  role: string
  deal?: { id?: string; deal_code?: string; stage_index?: number; probability?: number } | null
  company?: { name?: string } | null
}

type TaskRow = {
  id: string
  title: string
  due_at: string | null
  priority: string
  status: string
  deal?: { deal_code?: string } | null
}

export default async function StakeholderPortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const profileRole = profile?.role || 'viewer'

  const [
    { data: deals },
    { data: participants },
    { data: tasks },
  ] = await Promise.all([
    supabase
      .from('deals')
      .select('id, deal_code, stage_index, stage, commodity, volume, estimated_gmv, estimated_commission, probability, next_action, blocker, origin_region')
      .eq('owner_id', user.id)
      .order('stage_index', { ascending: true }),

    supabase
      .from('deal_participants')
      .select('role, deal:deals(id, deal_code, stage_index, probability), company:companies(name)')
      .eq('owner_id', user.id),

    supabase
      .from('deal_tasks')
      .select('id, title, due_at, priority, status, deal:deals(deal_code)')
      .eq('owner_id', user.id),
  ])

  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now()

  return (
    <StakeholderPortalClient
      profileRole={profileRole}
      deals={(deals || []) as unknown as Deal[]}
      participants={((participants || []) as unknown as ParticipantJoinRow[]).map((p) => ({
        deal_code: p.deal?.deal_code || '',
        deal_id: p.deal?.id || '',
        role: p.role,
        company_name: p.company?.name,
        stage_index: p.deal?.stage_index,
        probability: p.deal?.probability,
      })) as unknown as ParticipantRow[]}
      tasks={(tasks || []) as unknown as TaskRow[]}
      nowMs={nowMs}
    />
  )
}


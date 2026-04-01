import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [leadsResult, activitiesResult, aptsResult] = await Promise.all([
    supabase.from('leads').select('id, stage, lead_score, source, country, created_at, commodities_of_interest, estimated_deal_value').eq('owner_id', user!.id),
    supabase.from('activities').select('type, created_at, lead_id').eq('user_id', user!.id).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase.from('appointments').select('status').eq('owner_id', user!.id),
  ])

  return <AnalyticsClient leads={leadsResult.data || []} activities={activitiesResult.data || []} appointments={aptsResult.data || []} />
}

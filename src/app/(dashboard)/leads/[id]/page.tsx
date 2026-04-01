import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LeadDetailClient from './LeadDetailClient'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [leadResult, activitiesResult] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).eq('owner_id', user!.id).single(),
    supabase.from('activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(50),
  ])

  if (!leadResult.data) notFound()

  return <LeadDetailClient lead={leadResult.data} activities={activitiesResult.data || []} />
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DocumentCenterClient from '@/components/pentracore/documents/DocumentCenterClient'

export default async function DocumentCenterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: docs } = await supabase
    .from('documents')
    .select('id, doc_type, name, status, expiry_date, linked_deal_id, visibility_stage_index, ai_extracted_summary')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(200)

  return <DocumentCenterClient docs={(docs || []) as any} />
}


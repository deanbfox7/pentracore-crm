import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import ShareholderChatClient from './ShareholderChatClient'

export default async function ShareholderChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ shareholder_id?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const shareholderId = query.shareholder_id || id

  if (!shareholderId || shareholderId !== id) {
    redirect('/login')
  }

  const supabase = await createServiceClient()
  const { data: shareholder } = await supabase
    .from('shareholders')
    .select('id, name')
    .eq('id', shareholderId)
    .single()

  if (!shareholder) {
    redirect('/login')
  }

  return <ShareholderChatClient shareholderId={shareholder.id} shareholderName={shareholder.name} />
}

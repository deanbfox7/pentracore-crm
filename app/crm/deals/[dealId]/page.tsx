'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface Deal {
  id: number
  opportunity_id: number
  buyer_id: number
  seller_id: number
  commodity: string
  tonnage: number
  price_per_unit: number
  total_value: number
  stage: string
  ncnda_signed_date: string | null
  kyc_approved_date: string | null
  imfpa_signed_date: string | null
  spa_signed_date: string | null
  expected_commission: number
  commission_received: number | null
  notes: string
  created_at: string
}

export default function DealDetailPage() {
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, session } = useAuth()
  const router = useRouter()
  const params = useParams()
  const dealId = params.dealId as string

  useEffect(() => {
    if (!session || user?.email !== 'deanbfox@gmail.com') {
      router.push('/')
      return
    }
    fetchDeal()
  }, [user, session, router, dealId])

  async function fetchDeal() {
    try {
      const token = session?.access_token
      const res = await fetch(`/api/crm/deals/${dealId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to load deal')
      }
      const data = await res.json()
      setDeal(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container"><p>Loading deal...</p></div>
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>
        <Link href="/crm/deals" style={{ padding: '8px 16px', background: '#666', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
          Back to Deals
        </Link>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="container">
        <p>Deal not found.</p>
        <Link href="/crm/deals" style={{ padding: '8px 16px', background: '#666', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
          Back to Deals
        </Link>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Deal #{deal.id} - {deal.commodity}</h1>
        <Link href="/crm/deals" style={{ padding: '8px 16px', background: '#666', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
          Back to Deals
        </Link>
      </div>

      <div className="card">
        <h2>Deal Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>Commodity</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{deal.commodity}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>Stage</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
              <span style={{ background: getStageColor(deal.stage), color: 'white', padding: '4px 12px', borderRadius: '4px' }}>
                {deal.stage.toUpperCase()}
              </span>
            </p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>Tonnage</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{deal.tonnage.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>Price Per Unit (USD)</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>${deal.price_per_unit?.toLocaleString() || 'N/A'}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>Total Value (USD)</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>${deal.total_value?.toLocaleString() || 'N/A'}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>Expected Commission (USD)</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0066cc' }}>${deal.expected_commission?.toLocaleString() || 'N/A'}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>Buyer ID</p>
            <p style={{ fontSize: '14px' }}>{deal.buyer_id || 'Not assigned'}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>Seller ID</p>
            <p style={{ fontSize: '14px' }}>{deal.seller_id || 'Not assigned'}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h2>Timeline</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>NCNDA Signed</p>
            <p style={{ fontSize: '14px' }}>{deal.ncnda_signed_date ? new Date(deal.ncnda_signed_date).toLocaleDateString() : 'Not signed'}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>KYC Approved</p>
            <p style={{ fontSize: '14px' }}>{deal.kyc_approved_date ? new Date(deal.kyc_approved_date).toLocaleDateString() : 'Not approved'}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>IMFPA Signed</p>
            <p style={{ fontSize: '14px' }}>{deal.imfpa_signed_date ? new Date(deal.imfpa_signed_date).toLocaleDateString() : 'Not signed'}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px' }}>SPA Signed</p>
            <p style={{ fontSize: '14px' }}>{deal.spa_signed_date ? new Date(deal.spa_signed_date).toLocaleDateString() : 'Not signed'}</p>
          </div>
        </div>
      </div>

      {deal.notes && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h2>Notes</h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{deal.notes}</p>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <Link href="/crm/deals" style={{ padding: '10px 16px', background: '#666', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
          Back to Deals
        </Link>
      </div>
    </div>
  )
}

function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    'inquiry': '#95a5a6',
    'loi_draft': '#3498db',
    'loi_sent': '#3498db',
    'ncnda_signed': '#9b59b6',
    'kyc_approved': '#27ae60',
    'imfpa_signed': '#e74c3c',
    'spa_signed': '#f39c12',
    'closed_won': '#0066cc',
    'closed_lost': '#666'
  }
  return colors[stage] || '#95a5a6'
}

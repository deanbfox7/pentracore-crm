'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { formatCurrency, stageColor, stageLabel } from '@/lib/utils'
import type { DealStage } from '@/lib/types'

interface DealMetrics {
  total_deals: number
  active_deals: number
  total_value: number
  avg_deal_value: number
  total_commission: number
  avg_commission: number
  deals_by_stage: Record<string, number>
  deals_by_commodity: Record<string, number>
}

interface DealRecord {
  stage: string
  commodity: string
  total_value: number | null
  expected_commission: number | null
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DealMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!session || user?.email !== 'deanbfox@gmail.com') {
      router.push('/')
      return
    }
    fetchMetrics()
  }, [user, session, router])

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/crm/deals', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to load deals')
      }

      const deals = (await res.json()) as DealRecord[]

      if (!deals || deals.length === 0) {
        setMetrics({
          total_deals: 0,
          active_deals: 0,
          total_value: 0,
          avg_deal_value: 0,
          total_commission: 0,
          avg_commission: 0,
          deals_by_stage: {},
          deals_by_commodity: {},
        })
        setLoading(false)
        return
      }

      const activeDealStages = ['inquiry', 'ncnda', 'kyc', 'imfpa', 'spa']
      const activeDealCount = deals.filter((d) => activeDealStages.includes(d.stage)).length
      const totalValue = deals.reduce((sum, d) => sum + (d.total_value || 0), 0)
      const totalCommission = deals.reduce((sum, d) => sum + (d.expected_commission || 0), 0)

      const dealsByStage: Record<string, number> = {}
      const dealsByCommodity: Record<string, number> = {}

      deals.forEach((deal) => {
        dealsByStage[deal.stage] = (dealsByStage[deal.stage] || 0) + 1
        dealsByCommodity[deal.commodity] = (dealsByCommodity[deal.commodity] || 0) + 1
      })

      setMetrics({
        total_deals: deals.length,
        active_deals: activeDealCount,
        total_value: totalValue,
        avg_deal_value: Math.round(totalValue / deals.length),
        total_commission: totalCommission,
        avg_commission: Math.round(totalCommission / deals.length),
        deals_by_stage: dealsByStage,
        deals_by_commodity: dealsByCommodity,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container"><p>Loading analytics...</p></div>
  }

  if (!metrics) {
    return <div className="container"><p>No data available</p></div>
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Deal Analytics</h1>
        <Link href="/crm" style={{ padding: '8px 16px', background: '#666', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
          Back to CRM
        </Link>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="card" style={{ marginBottom: '30px' }}>
        <h2>Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Total Deals</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.total_deals}</p>
          </div>
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Active Deals</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>{metrics.active_deals}</p>
          </div>
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Total Value</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(metrics.total_value)}</p>
          </div>
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Avg Deal Value</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(metrics.avg_deal_value)}</p>
          </div>
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Total Commission</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>{formatCurrency(metrics.total_commission)}</p>
          </div>
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '4px' }}>
            <p style={{ color: '#666', fontSize: '12px', marginBottom: '5px' }}>Avg Commission</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>{formatCurrency(metrics.avg_commission)}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h2>Deals by Stage</h2>
          <div>
            {Object.entries(metrics.deals_by_stage).map(([stage, count]) => {
              const dealStage = stage as DealStage

              return (
                <div
                  key={stage}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    padding: '8px',
                    background: '#f9f9f9',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ color: stageColor[dealStage] || '#666', fontWeight: 'bold' }}>
                    {stageLabel[dealStage] || stage}
                  </span>
                  <span>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h2>Deals by Commodity</h2>
          <div>
            {Object.entries(metrics.deals_by_commodity)
              .sort(([, a], [, b]) => b - a)
              .map(([commodity, count]) => (
                <div
                  key={commodity}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    padding: '8px',
                    background: '#f9f9f9',
                    borderRadius: '4px',
                  }}
                >
                  <span>{commodity}</span>
                  <span style={{ fontWeight: 'bold', color: '#0066cc' }}>{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <Link
            href="/crm/deals"
            style={{
              padding: '10px 16px',
              background: '#0066cc',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            View All Deals
          </Link>
          <button
            onClick={fetchMetrics}
            style={{
              padding: '10px 16px',
              background: '#27ae60',
              color: 'white',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Refresh Data
          </button>
          <button
            onClick={() => {
              const csv = [
                'Stage,Commodity,Total Value,Commission',
                ...Object.keys(metrics.deals_by_stage || {}).map(
                  (s) => `${s},,${metrics.total_value},${metrics.total_commission}`
                ),
              ].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            style={{
              padding: '10px 16px',
              background: '#f39c12',
              color: 'white',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}

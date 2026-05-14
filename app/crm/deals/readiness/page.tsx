'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

interface ReadinessAssessment {
  deal: Deal
  group: 'signature-ready' | 'blocking' | 'on-track' | 'high-risk'
  missingItems: string[]
  criticalDeadline: string
  nextAction: string
  riskLevel: 'low' | 'medium' | 'high'
}

export default function DealReadinessPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [assessments, setAssessments] = useState<ReadinessAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!session || user?.email !== 'deanbfox@gmail.com') {
      router.push('/')
      return
    }
    fetchAndAssess()
  }, [user, session, router])

  async function fetchAndAssess() {
    try {
      const token = session?.access_token
      const res = await fetch('/api/crm/deals', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const dealsArray = Array.isArray(data) ? data : []
      setDeals(dealsArray)

      // Assess each deal
      const assessed = dealsArray.map(assessDealReadiness)
      setAssessments(assessed)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function assessDealReadiness(deal: Deal): ReadinessAssessment {
    const ncndaSigned = deal.ncnda_signed_date !== null
    const kycApproved = deal.kyc_approved_date !== null
    const imfpaSigned = deal.imfpa_signed_date !== null
    const spaSigned = deal.spa_signed_date !== null

    const missingItems: string[] = []
    let group: 'signature-ready' | 'blocking' | 'on-track' | 'high-risk' = 'on-track'
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let criticalDeadline = 'None'
    let nextAction = 'Monitor'

    // NCNDA is first gate
    if (!ncndaSigned) {
      missingItems.push('NCNDA unsigned')
      if (deal.stage === 'LOI' || deal.stage === 'FCO' || deal.stage === 'SPA') {
        group = 'blocking'
        riskLevel = 'high'
        criticalDeadline = 'EOD today'
        nextAction = 'Obtain NCNDA signature'
      }
    }

    // KYC is second gate (before SPA)
    if (!kycApproved && deal.stage !== 'inquiry' && deal.stage !== 'opportunity') {
      missingItems.push('KYC not approved')
      if (deal.stage === 'LOI' || deal.stage === 'FCO' || deal.stage === 'SPA') {
        group = 'blocking'
        riskLevel = 'high'
        criticalDeadline = 'EOD May 9'
        nextAction = 'Collect buyer/seller KYC documents'
      }
    }

    // IMFPA is third gate (before SPA)
    if (!imfpaSigned && deal.stage === 'SPA') {
      missingItems.push('IMFPA not signed')
      group = 'blocking'
      riskLevel = 'high'
      criticalDeadline = 'EOD May 9'
      nextAction = 'Obtain IMFPA signatures'
    }

    // Signature-ready check
    if (spaSigned) {
      group = 'signature-ready'
      riskLevel = 'low'
      criticalDeadline = 'Signed'
      nextAction = 'Monitor execution'
      missingItems.length = 0
    } else if (deal.stage === 'SPA' && ncndaSigned && kycApproved && imfpaSigned) {
      group = 'signature-ready'
      riskLevel = 'low'
      criticalDeadline = 'Today'
      nextAction = 'Execute SPA signature'
      missingItems.length = 0
    }

    // Check for high-risk conditions
    if (missingItems.length > 3 || (deal.stage === 'inquiry' && !deal.notes)) {
      group = 'high-risk'
      riskLevel = 'high'
      nextAction = 'Review and potentially deprioritize'
    }

    // Commodity-specific deadlines
    if (deal.commodity === 'Coal RB3') {
      if (!spaSigned && group === 'signature-ready') {
        criticalDeadline = 'May 10 EOD'
      }
    } else if (deal.commodity === 'Copper Cathode') {
      if (!spaSigned && group === 'signature-ready') {
        criticalDeadline = 'May 13 EOD'
      }
    }

    return {
      deal,
      group,
      missingItems,
      criticalDeadline,
      nextAction,
      riskLevel
    }
  }

  function getGroupIcon(group: string): string {
    switch (group) {
      case 'signature-ready': return '🔴'
      case 'blocking': return '🟠'
      case 'on-track': return '🟡'
      case 'high-risk': return '⚫'
      default: return '⚪'
    }
  }

  function getGroupLabel(group: string): string {
    switch (group) {
      case 'signature-ready': return 'SIGNATURE-READY'
      case 'blocking': return 'BLOCKING ISSUES'
      case 'on-track': return 'ON-TRACK'
      case 'high-risk': return 'HIGH-RISK / DEPRIORITIZE'
      default: return 'UNKNOWN'
    }
  }

  function groupByCategory() {
    const groups = {
      'signature-ready': [] as ReadinessAssessment[],
      'blocking': [] as ReadinessAssessment[],
      'on-track': [] as ReadinessAssessment[],
      'high-risk': [] as ReadinessAssessment[]
    }

    assessments.forEach(assessment => {
      groups[assessment.group].push(assessment)
    })

    return groups
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <p>Loading deal readiness assessment...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: 'red' }}>
        <p>Error: {error}</p>
      </div>
    )
  }

  const grouped = groupByCategory()

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>Deal Readiness Panel</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Operational visibility: Which deals can close this week? What's blocking progress?
        </p>
        <Link href="/crm/deals" style={{ marginRight: '15px', color: '#0066cc', textDecoration: 'none' }}>
          ← Back to All Deals
        </Link>
      </div>

      {/* SIGNATURE-READY GROUP */}
      {grouped['signature-ready'].length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#c41e3a', marginBottom: '15px' }}>
            {getGroupIcon('signature-ready')} {getGroupLabel('signature-ready')} ({grouped['signature-ready'].length})
          </h2>
          {grouped['signature-ready'].map(assessment => (
            <DealCard key={assessment.deal.id} assessment={assessment} />
          ))}
        </div>
      )}

      {/* BLOCKING GROUP */}
      {grouped['blocking'].length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#ff8c00', marginBottom: '15px' }}>
            {getGroupIcon('blocking')} {getGroupLabel('blocking')} ({grouped['blocking'].length})
          </h2>
          {grouped['blocking'].map(assessment => (
            <DealCard key={assessment.deal.id} assessment={assessment} />
          ))}
        </div>
      )}

      {/* ON-TRACK GROUP */}
      {grouped['on-track'].length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#ffd700', marginBottom: '15px' }}>
            {getGroupIcon('on-track')} {getGroupLabel('on-track')} ({grouped['on-track'].length})
          </h2>
          {grouped['on-track'].map(assessment => (
            <DealCard key={assessment.deal.id} assessment={assessment} />
          ))}
        </div>
      )}

      {/* HIGH-RISK GROUP */}
      {grouped['high-risk'].length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#333', marginBottom: '15px' }}>
            {getGroupIcon('high-risk')} {getGroupLabel('high-risk')} ({grouped['high-risk'].length})
          </h2>
          {grouped['high-risk'].map(assessment => (
            <DealCard key={assessment.deal.id} assessment={assessment} />
          ))}
        </div>
      )}

      {assessments.length === 0 && (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p>No deals found. Create a deal to get started.</p>
        </div>
      )}

      {/* SUMMARY STATS */}
      <div style={{ marginTop: '40px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px', borderLeft: '4px solid #0066cc' }}>
        <h3>Summary</h3>
        <p>Total Deals: <strong>{assessments.length}</strong></p>
        <p>Signature-Ready: <strong>{grouped['signature-ready'].length}</strong> | Blocking: <strong>{grouped['blocking'].length}</strong> | On-Track: <strong>{grouped['on-track'].length}</strong> | High-Risk: <strong>{grouped['high-risk'].length}</strong></p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          💡 Focus on Blocking deals first. They are preventing progress on high-value transactions.
        </p>
      </div>
    </div>
  )
}

function DealCard({ assessment }: { assessment: ReadinessAssessment }) {
  const { deal, group, missingItems, criticalDeadline, nextAction, riskLevel } = assessment

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#28a745'
      case 'medium': return '#ffc107'
      case 'high': return '#dc3545'
      default: return '#6c757d'
    }
  }

  return (
    <div style={{
      padding: '15px',
      marginBottom: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#fafafa'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
        <div>
          <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>
            {deal.commodity} {deal.tonnage ? `(${deal.tonnage} MT)` : ''}
          </h4>
          <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
            Stage: <strong>{deal.stage.toUpperCase()}</strong> | Value: <strong>${deal.total_value?.toLocaleString() || 'TBD'}</strong>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 8px',
            backgroundColor: getRiskColor(assessment.riskLevel),
            color: 'white',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {assessment.riskLevel.toUpperCase()} RISK
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px', fontSize: '13px' }}>
        <div>
          <p style={{ margin: '0 0 5px 0', color: '#666' }}>Document Status:</p>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#333' }}>
            <li>{assessment.deal.ncnda_signed_date ? '✅ NCNDA' : '❌ NCNDA'}</li>
            <li>{assessment.deal.kyc_approved_date ? '✅ KYC' : '❌ KYC'}</li>
            <li>{assessment.deal.imfpa_signed_date ? '✅ IMFPA' : '❌ IMFPA'}</li>
            <li>{assessment.deal.spa_signed_date ? '✅ SPA' : '❌ SPA'}</li>
          </ul>
        </div>
        <div>
          <p style={{ margin: '0 0 5px 0', color: '#666' }}>Timeline:</p>
          <p style={{ margin: '0 0 5px 0' }}>Deadline: <strong>{criticalDeadline}</strong></p>
          <p style={{ margin: '0', color: '#0066cc' }}>Next: <strong>{nextAction}</strong></p>
        </div>
      </div>

      {missingItems.length > 0 && (
        <div style={{ padding: '8px', backgroundColor: '#fff3cd', borderRadius: '3px', marginBottom: '8px' }}>
          <p style={{ margin: '0', fontSize: '12px', color: '#856404' }}>
            <strong>Missing:</strong> {missingItems.join(', ')}
          </p>
        </div>
      )}

      {deal.notes && (
        <div style={{ fontSize: '12px', color: '#666', padding: '8px', backgroundColor: '#e8e8e8', borderRadius: '3px' }}>
          <strong>Notes:</strong> {deal.notes}
        </div>
      )}

      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
        <Link href={`/crm/deals/${deal.id}`} style={{ fontSize: '12px', color: '#0066cc', textDecoration: 'none' }}>
          View full deal details →
        </Link>
      </div>
    </div>
  )
}

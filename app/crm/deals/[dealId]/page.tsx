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
  probability_percent?: number
  owner?: string
  risk_level?: string
  current_bottleneck?: string
  missing_documents?: string
  next_action?: string
}

interface SavedDocument {
  id: number
  document_type: string
  status: string
  generated_at: string
  created_at: string
}

export default function DealDetailPage() {
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loiLoading, setLoiLoading] = useState(false)
  const [ncndaLoading, setNcndaLoading] = useState(false)
  const [kycLoading, setKycLoading] = useState(false)
  const [imfpaLoading, setImfpaLoading] = useState(false)
  const [spaLoading, setSpaLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<{ dealId: number; text: string; type: string } | null>(null)
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([])
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

  async function fetchSavedDocuments() {
    try {
      const token = session?.access_token
      const res = await fetch(`/api/crm/deals/${dealId}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setSavedDocuments(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to fetch documents:', err.message)
    }
  }

  async function generateLOI() {
    setLoiLoading(true)
    try {
      const token = session?.access_token
      const res = await fetch(`/api/crm/deals/${dealId}/generate-loi`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate LOI')
        setLoiLoading(false)
        return
      }
      setSelectedDocument({ dealId: Number(dealId), text: data.loi_text, type: 'LOI' })
      setError('')
      await fetchSavedDocuments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoiLoading(false)
    }
  }

  async function generateNCNDA() {
    setNcndaLoading(true)
    try {
      const token = session?.access_token
      const res = await fetch(`/api/crm/deals/${dealId}/generate-ncnda`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate NCNDA')
        setNcndaLoading(false)
        return
      }
      setSelectedDocument({ dealId: Number(dealId), text: data.ncnda_text, type: 'NCNDA' })
      setError('')
      await fetchSavedDocuments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setNcndaLoading(false)
    }
  }

  async function generateKYC() {
    setKycLoading(true)
    try {
      const token = session?.access_token
      const res = await fetch(`/api/crm/deals/${dealId}/generate-kyc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate KYC')
        setKycLoading(false)
        return
      }
      setSelectedDocument({ dealId: Number(dealId), text: data.kyc_text, type: 'KYC' })
      setError('')
      await fetchSavedDocuments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setKycLoading(false)
    }
  }

  async function generateIMFPA() {
    setImfpaLoading(true)
    try {
      const token = session?.access_token
      const res = await fetch(`/api/crm/deals/${dealId}/generate-imfpa`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate IMFPA')
        setImfpaLoading(false)
        return
      }
      setSelectedDocument({ dealId: Number(dealId), text: data.imfpa_text, type: 'IMFPA' })
      setError('')
      await fetchSavedDocuments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImfpaLoading(false)
    }
  }

  async function generateSPA() {
    setSpaLoading(true)
    try {
      const token = session?.access_token
      const res = await fetch(`/api/crm/deals/${dealId}/generate-spa`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate SPA')
        setSpaLoading(false)
        return
      }
      setSelectedDocument({ dealId: Number(dealId), text: data.spa_text, type: 'SPA' })
      setError('')
      await fetchSavedDocuments()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSpaLoading(false)
    }
  }

  async function viewSavedDocument(documentId: number) {
    try {
      const token = session?.access_token
      const res = await fetch(`/api/crm/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load document')
        return
      }
      setSelectedDocument({ dealId: Number(dealId), text: data.content, type: data.document_type })
    } catch (err: any) {
      setError(err.message)
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

      <div className="card" style={{ marginTop: '30px', background: '#f0f7ff', borderLeft: '4px solid #3498db' }}>
        <h2 style={{ color: '#2c3e50' }}>Phase 2: Operational Visibility</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Owner</p>
            <p style={{ fontSize: '16px', color: deal.owner ? '#333' : '#999' }}>{deal.owner || '(unassigned)'}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Probability (%)</p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: deal.probability_percent ? '#27ae60' : '#999' }}>{deal.probability_percent ?? 0}%</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Risk Level</p>
            <p style={{ fontSize: '14px' }}>
              <span style={{
                background: deal.risk_level === 'High' ? '#e74c3c' : deal.risk_level === 'Medium' ? '#f39c12' : '#27ae60',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {deal.risk_level || 'Medium'}
              </span>
            </p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Bottleneck</p>
            <p style={{ fontSize: '14px', color: deal.current_bottleneck ? '#e74c3c' : '#999' }}>
              {deal.current_bottleneck || '(none)'}
            </p>
          </div>
        </div>
        {deal.missing_documents && (
          <div style={{ marginTop: '20px', padding: '12px', background: '#fff3cd', borderRadius: '4px', borderLeft: '4px solid #f39c12' }}>
            <p style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Missing Documents</p>
            <p style={{ fontSize: '14px', color: '#333' }}>{deal.missing_documents}</p>
          </div>
        )}
        {deal.next_action && (
          <div style={{ marginTop: '20px', padding: '12px', background: '#e8f4f8', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
            <p style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Next Action</p>
            <p style={{ fontSize: '14px', color: '#2c3e50' }}>→ {deal.next_action}</p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h2>Generate Documents</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          <button onClick={() => generateLOI()} disabled={loiLoading || ncndaLoading || kycLoading || imfpaLoading || spaLoading} style={{ padding: '10px 12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: loiLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: loiLoading ? 0.6 : 1 }}>
            {loiLoading ? 'Generating...' : 'LOI'}
          </button>
          <button onClick={() => generateNCNDA()} disabled={ncndaLoading || loiLoading || kycLoading || imfpaLoading || spaLoading} style={{ padding: '10px 12px', background: '#9b59b6', color: 'white', border: 'none', borderRadius: '4px', cursor: ncndaLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: ncndaLoading ? 0.6 : 1 }}>
            {ncndaLoading ? 'Generating...' : 'NCNDA'}
          </button>
          <button onClick={() => generateKYC()} disabled={kycLoading || loiLoading || ncndaLoading || imfpaLoading || spaLoading} style={{ padding: '10px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: kycLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: kycLoading ? 0.6 : 1 }}>
            {kycLoading ? 'Generating...' : 'KYC'}
          </button>
          <button onClick={() => generateIMFPA()} disabled={imfpaLoading || loiLoading || ncndaLoading || kycLoading || spaLoading} style={{ padding: '10px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: imfpaLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: imfpaLoading ? 0.6 : 1 }}>
            {imfpaLoading ? 'Generating...' : 'IMFPA'}
          </button>
          <button onClick={() => generateSPA()} disabled={spaLoading || loiLoading || ncndaLoading || kycLoading || imfpaLoading} style={{ padding: '10px 12px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: spaLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: spaLoading ? 0.6 : 1 }}>
            {spaLoading ? 'Generating...' : 'SPA'}
          </button>
        </div>
      </div>

      {selectedDocument && (
        <div className="card" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Generated {selectedDocument.type}</h2>
            <button onClick={() => setSelectedDocument(null)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
              Close
            </button>
          </div>
          <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.5' }}>
            {selectedDocument.text}
          </pre>
        </div>
      )}

      {savedDocuments.length > 0 && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h2>Saved Documents</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Generated</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {savedDocuments.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{doc.document_type.toUpperCase()}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ background: doc.status === 'draft' ? '#f39c12' : '#27ae60', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      {new Date(doc.generated_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => viewSavedDocument(doc.id)} style={{ padding: '4px 8px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

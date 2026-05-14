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

interface SavedDocument {
  id: number
  document_type: string
  status: string
  generated_at: string
  created_at: string
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<{ dealId: number; text: string; type: string } | null>(null)
  const [loiLoading, setLoiLoading] = useState(false)
  const [ncndaLoading, setNcndaLoading] = useState(false)
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([])
  const [viewingDocument, setViewingDocument] = useState<{ id: number; content: string; type: string } | null>(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [imfpaLoading, setImfpaLoading] = useState(false)
  const [spaLoading, setSpaLoading] = useState(false)
  const [fcoMarkedDeals, setFcoMarkedDeals] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [selectedCommodity, setSelectedCommodity] = useState('')
  const [formData, setFormData] = useState({
    deal_name: '',
    commodity: '',
    tonnage: 0,
    counterparty_name: '',
    counterparty_email: '',
    intermediary_chain: '',
    source: 'direct',
    notes: '',
    next_action: ''
  })
  const { user, session, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!session || user?.email !== 'deanbfox@gmail.com') {
      router.push('/')
      return
    }
    fetchDeals()
  }, [user, session, router])

  async function fetchDeals() {
    try {
      const token = session?.access_token
      const res = await fetch('/api/crm/deals', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setDeals(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getFilteredDeals() {
    return deals.filter(deal => {
      const matchesSearch = searchTerm === '' ||
        deal.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStage = selectedStage === '' || deal.stage === selectedStage
      const matchesCommodity = selectedCommodity === '' || deal.commodity === selectedCommodity
      return matchesSearch && matchesStage && matchesCommodity
    })
  }

  function getUniqueCommodities() {
    return Array.from(new Set(deals.map(d => d.commodity))).sort()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = session?.access_token
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create deal')
      }

      const newDeal = await res.json()
      setDeals([newDeal, ...deals])
      setFormData({
        deal_name: '',
        commodity: '',
        tonnage: 0,
        counterparty_name: '',
        counterparty_email: '',
        intermediary_chain: '',
        source: 'direct',
        notes: '',
        next_action: ''
      })
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function fetchSavedDocuments(dealId: number) {
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

  async function generateLOI(dealId: number) {
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
      setSelectedDocument({ dealId, text: data.loi_text, type: 'LOI' })
      setError('')
      await fetchSavedDocuments(dealId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoiLoading(false)
    }
  }

  async function generateNCNDA(dealId: number) {
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
      setSelectedDocument({ dealId, text: data.ncnda_text, type: 'NCNDA' })
      setError('')
      await fetchSavedDocuments(dealId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setNcndaLoading(false)
    }
  }

  async function generateKYC(dealId: number) {
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
      setSelectedDocument({ dealId, text: data.kyc_text, type: 'KYC' })
      setError('')
      await fetchSavedDocuments(dealId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setKycLoading(false)
    }
  }

  async function generateIMFPA(dealId: number) {
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
      setSelectedDocument({ dealId, text: data.imfpa_text, type: 'IMFPA' })
      setError('')
      await fetchSavedDocuments(dealId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImfpaLoading(false)
    }
  }

  async function generateSPA(dealId: number) {
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
      setSelectedDocument({ dealId, text: data.spa_text, type: 'SPA' })
      setError('')
      await fetchSavedDocuments(dealId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSpaLoading(false)
    }
  }

  function calculateDealReadiness(savedDocuments: SavedDocument[], fcoMarked: boolean = false) {
    const documentTypes = new Set(savedDocuments.map(d => d.document_type))

    const completed = savedDocuments.map(d => ({
      type: d.document_type.toUpperCase(),
      status: d.status,
      date: new Date(d.generated_at).toLocaleDateString()
    }))

    const missing: string[] = []
    const nextActions: string[] = []

    const hasLOI = documentTypes.has('loi')
    const hasSPA = documentTypes.has('spa')
    const latestSPA = savedDocuments.find(d => d.document_type === 'spa')
    const spaSigned = latestSPA?.status === 'signed'

    // FCO is external, can be marked as received/reviewed
    if (!fcoMarked) {
      missing.push('FCO (Full Corporate Offer - from seller)')
    }

    let readinessStatus = 'Not started'

    if (!hasLOI) {
      missing.push('LOI (request/offer document)')
      nextActions.push('Generate LOI/request')
      readinessStatus = 'Not started - Generate LOI/request'
    } else if (!fcoMarked && !hasSPA) {
      nextActions.push('Follow up with seller for FCO')
      nextActions.push('Once FCO received, prepare SPA')
      missing.push('SPA (final binding agreement)')
      readinessStatus = 'LOI/request stage - Follow up for FCO from seller'
    } else if (fcoMarked && !hasSPA) {
      nextActions.push('Prepare SPA')
      missing.push('SPA (final binding agreement)')
      readinessStatus = 'FCO received - Prepare SPA'
    } else if (hasSPA && !spaSigned) {
      nextActions.push('SPA prepared, awaiting approval/signature')
      readinessStatus = 'SPA prepared - Awaiting approval/signature'
    } else if (spaSigned) {
      readinessStatus = 'Deal documents complete - All signed'
    }

    return { completed, missing, nextActions, readinessStatus }
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
      setViewingDocument({ id: documentId, content: data.content, type: data.document_type })
    } catch (err: any) {
      setError(err.message)
    }
  }

  function downloadSavedDocument() {
    if (!viewingDocument) return
    const element = document.createElement('a')
    const file = new Blob([viewingDocument.content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${viewingDocument.type.toUpperCase()}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  async function downloadDocumentAsPDF() {
    if (!viewingDocument) return

    try {
      const { exportDocumentAsPDF } = await import('@/lib/pdf-export')
      const today = new Date().toISOString().split('T')[0]

      await exportDocumentAsPDF(
        viewingDocument.content,
        viewingDocument.type,
        today,
        selectedDocument?.dealId
      )
    } catch (err: any) {
      setError(`Failed to generate PDF: ${err.message}`)
    }
  }

  async function updateDocumentStatus(documentId: number, newStatus: string) {
    try {
      const token = session?.access_token
      const res = await fetch(`/api/crm/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update document status')
        return
      }
      await fetchSavedDocuments(selectedDocument?.dealId || 0)
      setError('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  function downloadLOI() {
    if (!selectedDocument) return
    const element = document.createElement('a')
    const file = new Blob([selectedDocument.text], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `LOI-Deal-${selectedDocument.dealId}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const stageColor = (stage: string) => {
    const colors: Record<string, string> = {
      inquiry: '#f39c12',
      loi_draft: '#e8a83c',
      loi_sent: '#d9913d',
      ncnda_signed: '#9b59b6',
      kyc_approved: '#3498db',
      imfpa_signed: '#e67e22',
      spa_signed: '#27ae60',
      closed_won: '#2ecc71',
      closed_lost: '#e74c3c',
      // Legacy support
      ncnda: '#9b59b6',
      kyc: '#3498db',
      imfpa: '#e67e22',
      spa: '#27ae60',
      settlement: '#2ecc71'
    }
    return colors[stage] || '#95a5a6'
  }

  if (loading) {
    return <div className="container"><p>Loading deals...</p></div>
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Deal Pipeline</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '8px 16px', background: '#27ae60', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            {showForm ? 'Cancel' : '+ New Deal'}
          </button>
          <Link href="/crm" style={{ padding: '8px 16px', background: '#666', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
            Back
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h2>Create New Deal (Hybrid Intake)</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label>Deal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.deal_name}
                  onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })}
                  placeholder="e.g., Coal RB3, Copper Cathode"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Commodity *</label>
                <input
                  type="text"
                  required
                  value={formData.commodity}
                  onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                  placeholder="e.g., Iron Ore, Cobalt"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Tonnage *</label>
                <input
                  type="number"
                  required
                  value={formData.tonnage}
                  onChange={(e) => setFormData({ ...formData, tonnage: parseFloat(e.target.value) })}
                  placeholder="0"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="referral">Referral</option>
                  <option value="direct">Direct</option>
                  <option value="spreadsheet">Spreadsheet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label>Counterparty Name</label>
                <input
                  type="text"
                  value={formData.counterparty_name}
                  onChange={(e) => setFormData({ ...formData, counterparty_name: e.target.value })}
                  placeholder="e.g., Orathu, FGMS (optional)"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Counterparty Email</label>
                <input
                  type="email"
                  value={formData.counterparty_email}
                  onChange={(e) => setFormData({ ...formData, counterparty_email: e.target.value })}
                  placeholder="contact@example.com (optional)"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '15px' }}>
              <label>Intermediary Chain</label>
              <input
                type="text"
                value={formData.intermediary_chain}
                onChange={(e) => setFormData({ ...formData, intermediary_chain: e.target.value })}
                placeholder="e.g., Alex → Renier → Crazy Monkeys 561 → Seller"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '15px' }}
              />
            </div>
            <div style={{ marginTop: '15px' }}>
              <label>Next Action</label>
              <input
                type="text"
                value={formData.next_action}
                onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
                placeholder="e.g., Follow up with Alex, Request LOI, Send KYC"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '15px' }}
              />
            </div>
            <div style={{ marginTop: '15px' }}>
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional details..."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
              />
            </div>
            <button
              type="submit"
              style={{ marginTop: '15px', padding: '10px 20px', background: '#27ae60', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Create Deal
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>Filter Deals</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div>
            <label>Search (Commodity/Notes)</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label>Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Stages</option>
              <option value="inquiry">Inquiry</option>
              <option value="loi_draft">LOI Draft</option>
              <option value="loi_sent">LOI Sent</option>
              <option value="ncnda_signed">NCNDA Signed</option>
              <option value="kyc_approved">KYC Approved</option>
              <option value="imfpa_signed">IMFPA Signed</option>
              <option value="spa_signed">SPA Signed</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>
          </div>
          <div>
            <label>Commodity</label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">All Commodities</option>
              {getUniqueCommodities().map((commodity) => (
                <option key={commodity} value={commodity}>
                  {commodity}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Active Deals ({getFilteredDeals().length})</h2>
        {deals.length === 0 ? (
          <p style={{ color: '#666' }}>No deals yet. Create your first deal above.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Commodity</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Tonnage</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Value (USD)</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Stage</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Commission</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredDeals().map((deal) => (
                  <tr key={deal.id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => router.push(`/crm/deals/${deal.id}`)}>
                    <td style={{ padding: '10px' }}>{deal.commodity}</td>
                    <td style={{ padding: '10px' }}>{deal.tonnage.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>${deal.total_value?.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ background: stageColor(deal.stage), color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {deal.stage.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>${deal.expected_commission?.toLocaleString()}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      {new Date(deal.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button
                        onClick={() => generateLOI(deal.id)}
                        disabled={loiLoading || ncndaLoading || kycLoading || imfpaLoading || spaLoading}
                        style={{
                          marginRight: '4px',
                          padding: '4px 8px',
                          background: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loiLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: loiLoading ? 0.6 : 1
                        }}
                      >
                        {loiLoading ? 'Gen...' : 'LOI'}
                      </button>
                      <button
                        onClick={() => generateNCNDA(deal.id)}
                        disabled={ncndaLoading || loiLoading || kycLoading || imfpaLoading || spaLoading}
                        style={{
                          marginRight: '4px',
                          padding: '4px 8px',
                          background: '#9b59b6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: ncndaLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: ncndaLoading ? 0.6 : 1
                        }}
                      >
                        {ncndaLoading ? 'Gen...' : 'NCNDA'}
                      </button>
                      <button
                        onClick={() => generateKYC(deal.id)}
                        disabled={kycLoading || loiLoading || ncndaLoading || imfpaLoading || spaLoading}
                        style={{
                          marginRight: '4px',
                          padding: '4px 8px',
                          background: '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: kycLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: kycLoading ? 0.6 : 1
                        }}
                      >
                        {kycLoading ? 'Gen...' : 'KYC'}
                      </button>
                      <button
                        onClick={() => generateIMFPA(deal.id)}
                        disabled={imfpaLoading || loiLoading || ncndaLoading || kycLoading || spaLoading}
                        style={{
                          marginRight: '4px',
                          padding: '4px 8px',
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: imfpaLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: imfpaLoading ? 0.6 : 1
                        }}
                      >
                        {imfpaLoading ? 'Gen...' : 'IMFPA'}
                      </button>
                      <button
                        onClick={() => generateSPA(deal.id)}
                        disabled={spaLoading || loiLoading || ncndaLoading || kycLoading || imfpaLoading}
                        style={{
                          marginLeft: '4px',
                          padding: '4px 8px',
                          background: '#f39c12',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: spaLoading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: spaLoading ? 0.6 : 1
                        }}
                      >
                        {spaLoading ? 'Gen...' : 'SPA'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDocument && (
        <div className="card" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Generated {selectedDocument.type} - Deal {selectedDocument.dealId}</h2>
            <button
              onClick={() => {
                setSelectedDocument(null)
                setSavedDocuments([])
                setViewingDocument(null)
              }}
              style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
          <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.5' }}>
            {selectedDocument.text}
          </pre>
          <button
            onClick={downloadLOI}
            style={{
              marginTop: '10px',
              padding: '10px 16px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Download .txt
          </button>
        </div>
      )}

      {selectedDocument && savedDocuments.length > 0 && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h2>Saved Documents - Deal {selectedDocument.dealId}</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Generated</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
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
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      <button
                        onClick={() => viewSavedDocument(doc.id)}
                        style={{
                          marginRight: '4px',
                          padding: '4px 8px',
                          background: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        View
                      </button>
                      {doc.status === 'draft' && (
                        <button
                          onClick={() => updateDocumentStatus(doc.id, 'sent')}
                          style={{
                            marginRight: '4px',
                            padding: '4px 8px',
                            background: '#27ae60',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Send
                        </button>
                      )}
                      {(doc.status === 'draft' || doc.status === 'sent') && (
                        <button
                          onClick={() => updateDocumentStatus(doc.id, 'signed')}
                          style={{
                            padding: '4px 8px',
                            background: '#9b59b6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Sign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedDocument && savedDocuments.length > 0 && (
        <div className="card" style={{ marginTop: '20px', background: '#f8f9fa' }}>
          <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Deal Readiness Checklist</h3>

          {(() => {
            const dealId = selectedDocument.dealId
            const fcoMarked = fcoMarkedDeals.has(dealId)
            const readiness = calculateDealReadiness(savedDocuments, fcoMarked)

            return (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>
                    COMPLETED DOCUMENTS
                  </div>
                  {readiness.completed.length > 0 ? (
                    <div style={{ marginLeft: '15px' }}>
                      {readiness.completed.map((doc, idx) => (
                        <div key={idx} style={{ fontSize: '12px', marginBottom: '6px', color: '#333' }}>
                          ✅ {doc.type}
                          <span style={{ color: '#666', marginLeft: '10px' }}>
                            ({doc.status}, {doc.date})
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginLeft: '15px', fontSize: '12px', color: '#999' }}>
                      No documents yet
                    </div>
                  )}
                </div>

                {/* FCO Status Section */}
                <div style={{ marginBottom: '20px', padding: '12px', background: '#fff9e6', borderLeft: '4px solid #f39c12', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>
                    FCO STATUS
                  </div>
                  {fcoMarked ? (
                    <div style={{ fontSize: '12px', color: '#27ae60', marginBottom: '8px' }}>
                      ✅ FCO received and reviewed
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#e74c3c', marginBottom: '8px' }}>
                      ⏳ Awaiting FCO from seller (Full Corporate Offer)
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const newSet = new Set(fcoMarkedDeals)
                      if (fcoMarked) {
                        newSet.delete(dealId)
                      } else {
                        newSet.add(dealId)
                      }
                      setFcoMarkedDeals(newSet)
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      background: fcoMarked ? '#e74c3c' : '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {fcoMarked ? 'Mark as Pending' : 'Mark FCO Received'}
                  </button>
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '8px', fontStyle: 'italic' }}>
                    Temporary local marker — not saved to database
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>
                    AWAITING
                  </div>
                  <div style={{ marginLeft: '15px' }}>
                    {readiness.missing.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '12px', marginBottom: '6px', color: '#e74c3c' }}>
                        ⏳ {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>
                    NEXT ACTIONS
                  </div>
                  <div style={{ marginLeft: '15px' }}>
                    {readiness.nextActions.map((action, idx) => (
                      <div key={idx} style={{ fontSize: '12px', marginBottom: '6px', color: '#3498db' }}>
                        → {action}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#e8f4f8', borderLeft: '4px solid #3498db', borderRadius: '4px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2c3e50' }}>
                    🚀 Readiness Status
                  </div>
                  <div style={{ fontSize: '12px', color: '#333', marginTop: '5px' }}>
                    {readiness.readinessStatus}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {viewingDocument && (
        <div className="card" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Saved {viewingDocument.type.toUpperCase()} Document</h2>
            <button
              onClick={() => setViewingDocument(null)}
              style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
          <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.5' }}>
            {viewingDocument.content}
          </pre>
          <button
            onClick={downloadSavedDocument}
            style={{
              marginTop: '10px',
              padding: '10px 16px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Download saved .txt
          </button>
          <button
            onClick={() => downloadDocumentAsPDF()}
            style={{
              marginLeft: '10px',
              marginTop: '10px',
              padding: '10px 16px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  )
}

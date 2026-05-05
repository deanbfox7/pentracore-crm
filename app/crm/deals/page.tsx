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
  const [selectedLOI, setSelectedLOI] = useState<{ dealId: number; text: string; type: string } | null>(null)
  const [loiLoading, setLoiLoading] = useState(false)
  const [ncndaLoading, setNcndaLoading] = useState(false)
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([])
  const [viewingDocument, setViewingDocument] = useState<{ id: number; content: string; type: string } | null>(null)
  const [formData, setFormData] = useState({
    commodity: '',
    tonnage: 0,
    price_per_unit: 0,
    total_value: 0,
    stage: 'inquiry',
    expected_commission: 0,
    notes: ''
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
        commodity: '',
        tonnage: 0,
        price_per_unit: 0,
        total_value: 0,
        stage: 'inquiry',
        expected_commission: 0,
        notes: ''
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
      setSelectedLOI({ dealId, text: data.loi_text, type: 'LOI' })
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
      setSelectedLOI({ dealId, text: data.ncnda_text, type: 'NCNDA' })
      setError('')
      await fetchSavedDocuments(dealId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setNcndaLoading(false)
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

    const html2pdfModule = await import('html2pdf.js')
    const html2pdf = html2pdfModule.default

    const today = new Date().toISOString().split('T')[0]
    const docType = viewingDocument.type.toUpperCase()

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #2c3e50;">PentraCore International</h1>
          <p style="margin: 5px 0; color: #666;">Commodity Trade Facilitation</p>
        </div>

        <div style="margin-bottom: 20px;">
          <p><strong>Document Type:</strong> ${docType}</p>
          <p><strong>Generated:</strong> ${today}</p>
        </div>

        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', monospace; font-size: 10pt;">
${viewingDocument.content}
        </pre>

        <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 30px; text-align: center; color: #999; font-size: 10px;">
          <p>Generated by PentraCore International | Confidential</p>
        </div>
      </div>
    `

    const opt = {
      margin: 10,
      filename: `${docType}-${today}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' }
    }

    html2pdf().set(opt).from(htmlContent).save()
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
      await fetchSavedDocuments(selectedLOI?.dealId || 0)
      setError('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  function downloadLOI() {
    if (!selectedLOI) return
    const element = document.createElement('a')
    const file = new Blob([selectedLOI.text], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `LOI-Deal-${selectedLOI.dealId}.txt`
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
          <h2>Create New Deal</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                <label>Price per Unit (USD) *</label>
                <input
                  type="number"
                  required
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) })}
                  placeholder="0"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Total Value (USD) *</label>
                <input
                  type="number"
                  required
                  value={formData.total_value}
                  onChange={(e) => setFormData({ ...formData, total_value: parseFloat(e.target.value) })}
                  placeholder="0"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label>Stage *</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
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
                <label>Expected Commission (USD)</label>
                <input
                  type="number"
                  value={formData.expected_commission}
                  onChange={(e) => setFormData({ ...formData, expected_commission: parseFloat(e.target.value) })}
                  placeholder="0"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
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

      <div className="card">
        <h2>Active Deals ({deals.length})</h2>
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
                {deals.map((deal) => (
                  <tr key={deal.id} style={{ borderBottom: '1px solid #eee' }}>
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
                        disabled={loiLoading || ncndaLoading}
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
                        disabled={ncndaLoading || loiLoading}
                        style={{
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLOI && (
        <div className="card" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Generated {selectedLOI.type} - Deal {selectedLOI.dealId}</h2>
            <button
              onClick={() => {
                setSelectedLOI(null)
                setSavedDocuments([])
                setViewingDocument(null)
              }}
              style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
          <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.5' }}>
            {selectedLOI.text}
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

      {selectedLOI && savedDocuments.length > 0 && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h2>Saved Documents - Deal {selectedLOI.dealId}</h2>
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

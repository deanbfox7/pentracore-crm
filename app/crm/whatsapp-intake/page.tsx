'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { parseWhatsAppExport, extractDealIntelligence, ParsedMessage, ExtractedIntelligence } from '@/lib/whatsapp-parser'

export default function WhatsAppIntakePage() {
  const [textInput, setTextInput] = useState('')
  const [parsedMessages, setParsedMessages] = useState<ParsedMessage[]>([])
  const [intelligence, setIntelligence] = useState<ExtractedIntelligence | null>(null)
  const [error, setError] = useState('')
  const [showMessages, setShowMessages] = useState(false)
  const { user, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!session || user?.email !== 'deanbfox@gmail.com') {
      router.push('/')
      return
    }
  }, [user, session, router])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setTextInput(content)
      setError('')
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }

  function handleParse() {
    if (!textInput.trim()) {
      setError('Please paste or upload a WhatsApp export')
      return
    }

    try {
      const messages = parseWhatsAppExport(textInput)
      if (messages.length === 0) {
        setError('No messages found. Please check the export format: [timestamp] Sender: message')
        return
      }

      const intel = extractDealIntelligence(messages)
      setParsedMessages(messages)
      setIntelligence(intel)
      setError('')
      setShowMessages(false)
    } catch (err: any) {
      setError(`Failed to parse: ${err.message}`)
    }
  }

  function handleCreateDraft() {
    if (!intelligence) return

    const dealData = {
      commodity: intelligence.commodities[0] || 'Unknown',
      origin_country: intelligence.locations[0] || null,
      counterparty_name: intelligence.buyers[0] || intelligence.sellers[0] || 'To Be Confirmed',
      target_price: extractFirstNumber(intelligence.prices),
      tonnage: extractFirstNumber(intelligence.quantities),
      notes: formatNotesFromIntelligence(intelligence)
    }

    router.push(`/crm/deals?draft=${JSON.stringify(dealData)}`)
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>WhatsApp Deal Intake</h1>
        <Link href="/crm/deals" style={{ padding: '8px 16px', background: '#666', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
          Back to Deals
        </Link>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="card" style={{ marginBottom: '30px' }}>
        <h2>Import WhatsApp Export</h2>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '15px' }}>
          Export a WhatsApp group chat (WhatsApp → More → Export chat) and paste the text below, or upload the .txt file.
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Option 1: Upload File
          </label>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px', textAlign: 'center', color: '#999', fontSize: '12px' }}>— OR —</div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Option 2: Paste Text
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste WhatsApp export text here..."
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}
          />
        </div>

        <button
          onClick={handleParse}
          style={{
            padding: '10px 20px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Parse & Extract Intelligence
        </button>
      </div>

      {intelligence && (
        <>
          <div className="card" style={{ marginBottom: '30px', background: '#f8f9fa' }}>
            <h2>📊 Deal Summary</h2>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '15px' }}>
              {intelligence.summary}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <p style={{ color: '#666', fontSize: '12px', fontWeight: 'bold' }}>COMMODITIES</p>
                <p style={{ fontSize: '14px' }}>
                  {intelligence.commodities.length > 0 ? intelligence.commodities.join(', ') : 'Not identified'}
                </p>
              </div>
              <div>
                <p style={{ color: '#666', fontSize: '12px', fontWeight: 'bold' }}>LOCATIONS</p>
                <p style={{ fontSize: '14px' }}>
                  {intelligence.locations.length > 0 ? intelligence.locations.join(', ') : 'Not identified'}
                </p>
              </div>
              <div>
                <p style={{ color: '#666', fontSize: '12px', fontWeight: 'bold' }}>QUANTITIES</p>
                <p style={{ fontSize: '14px' }}>
                  {intelligence.quantities.length > 0 ? intelligence.quantities.join(', ') : 'Not specified'}
                </p>
              </div>
              <div>
                <p style={{ color: '#666', fontSize: '12px', fontWeight: 'bold' }}>PRICING</p>
                <p style={{ fontSize: '14px' }}>
                  {intelligence.prices.length > 0 ? intelligence.prices.join(', ') : 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>👥 Parties Involved</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ color: '#666', fontSize: '12px', fontWeight: 'bold' }}>POTENTIAL BUYERS</p>
                <div>
                  {intelligence.buyers.length > 0 ? (
                    intelligence.buyers.map((buyer, idx) => (
                      <div key={idx} style={{ fontSize: '14px', marginBottom: '6px', padding: '6px 12px', background: '#e8f5e9', borderRadius: '4px' }}>
                        {buyer}
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '13px', color: '#999' }}>Not identified</p>
                  )}
                </div>
              </div>
              <div>
                <p style={{ color: '#666', fontSize: '12px', fontWeight: 'bold' }}>POTENTIAL SELLERS</p>
                <div>
                  {intelligence.sellers.length > 0 ? (
                    intelligence.sellers.map((seller, idx) => (
                      <div key={idx} style={{ fontSize: '14px', marginBottom: '6px', padding: '6px 12px', background: '#fff3e0', borderRadius: '4px' }}>
                        {seller}
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '13px', color: '#999' }}>Not identified</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>⚠️ Red Flags & Missing Info</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ color: '#666', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>RED FLAGS</p>
                {intelligence.redFlags.length > 0 ? (
                  intelligence.redFlags.map((flag, idx) => (
                    <div key={idx} style={{ fontSize: '13px', marginBottom: '8px', padding: '8px 12px', background: '#ffebee', borderLeft: '3px solid #e74c3c', borderRadius: '2px' }}>
                      🚩 {flag}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '13px', color: '#27ae60' }}>✓ No major red flags detected</p>
                )}
              </div>
              <div>
                <p style={{ color: '#666', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>MISSING INFO</p>
                {intelligence.missingInfo.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '13px', marginBottom: '8px', padding: '8px 12px', background: '#fff9c4', borderLeft: '3px solid #f39c12', borderRadius: '2px' }}>
                    ⚠️ {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '30px', background: '#e3f2fd' }}>
            <h2>📋 Documents Referenced</h2>
            <div style={{ marginBottom: '15px' }}>
              {intelligence.documentsReferenced.length > 0 ? (
                intelligence.documentsReferenced.map((doc, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-block',
                      marginRight: '8px',
                      marginBottom: '8px',
                      padding: '6px 12px',
                      background: '#2196f3',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {doc}
                  </span>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: '#666' }}>No documents mentioned</p>
              )}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>➡️ Recommended Next Actions</h2>
            <ol style={{ paddingLeft: '20px' }}>
              {intelligence.nextActions.map((action, idx) => (
                <li key={idx} style={{ fontSize: '14px', marginBottom: '8px', color: '#333' }}>
                  {action}
                </li>
              ))}
            </ol>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
            <button
              onClick={handleCreateDraft}
              style={{
                padding: '12px 20px',
                background: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              ✏️ Create Draft Deal
            </button>
            <button
              onClick={() => {
                setTextInput('')
                setParsedMessages([])
                setIntelligence(null)
                setShowMessages(false)
              }}
              style={{
                padding: '12px 20px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Start Over
            </button>
          </div>

          {parsedMessages.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2>📨 Parsed Messages ({parsedMessages.length})</h2>
                <button
                  onClick={() => setShowMessages(!showMessages)}
                  style={{
                    padding: '6px 12px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showMessages ? 'Hide' : 'Show'}
                </button>
              </div>

              {showMessages && (
                <div style={{ maxHeight: '400px', overflowY: 'auto', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                  {parsedMessages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{msg.sender}</span>
                        <span style={{ fontSize: '11px', color: '#999' }}>{msg.timestamp}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#333', margin: '4px 0' }}>
                        {msg.text}
                        {msg.hasMedia && <span style={{ color: '#f39c12', marginLeft: '8px' }}>[Media]</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function extractFirstNumber(items: string[]): number | null {
  for (const item of items) {
    const match = item.match(/\d+(?:,\d{3})*(?:\.\d+)?/)
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''))
    }
  }
  return null
}

function formatNotesFromIntelligence(intelligence: ExtractedIntelligence): string {
  const lines: string[] = [
    `Source: WhatsApp intake`,
    `Status: Draft from chat analysis`,
    '',
    intelligence.summary,
    ''
  ]

  if (intelligence.redFlags.length > 0) {
    lines.push('⚠️ Red Flags:')
    intelligence.redFlags.forEach(flag => lines.push(`  - ${flag}`))
    lines.push('')
  }

  if (intelligence.missingInfo.length > 0) {
    lines.push('📋 Missing Information:')
    intelligence.missingInfo.forEach(item => lines.push(`  - ${item}`))
    lines.push('')
  }

  lines.push('📝 Next Steps:')
  intelligence.nextActions.forEach(action => lines.push(`  - ${action}`))

  return lines.join('\n')
}

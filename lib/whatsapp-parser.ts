export interface ParsedMessage {
  timestamp: string
  sender: string
  text: string
  hasMedia: boolean
}

export interface ExtractedIntelligence {
  commodities: string[]
  locations: string[]
  buyers: string[]
  sellers: string[]
  prices: string[]
  quantities: string[]
  documentsReferenced: string[]
  redFlags: string[]
  missingInfo: string[]
  nextActions: string[]
  summary: string
}

export function parseWhatsAppExport(text: string): ParsedMessage[] {
  const lines = text.split('\n')
  const messages: ParsedMessage[] = []

  const messagePattern = /^\[(.+?)\]\s+(.+?):\s*(.*)$/

  for (const line of lines) {
    if (!line.trim()) continue

    const match = line.match(messagePattern)
    if (!match) continue

    const [, timestamp, sender, content] = match
    const hasMedia = content.includes('<Media omitted>') || content.toLowerCase().includes('attached')

    messages.push({
      timestamp: timestamp.trim(),
      sender: sender.trim(),
      text: content.trim(),
      hasMedia
    })
  }

  return messages
}

export function extractDealIntelligence(messages: ParsedMessage[]): ExtractedIntelligence {
  const fullText = messages.map(m => `${m.sender}: ${m.text}`).join('\n')

  const commodities = extractCommodities(fullText)
  const locations = extractLocations(fullText)
  const { buyers, sellers } = extractParties(fullText)
  const prices = extractPrices(fullText)
  const quantities = extractQuantities(fullText)
  const documentsReferenced = extractDocuments(fullText)
  const redFlags = extractRedFlags(fullText)
  const missingInfo = identifyMissing(commodities, locations, buyers, sellers, prices, quantities)
  const nextActions = suggestNextActions(commodities, locations, buyers, sellers, documentsReferenced)

  return {
    commodities,
    locations,
    buyers,
    sellers,
    prices,
    quantities,
    documentsReferenced,
    redFlags,
    missingInfo,
    nextActions,
    summary: buildSummary(commodities, locations, buyers, sellers, prices, quantities)
  }
}

function extractCommodities(text: string): string[] {
  const commodities = [
    'iron ore', 'cobalt', 'gold', 'copper', 'lithium', 'aluminum', 'tin', 'diamonds',
    'manganese', 'nickel', 'zinc', 'lead', 'chrome', 'bauxite', 'coal', 'oil', 'gas',
    'ore', 'mineral', 'metal'
  ]

  const found = new Set<string>()
  const lowerText = text.toLowerCase()

  for (const commodity of commodities) {
    if (lowerText.includes(commodity)) {
      found.add(commodity.charAt(0).toUpperCase() + commodity.slice(1))
    }
  }

  return Array.from(found)
}

function extractLocations(text: string): string[] {
  const countries = [
    'ghana', 'kenya', 'south africa', 'zambia', 'drc', 'congo', 'nigeria', 'zimbabwe',
    'malawi', 'tanzania', 'cameroon', 'guinea', 'liberia', 'sierra leone', 'ivory coast',
    'uganda', 'senegal', 'benin', 'togo', 'burundi', 'rwanda', 'ethiopia', 'sudan'
  ]

  const found = new Set<string>()
  const lowerText = text.toLowerCase()

  for (const country of countries) {
    if (lowerText.includes(country)) {
      found.add(country.charAt(0).toUpperCase() + country.slice(1))
    }
  }

  return Array.from(found)
}

function extractParties(text: string): { buyers: string[]; sellers: string[] } {
  const buyers = new Set<string>()
  const sellers = new Set<string>()

  const buyerPatterns = ['buyer:', 'buyer is', 'buying', 'purchas', 'interested in buying']
  const sellerPatterns = ['seller:', 'seller is', 'selling', 'supplier', 'source', 'owner']

  const lowerText = text.toLowerCase()

  // Simple extraction: look for names after keywords
  const lines = text.split('\n')

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    for (const pattern of buyerPatterns) {
      if (lowerLine.includes(pattern)) {
        const names = extractNamesFromContext(line)
        names.forEach(n => buyers.add(n))
      }
    }
    for (const pattern of sellerPatterns) {
      if (lowerLine.includes(pattern)) {
        const names = extractNamesFromContext(line)
        names.forEach(n => sellers.add(n))
      }
    }
  }

  return {
    buyers: Array.from(buyers),
    sellers: Array.from(sellers)
  }
}

function extractNamesFromContext(text: string): string[] {
  const namePattern = /(?:^|\s|:)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  const matches = text.matchAll(namePattern)
  const names: string[] = []

  for (const match of matches) {
    const name = match[1].trim()
    if (name.length > 2 && name.length < 50 && !['Media', 'Omitted', 'From', 'The'].includes(name)) {
      names.push(name)
    }
  }

  return names
}

function extractPrices(text: string): string[] {
  const pricePattern = /(?:USD|USD\s|usd|\$|per\s+(?:mt|ton|tonne)|price)\s*[\d,]+(?:\.\d{2})?/gi
  const matches = text.match(pricePattern) || []
  return Array.from(new Set(matches.map(m => m.trim())))
}

function extractQuantities(text: string): string[] {
  const quantityPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:mt|metric\s*ton|tonne|ton|kg|barrel|lot|unit)/gi
  const matches = text.match(quantityPattern) || []
  return Array.from(new Set(matches.map(m => m.trim())))
}

function extractDocuments(text: string): string[] {
  const documents = new Set<string>()
  const docPatterns = ['loi', 'ncnda', 'kyc', 'imfpa', 'spa', 'contract', 'agreement', 'offer', 'pro forma', 'pi', 'packing list']

  const lowerText = text.toLowerCase()
  for (const doc of docPatterns) {
    if (lowerText.includes(doc)) {
      documents.add(doc.toUpperCase())
    }
  }

  return Array.from(documents)
}

function extractRedFlags(text: string): string[] {
  const redFlags: string[] = []
  const lowerText = text.toLowerCase()

  const flagPatterns = [
    { pattern: /rush|urgent|asap|immediately/i, flag: 'Urgency pressure from counterparty' },
    { pattern: /guarantee|guarantee/i, flag: 'Unusual guarantee request' },
    { pattern: /advance|upfront|deposit/i, flag: 'Advance payment requested' },
    { pattern: /bypass|circumvent|skip.*kyc|skip.*verification/i, flag: 'Request to bypass compliance' },
    { pattern: /no\s+(?:contract|agreement|documentation)/i, flag: 'Resistance to documentation' },
    { pattern: /cash\s+only|no\s+bank|payment\s+outside/i, flag: 'Unusual payment terms' },
    { pattern: /secret|confidential|don't.*tell|not\s+mention/i, flag: 'Secrecy requests (non-standard)' }
  ]

  for (const { pattern, flag } of flagPatterns) {
    if (pattern.test(text)) {
      redFlags.push(flag)
    }
  }

  return redFlags
}

function identifyMissing(
  commodities: string[],
  locations: string[],
  buyers: string[],
  sellers: string[],
  prices: string[],
  quantities: string[]
): string[] {
  const missing: string[] = []

  if (commodities.length === 0) missing.push('Commodity not specified')
  if (locations.length === 0) missing.push('Origin/destination location not clear')
  if (buyers.length === 0) missing.push('Buyer identity/details')
  if (sellers.length === 0) missing.push('Seller identity/details')
  if (prices.length === 0) missing.push('Price/pricing terms')
  if (quantities.length === 0) missing.push('Quantity/tonnage')
  if (missing.length === 0) missing.push('No major gaps identified')

  return missing
}

function suggestNextActions(
  commodities: string[],
  locations: string[],
  buyers: string[],
  sellers: string[],
  documentsReferenced: string[]
): string[] {
  const actions: string[] = []

  if (commodities.length > 0 && buyers.length > 0 && sellers.length > 0) {
    actions.push('Initiate NCNDA with both parties')
    actions.push('Request full corporate details for KYC')
  }

  if (!documentsReferenced.includes('NCNDA')) {
    actions.push('Prepare NCNDA for signature')
  }

  if (!documentsReferenced.includes('LOI')) {
    actions.push('Draft Letter of Intent with terms')
  }

  if (buyers.length > 0 && sellers.length > 0) {
    actions.push('Schedule three-way call to confirm terms')
  }

  if (actions.length === 0) {
    actions.push('Gather additional details on commodity, parties, and pricing')
  }

  return actions
}

function buildSummary(
  commodities: string[],
  locations: string[],
  buyers: string[],
  sellers: string[],
  prices: string[],
  quantities: string[]
): string {
  const parts: string[] = []

  if (commodities.length > 0) {
    parts.push(`Commodities: ${commodities.join(', ')}`)
  }

  if (locations.length > 0) {
    parts.push(`Locations: ${locations.join(', ')}`)
  }

  if (buyers.length > 0) {
    parts.push(`Potential Buyers: ${buyers.join(', ')}`)
  }

  if (sellers.length > 0) {
    parts.push(`Potential Sellers: ${sellers.join(', ')}`)
  }

  if (quantities.length > 0) {
    parts.push(`Quantities: ${quantities.join(', ')}`)
  }

  if (prices.length > 0) {
    parts.push(`Pricing: ${prices.join(', ')}`)
  }

  return parts.length > 0 ? parts.join(' | ') : 'No clear deal information extracted'
}

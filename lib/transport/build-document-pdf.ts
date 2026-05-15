import PDFDocument from 'pdfkit'

export interface DocumentPdfAttachment {
  filename: string
  content: string
  content_type: string
}

export function buildDocumentPdf(
  documentType: string,
  dealId: number,
  documentContent: string
): DocumentPdfAttachment {
  const filename = `${documentType.toUpperCase()}-DEAL-${dealId}-v1.pdf`

  const doc = new PDFDocument({ margin: 50 })
  let pdfBuffer = Buffer.alloc(0)

  doc.on('data', (chunk: Buffer) => {
    pdfBuffer = Buffer.concat([pdfBuffer, chunk])
  })

  // Set up PDF header
  doc.fontSize(16).font('Helvetica-Bold').text('PentraCore International', { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(14).font('Helvetica-Bold').text(getDocumentTitle(documentType), { align: 'center' })
  doc.fontSize(10).text(`Deal #${dealId}`, { align: 'center' })
  doc.moveDown(1)

  // Add document content as plain text (operational rendering)
  doc.fontSize(11).font('Helvetica')
  const lines = documentContent.split('\n')
  lines.forEach((line: string) => {
    doc.text(line || ' ', { align: 'left' })
  })

  doc.moveDown(1)

  // Add footer
  doc.fontSize(9).fillColor('#999999')
  doc.text(
    'This document is confidential and proprietary. © 2026 PentraCore International. All rights reserved.',
    { align: 'center' }
  )

  doc.end()

  return {
    filename,
    content: pdfBuffer.toString('base64'),
    content_type: 'application/pdf'
  }
}

function getDocumentTitle(documentType: string): string {
  const titles: Record<string, string> = {
    loi: 'Letter of Intent',
    ncnda: 'Non-Circumvention & Non-Disclosure Agreement',
    kyc: 'Know Your Customer (KYC) Form',
    imfpa: 'Instrument for Form of Payment Agreement',
    spa: 'Sale and Purchase Agreement'
  }
  return titles[documentType] || documentType
}

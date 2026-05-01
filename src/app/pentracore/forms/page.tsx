'use client'

import { useState } from 'react'

type FormType = 'ncnda' | 'kyc' | 'imfpa'

const FORM_TEMPLATES = {
  ncnda: {
    title: 'Non-Circumvention, Non-Disclosure Agreement (NCNDA)',
    fields: [
      { name: 'party_name', label: 'Your Full Legal Name / Company Name', type: 'text' },
      { name: 'party_email', label: 'Email Address', type: 'email' },
      { name: 'party_phone', label: 'Phone Number', type: 'tel' },
      { name: 'commodity', label: 'Commodity of Interest', type: 'text' },
      { name: 'role', label: 'Your Role (Buyer / Seller / Investor)', type: 'select', options: ['Buyer', 'Seller', 'Investor', 'Mandate Holder'] },
    ],
    description: 'Standard NCNDA required before discussing pricing, volumes, or counterparties.',
  },
  kyc: {
    title: 'Know Your Customer (KYC) Questionnaire',
    fields: [
      { name: 'legal_name', label: 'Legal Entity Name', type: 'text' },
      { name: 'registration_number', label: 'Company Registration / Tax ID', type: 'text' },
      { name: 'country_of_incorporation', label: 'Country of Incorporation', type: 'text' },
      { name: 'beneficial_owners', label: 'Beneficial Owner(s) Names', type: 'textarea' },
      { name: 'banking_details', label: 'Primary Banking Contact', type: 'text' },
      { name: 'sanctions_declaration', label: 'Are you or any beneficial owner on OFAC, UN, EU, or UK sanctions lists?', type: 'select', options: ['No', 'Yes (declare below)', 'Unclear'] },
      { name: 'pep_declaration', label: 'Any Politically Exposed Persons (PEPs) involved?', type: 'select', options: ['No', 'Yes (declare below)', 'Unclear'] },
    ],
    description: 'Compliance requirement. All parties must pass KYC before proceeding to LOI.',
  },
  imfpa: {
    title: 'Intermediary Mission and Fee Protection Agreement (IMFPA)',
    fields: [
      { name: 'intermediary_name', label: 'Intermediary / Mandate Holder Name', type: 'text' },
      { name: 'buyer_name', label: 'Buyer Name (if known)', type: 'text' },
      { name: 'seller_name', label: 'Seller Name (if known)', type: 'text' },
      { name: 'commodity_spec', label: 'Commodity & Volume', type: 'text' },
      { name: 'commission_rate', label: 'Commission Rate (%)', type: 'number' },
      { name: 'payment_terms', label: 'Payment Terms (upon signing / closing / other)', type: 'text' },
      { name: 'exclusivity_period', label: 'Exclusivity Period (days)', type: 'number' },
    ],
    description: 'Commission protection agreement. Signed before SPA to protect intermediary fees.',
  },
}

export default function FormsPage() {
  const [selectedForm, setSelectedForm] = useState<FormType>('ncnda')
  const [formData, setFormData] = useState<Record<string, string | number>>({})
  const [submitted, setSubmitted] = useState(false)

  const form = FORM_TEMPLATES[selectedForm]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(`${selectedForm.toUpperCase()} Submitted:`, formData)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const handleDownload = () => {
    const dataStr = JSON.stringify({ form: selectedForm, data: formData }, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedForm}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Compliance Forms</h1>

        {/* Form Selector */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Object.entries(FORM_TEMPLATES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedForm(key as FormType)
                setFormData({})
              }}
              className={`p-4 rounded border-2 text-center font-semibold transition ${
                selectedForm === key
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h2>
          <p className="text-gray-600 mb-6">{form.description}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">— Select —</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Submit & Save
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
              >
                Download JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({})
                  setSubmitted(false)
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Success Message */}
          {submitted && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              ✓ Form saved. Download a copy or submit via email to PentraCore team.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Email completed forms to: <strong>info@pentracoreinternational.com</strong></p>
        </div>
      </div>
    </div>
  )
}

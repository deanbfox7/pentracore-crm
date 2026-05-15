'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COMMODITIES, INDUSTRIES, STAGES } from '@/lib/utils'
import { Lead } from '@/types'

interface Props { lead?: Lead }

export default function LeadForm({ lead }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [commodities, setCommodities] = useState<string[]>(lead?.commodities_of_interest || [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const form = new FormData(e.currentTarget)
      const data = {
        first_name: form.get('first_name') as string,
        last_name: form.get('last_name') as string,
        email: form.get('email') as string || null,
        phone: form.get('phone') as string || null,
        linkedin_url: form.get('linkedin_url') as string || null,
        company_name: form.get('company_name') as string,
        company_website: form.get('company_website') as string || null,
        industry: form.get('industry') as string || null,
        company_size: form.get('company_size') as string || null,
        country: form.get('country') as string,
        city: form.get('city') as string || null,
        commodities_of_interest: commodities,
        estimated_volume: form.get('estimated_volume') as string || null,
        stage: form.get('stage') as string,
        notes: form.get('notes') as string || null,
        estimated_deal_value: Number(form.get('estimated_deal_value')) || null,
        source: lead ? undefined : 'manual',
      }

      let result
      if (lead) {
        result = await supabase.from('leads').update(data).eq('id', lead.id).select().single()
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        result = await supabase.from('leads').insert({ ...data, owner_id: user.id }).select().single()
      }

      if (result.error) setError(result.error.message)
      else router.push(`/leads/${result.data.id}`)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, name: string, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-sm text-slate-400 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input type={type} name={name} defaultValue={lead ? (lead as any)[name] || '' : ''} placeholder={placeholder} required={required}
        className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors" />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {field('First Name', 'first_name', 'text', 'John', true)}
          {field('Last Name', 'last_name', 'text', 'Smith', true)}
          {field('Email', 'email', 'email', 'john@company.com')}
          {field('Phone', 'phone', 'tel', '+1 234 567 8900')}
          {field('LinkedIn URL', 'linkedin_url', 'url', 'linkedin.com/in/johnsmith')}
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Company Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {field('Company Name', 'company_name', 'text', 'Acme Steel Corp', true)}
          {field('Website', 'company_website', 'url', 'acmesteel.com')}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Industry</label>
            <select name="industry" defaultValue={lead?.industry || ''}
              className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Company Size</label>
            <select name="company_size" defaultValue={lead?.company_size || ''}
              className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="">Select size</option>
              <option value="small">Small (1-50)</option>
              <option value="medium">Medium (51-250)</option>
              <option value="large">Large (251-1000)</option>
              <option value="enterprise">Enterprise (1000+)</option>
            </select>
          </div>
          {field('Country', 'country', 'text', 'China', true)}
          {field('City', 'city', 'text', 'Shanghai')}
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Commodity Interest</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMODITIES.map(c => (
            <button key={c} type="button"
              onClick={() => setCommodities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                commodities.includes(c)
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                  : 'bg-transparent border-[#1e293b] text-slate-400 hover:border-slate-500'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {field('Estimated Annual Volume', 'estimated_volume', 'text', 'e.g. 10,000-50,000 MT')}
          {field('Estimated Deal Value (USD)', 'estimated_deal_value', 'number', '250000')}
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Pipeline</h2>
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Stage</label>
          <select name="stage" defaultValue={lead?.stage || 'new'}
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-sm text-slate-400 mb-1.5">Notes</label>
          <textarea name="notes" defaultValue={lead?.notes || ''} rows={3} placeholder="Add any relevant notes..."
            className="w-full bg-[#0a0f1a] border border-[#1e293b] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors">
          {loading ? 'Saving...' : (lead ? 'Update Lead' : 'Add Lead')}
        </button>
        <button type="button" onClick={() => router.back()}
          className="bg-[#111827] border border-[#1e293b] text-slate-300 hover:bg-[#1e293b] rounded-lg px-5 py-2.5 text-sm transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

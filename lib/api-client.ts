// ============================================
// API CLIENT: Centralized API interaction
// All CRM API calls go through this client
// ============================================

import { Session } from '@/lib/types'

export class ApiClient {
  private baseUrl: string
  private token?: string

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || ''
  }

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = undefined
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `API Error: ${response.status}`)
    }

    return response.json()
  }

  // Leads
  async getLeads() {
    return this.request('GET', '/api/crm/leads')
  }

  async createLead(data: any) {
    return this.request('POST', '/api/crm/leads', data)
  }

  // Opportunities
  async getOpportunities() {
    return this.request('GET', '/api/crm/opportunities')
  }

  async createOpportunity(data: any) {
    return this.request('POST', '/api/crm/opportunities', data)
  }

  // Deals
  async getDeals() {
    return this.request('GET', '/api/crm/deals')
  }

  async createDeal(data: any) {
    return this.request('POST', '/api/crm/deals', data)
  }

  // Counterparties
  async getCounterparties() {
    return this.request('GET', '/api/crm/counterparties')
  }

  async createCounterparty(data: any) {
    return this.request('POST', '/api/crm/counterparties', data)
  }

  // Knowledge Base
  async getProducts() {
    return this.request('GET', '/api/knowledge/products')
  }
}

// Global instance
export const apiClient = new ApiClient()

import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const MASTER_EMAIL = 'deanbfox@gmail.com'
const MASTER_SECRET = process.env.MASTER_LOGIN_SECRET || 'pentracore-master-secret-key'
const MASTER_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

type MasterSession = {
  email: string
  timestamp: number
  signature: string
}

function signMasterSession(email: string, timestamp: number) {
  return crypto
    .createHmac('sha256', MASTER_SECRET)
    .update(`${email}:${timestamp}`)
    .digest('hex')
}

export function createMasterSession(email: string) {
  const timestamp = Date.now()

  return {
    email,
    timestamp,
    signature: signMasterSession(email, timestamp),
  }
}

export function verifyMasterSessionCookie(value?: string) {
  if (!value) return null

  try {
    const session = JSON.parse(value) as MasterSession
    const expectedSignature = signMasterSession(session.email, session.timestamp)
    const isFresh = Date.now() - session.timestamp <= MASTER_SESSION_MAX_AGE_MS

    const signature = Buffer.from(session.signature || '')
    const expected = Buffer.from(expectedSignature)

    if (
      session.email !== MASTER_EMAIL ||
      !isFresh ||
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(signature, expected)
    ) {
      return null
    }

    return {
      email: session.email,
      id: `master_${session.email}`,
    }
  } catch {
    return null
  }
}

export async function verifyDeanRequest(req: NextRequest) {
  const cookieValue = req.cookies.get('master-session')?.value
  const masterUser = verifyMasterSessionCookie(
    (() => {
      if (!cookieValue) return undefined
      const decoded = decodeURIComponent(cookieValue)
      return decoded
    })()
  )
  if (masterUser) return masterUser

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No auth token')
  }

  const token = authHeader.slice(7)
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    throw new Error('Invalid token')
  }

  if (user.email !== MASTER_EMAIL) {
    throw new Error('Forbidden: Dean only')
  }

  return user
}

async function getAuthenticatedUser(req: NextRequest) {
  const cookieValue = req.cookies.get('master-session')?.value
  const masterUser = verifyMasterSessionCookie(
    cookieValue ? decodeURIComponent(cookieValue) : undefined
  )
  if (masterUser) return masterUser

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No auth token')
  }

  const token = authHeader.slice(7)
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    throw new Error('Invalid token')
  }

  return user
}

export async function verifyKnowledgeRequest(req: NextRequest) {
  const user = await getAuthenticatedUser(req)

  if (user.email === MASTER_EMAIL) {
    return user
  }

  const { data, error } = await supabaseAdmin
    .schema('pentracore_knowledge')
    .from('knowledge_access')
    .select('email, display_name, access_type, is_active')
    .eq('email', user.email?.toLowerCase() || '')
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Forbidden: knowledge access not approved')
  }

  return user
}

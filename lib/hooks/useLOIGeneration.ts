'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { generateLOI } from '@/lib/deals/loi'

interface UseLOIGenerationOptions {
  dealId: string | number
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useLOIGeneration({ dealId, onSuccess, onError }: UseLOIGenerationOptions) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    if (!session?.access_token) {
      const msg = 'Not authenticated'
      setError(msg)
      onError?.(msg)
      return
    }

    setLoading(true)
    setError(null)

    const result = await generateLOI({
      dealId,
      token: session.access_token
    })

    setLoading(false)

    if (result.success) {
      onSuccess?.()
    } else {
      setError(result.error || 'Failed to generate LOI')
      onError?.(result.error || 'Failed to generate LOI')
    }
  }

  return { generate, loading, error }
}

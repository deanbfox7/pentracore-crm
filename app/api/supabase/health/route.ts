import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ''

function envStatus(value: string) {
  return {
    present: Boolean(value),
    length: value.length,
  }
}

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: envStatus(supabaseUrl),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: envStatus(supabaseAnonKey),
    SUPABASE_SERVICE_ROLE_KEY: envStatus(supabaseServiceKey),
  }

  const response = {
    ok: false,
    project: {
      ref: 'gwytwgdedfazwrxosmxh',
      host: null as string | null,
    },
    env,
    checks: {
      envReady: Boolean(supabaseUrl && supabaseAnonKey),
      productsReadable: false,
      productCount: null as number | null,
      error: null as string | null,
    },
  }

  if (supabaseUrl) {
    try {
      response.project.host = new URL(supabaseUrl).host
    } catch (error) {
      response.checks.error = 'Supabase URL is not a valid URL.'
      return NextResponse.json(response, { status: 200 })
    }
  }

  if (response.project.host && !response.project.host.endsWith('.supabase.co')) {
    response.checks.error = 'Supabase URL must look like https://PROJECT_REF.supabase.co.'
    return NextResponse.json(response, { status: 200 })
  }

  if (!response.checks.envReady) {
    response.checks.error = 'Supabase URL or public key is missing.'
    return NextResponse.json(response, { status: 200 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { count, error } = await supabase
      .schema('pentracore_knowledge')
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (error) {
      response.checks.error = error.message
      return NextResponse.json(response, { status: 200 })
    }

    response.ok = true
    response.checks.productsReadable = true
    response.checks.productCount = count || 0
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    response.checks.error = error instanceof Error ? error.message : 'Unknown Supabase health error.'
    return NextResponse.json(response, { status: 200 })
  }
}

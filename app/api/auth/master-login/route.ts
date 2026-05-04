import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createMasterSession } from '@/lib/server-auth'

const MASTER_EMAIL = 'deanbfox@gmail.com'
const PASSWORD_HASH = '10beb7e4725a416976e3fdd5e51fd1a5ef5796e6485e11385790c8a0a4df08a2'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    if (email !== MASTER_EMAIL) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const passHash = crypto.createHash('sha256').update(password).digest('hex')
    if (passHash !== PASSWORD_HASH) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const sessionData = createMasterSession(email)

    const response = NextResponse.json({
      success: true,
      email,
      message: 'Master login successful - redirecting...',
    })

    response.cookies.set('master-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Master login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

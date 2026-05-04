import { NextResponse } from 'next/server'
import { verifyMasterSessionCookie } from '@/lib/server-auth'

export async function GET(req: Request) {
  const cookie = req.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('master-session='))
    ?.split('=')
    .slice(1)
    .join('=')

  const user = verifyMasterSessionCookie(cookie ? decodeURIComponent(cookie) : undefined)

  if (!user) {
    return NextResponse.json({ user: null, session: null })
  }

  return NextResponse.json({
    user,
    session: {
      user,
      access_token: `master_token_${user.email}`,
      token_type: 'bearer',
      is_master_session: true,
    },
  })
}

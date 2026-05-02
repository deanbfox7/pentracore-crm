import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // All routes are public - no auth required
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}

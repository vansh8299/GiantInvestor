// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pages that are accessible without authentication
const publicPages = ['/', '/pages/login','/actions/verifyotp', '/pages/signup', '/pages/verifyotp', '/pages/resetPassword','/actions/topgainersorlosers','/actions/signupapi','/actions/verifyotp','/actions/loginapi','/api/forgetpassword', '/pages/forgetpassword']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is in public pages
  const isPublicPage = publicPages.includes(pathname)

  // Get the token from cookies
  const token = request.cookies.get('token')?.value || request.cookies.get('next-auth.session-token')?.value

  // If the page is not public and there's no token, redirect to login
  if (!isPublicPage && !token) {
    const loginUrl = new URL('/pages/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and tries to access auth pages, redirect to home
  if (token && ['/pages/login', '/pages/signup'].includes(pathname)) {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public/*)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
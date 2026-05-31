import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl
  const hasAccessToken = url.searchParams.get('access_token') !== null
  const isRecoveryType = url.searchParams.get('type') === 'recovery'
  
  // After getUser(), if we're on /auth/login with access_token for recovery,
  // redirect to confirm to properly handle the recovery flow
  if (hasAccessToken && isRecoveryType && url.pathname === '/auth/login') {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/auth/confirm'
    return NextResponse.redirect(redirectUrl)
  }
  
  // Also handle if redirect went to root for some reason
  if (hasAccessToken && isRecoveryType && url.pathname === '/') {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/auth/confirm'
    return NextResponse.redirect(redirectUrl)
  }

  if (
    // if the user is not logged in and the dashboard path is accessed, redirect to the login page
    request.nextUrl.pathname.startsWith('/dashboard') &&
    !user
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect logged in users away from auth pages (but NOT update-password page)
  if (
    (request.nextUrl.pathname.startsWith('/auth/login') ||
     request.nextUrl.pathname.startsWith('/auth/sign-up')) &&
    user
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Allow update-password page for users during recovery flow
  // This page should be accessible even if user has a session
  if (request.nextUrl.pathname === '/auth/update-password') {
    return supabaseResponse
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

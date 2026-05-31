import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')
  const next = searchParams.get('next') ?? '/'

  // Handle token_hash based verification (standard recovery link format)
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // If this is a recovery flow, redirect to update-password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Handle access_token + refresh_token (when using PKCE or implicit flow)
  // This is what gets sent when Supabase redirects from verify email link
  if (accessToken && type === 'recovery') {
    const supabase = await createClient()
    
    try {
      // First, try to set the session with the tokens
      if (refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        if (!sessionError) {
          return NextResponse.redirect(`${origin}/auth/update-password`)
        }
      }
      
      // If no refresh token or setSession failed, the access_token alone should work
      // for a recovery flow - the user can still update their password
      return NextResponse.redirect(`${origin}/auth/update-password`)
    } catch (err) {
      // Ignore error and try redirect anyway
    }
  }

  // Redirect to error page if verification fails
  return NextResponse.redirect(`${origin}/auth/error`)
}

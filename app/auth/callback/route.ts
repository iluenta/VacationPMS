import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const tenantId = requestUrl.searchParams.get("tenant_id")
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = await createClient()

      // Try different authentication methods based on the URL structure
      let authResult = null
      let authError = null

      // Method 1: Try OTP verification first (for email confirmation)
      if (type === "signup" || type === "recovery" || type === "email_change") {
        const result = await supabase.auth.verifyOtp({
          token_hash: code,
          type: type as any,
        })
        authResult = result.data
        authError = result.error
      }
      
      // Method 2: If no type specified, try to detect from code format
      if (!type && code) {
        // Try different OTP types based on common patterns
        const otpTypes = ['signup', 'recovery', 'email_change'] as const
        
        for (const otpType of otpTypes) {
          const result = await supabase.auth.verifyOtp({
            token_hash: code,
            type: otpType,
          })
          
          if (!result.error) {
            authResult = result.data
            authError = null
            break
          } else {
            authError = result.error
          }
        }
      }
      
      // Method 3: If OTP fails, try PKCE exchange
      if (authError) {
        const result = await supabase.auth.exchangeCodeForSession(code)
        authResult = result.data
        authError = result.error
      }

      if (authError) {
        console.error("[v0] Authentication failed:", authError)
        return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(authError.message)}&error_code=${authError.status}`)
      }

      // Update user metadata if tenant_id is provided
      if (tenantId && authResult?.user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            tenant_id: tenantId,
            is_admin: false,
          },
        })

        if (updateError) {
          console.error("[v0] Error updating user metadata:", updateError)
        }
      }

      // Redirect based on email confirmation status
      if (authResult?.user?.email_confirmed_at) {
        return NextResponse.redirect(`${origin}/dashboard`)
      } else {
        return NextResponse.redirect(`${origin}/verify-email`)
      }
    } catch (error) {
      console.error("[v0] Unexpected error in auth callback:", error)
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('Error inesperado durante la autenticación')}`)
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}

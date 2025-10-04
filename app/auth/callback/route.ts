import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const tenantId = requestUrl.searchParams.get("tenant_id")
  const origin = requestUrl.origin

  console.log("[v0] Auth callback - code:", !!code, "type:", type, "tenant_id:", tenantId)
  console.log("[v0] Full URL:", requestUrl.toString())

  if (code) {
    try {
      const supabase = await createClient()

      // Try different authentication methods based on the URL structure
      let authResult = null
      let authError = null

      // Method 1: Try OTP verification first (for email confirmation)
      if (type === "signup" || type === "recovery" || type === "email_change") {
        console.log("[v0] Attempting OTP verification for type:", type)
        const result = await supabase.auth.verifyOtp({
          token_hash: code,
          type: type as any,
        })
        authResult = result.data
        authError = result.error
      }
      
      // Method 2: If no type specified, try to detect from code format
      if (!type && code) {
        console.log("[v0] No type specified, trying to detect from code format")
        
        // Try different OTP types based on common patterns
        const otpTypes = ['signup', 'recovery', 'email_change'] as const
        
        for (const otpType of otpTypes) {
          console.log(`[v0] Trying OTP verification for type: ${otpType}`)
          const result = await supabase.auth.verifyOtp({
            token_hash: code,
            type: otpType,
          })
          
          if (!result.error) {
            console.log(`[v0] Success with OTP type: ${otpType}`)
            authResult = result.data
            authError = null
            break
          } else {
            console.log(`[v0] Failed with OTP type: ${otpType}, error:`, result.error.message)
            authError = result.error
          }
        }
      }
      
      // Method 3: If OTP fails, try PKCE exchange
      if (authError) {
        console.log("[v0] OTP failed, trying PKCE exchange")
        const result = await supabase.auth.exchangeCodeForSession(code)
        authResult = result.data
        authError = result.error
      }

      if (authError) {
        console.error("[v0] All authentication methods failed:", authError)
        return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(authError.message)}&error_code=${authError.status}`)
      }

      console.log("[v0] Authentication successful for user:", authResult?.user?.email)

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
        } else {
          console.log("[v0] User metadata updated with tenant_id:", tenantId)
        }
      }

      // Redirect to dashboard after successful authentication
      return NextResponse.redirect(`${origin}/dashboard`)
    } catch (error) {
      console.error("[v0] Unexpected error in auth callback:", error)
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('Error inesperado durante la autenticación')}`)
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}

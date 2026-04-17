import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const intendedRole = request.cookies.get('intended_role')?.value

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error.message)
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      )
    }

    // Ensure profile row exists (in case trigger didn't fire or failed)
    if (data?.user) {
      const user = data.user
      const meta = user.user_metadata || {}

      // Check if user already has a role
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      let finalRole = existingProfile?.role || 'student'

      // If they came from the Register page, they will have this cookie. 
      // We will respect their recent choice.
      if (intendedRole) {
         finalRole = intendedRole
      }

      console.log('Attempting upsert with finalRole:', finalRole)

      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: meta.name || meta.full_name || '',
          email: user.email || '',
          role: finalRole,
          avatar_url: meta.avatar_url || null,
        }, { onConflict: 'id' })

      if (profileErr) {
        console.error('Profile upsert error:', profileErr.message)
      }
    }
  }

  const response = NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  return response
}

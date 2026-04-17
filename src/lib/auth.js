import { supabase } from './supabase'

/**
 * Sign in with email + password
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
  return data
}

/**
 * Sign up with email + password + metadata
 */
export async function signUpWithEmail(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: metadata },
  })
  if (error) throw error
  return data
}

/**
 * Sign in with OAuth provider (Google, GitHub)
 */
export async function signInWithOAuth(provider, redirectTo) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })
  if (error) throw error
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

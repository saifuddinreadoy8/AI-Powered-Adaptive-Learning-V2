import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY


const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRegister() {
  const email = `testuser_${Date.now()}@example.com`
  console.log(`Attempting to register: ${email}`)

  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
    options: {
      data: {
        name: 'Test User',
        role: 'student'
      }
    }
  })

  if (error) {
    console.log('Error Message:', error.message)
    console.log('Error Name:', error.name)
    console.log('Error Status:', error.status)
  } else {
    console.log('Registration succeeded:', data)
  }
}

testRegister()

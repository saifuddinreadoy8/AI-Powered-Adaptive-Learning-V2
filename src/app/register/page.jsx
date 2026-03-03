"use client"
import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleEmail(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      router.push('/dashboard')
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email already registered' : 'Registration failed.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true); setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      router.push('/dashboard')
    } catch { setError('Google sign-in failed. Try again.') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4">
      <div className="card w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🚀</div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Start your learning journey for free</p>
        </div>

        {error && <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-xl p-3 mb-4 text-sm">{error}</div>}

        {/* Google Button */}
        <button onClick={handleGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all mb-4">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-600"></div>
          <span className="text-slate-500 text-sm">or</span>
          <div className="flex-1 h-px bg-slate-600"></div>
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <input className="input" type="text"     placeholder="Full Name"        value={name}     onChange={e=>setName(e.target.value)}     required />
          <input className="input" type="email"    placeholder="Email"            value={email}    onChange={e=>setEmail(e.target.value)}    required />
          <input className="input" type="password" placeholder="Password (min 6)" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Register with Email'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have account? <Link href="/login" className="text-indigo-400 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  )
}
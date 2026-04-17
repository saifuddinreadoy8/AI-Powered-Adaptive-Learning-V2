"use client"
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user || !profile) return null

  const role = profile.role
  const name = profile.name || user.email?.split('@')[0] || 'User'
  const initial = name.charAt(0).toUpperCase()

  const navLinks = {
    student: [
      { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
      { href: '/student/practice', label: 'Practice Quiz', icon: '🧠' },
      { href: '/student/classes', label: 'My Classes', icon: '🏫' },
      { href: '/student/quiz-history', label: 'History', icon: '📋' },
      { href: '/student/roadmaps', label: 'Roadmaps', icon: '🗺️' },
    ],
    teacher: [
      { href: '/teacher/dashboard', label: 'Dashboard', icon: '🏠' },
      { href: '/teacher/classes', label: 'My Classes', icon: '🏫' },
    ],
    admin: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
      { href: '/admin/topics', label: 'Topics', icon: '📚' },
      { href: '/admin/users', label: 'Users', icon: '👥' },
    ],
  }

  const links = navLinks[role] || []
  const roleBadge = {
    student: 'badge-student',
    teacher: 'badge-teacher',
    admin: 'badge-admin',
  }[role]

  async function handleLogout() {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href={links[0]?.href || '/'} className="flex items-center gap-2 shrink-0">
            <span className="text-xl">🎓</span>
            <span className="font-bold text-white text-sm hidden sm:block">AI Learning</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href || pathname?.startsWith(link.href + '/')
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="text-sm">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <span className={roleBadge}>{role}</span>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {initial}
              </div>
              <span className="text-sm text-slate-300 max-w-[120px] truncate">{name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 text-sm transition-colors px-2 py-1"
            >
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-800 py-3 pb-4 space-y-1 fade-in">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  pathname === link.href
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

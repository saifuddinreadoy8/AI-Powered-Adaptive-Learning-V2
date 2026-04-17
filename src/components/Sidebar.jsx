"use client"
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { usePathname } from 'next/navigation'

const navLinks = {
  student: [
    { href: '/student/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/student/practice', label: 'Practice', icon: '🧠' },
    { href: '/student/classes', label: 'Classes', icon: '🏫' },
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

export default function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()

  if (!user || !profile) return null

  const links = navLinks[profile.role] || []
  const name = profile.name || user.email?.split('@')[0] || 'User'
  const initial = name.charAt(0).toUpperCase()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900/80 border-r border-slate-800 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 p-5 border-b border-slate-800">
        <span className="text-xl">🎓</span>
        <span className="font-bold text-white">AI Learning</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              pathname === link.href || pathname?.startsWith(link.href + '/')
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{name}</p>
            <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
          </div>
        </div>
        <button
          onClick={async () => { await signOut(); window.location.href = '/login' }}
          className="w-full text-left text-sm text-slate-400 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-slate-800/50"
        >
          ← Sign Out
        </button>
      </div>
    </aside>
  )
}

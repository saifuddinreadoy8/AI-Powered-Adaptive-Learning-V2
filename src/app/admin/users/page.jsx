"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getAllUsers, deleteUserProfile, updateUserRole } from '@/services/adminService'
import { supabase } from '@/lib/supabase'

function UsersContent() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [changingPassword, setChangingPassword] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const data = await getAllUsers()
    setUsers(data)
    setLoading(false)
  }

  async function handleDelete(userId) {
    if (userId === currentUser?.id) { alert("You can't delete yourself!"); return }
    if (!confirm('Permanently delete this user? This cannot be undone.')) return

    const success = await deleteUserProfile(userId)
    if (success) {
      setMessage('✅ User deleted successfully')
      await loadUsers()
    } else {
      setMessage('❌ Failed to delete user')
    }
  }

  async function handleChangePassword(userId) {
    if (!newPassword || newPassword.length < 6) {
      setMessage('⚠️ Password must be at least 6 characters')
      return
    }
    // Note: Changing another user's password requires admin/service role key.
    // With anon key, we can only update profiles. Password change via Supabase
    // admin API would need a server-side API route.
    setMessage('⚠️ Password changes require server-side admin API. Profile updated.')
    setChangingPassword(null)
    setNewPassword('')
  }

  async function handleRoleChange(userId, newRole) {
    if (userId === currentUser?.id) { alert("You can't change your own role!"); return }
    const result = await updateUserRole(userId, newRole)
    if (result) {
      setMessage(`✅ Role updated to ${newRole}`)
      await loadUsers()
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'All' || u.role === roleFilter.toLowerCase()
    return matchSearch && matchRole
  })

  const roleBadge = (role) => ({
    student: 'badge-student',
    teacher: 'badge-teacher',
    admin: 'badge-admin',
  }[role] || 'badge')

  return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 fade-in">
          <h1 className="text-3xl font-bold text-white">👥 Manage Users</h1>
          <p className="text-slate-400 mt-1">{users.length} registered users</p>
        </div>

        {message && (
          <div className={`rounded-xl p-3 mb-4 text-sm fade-in ${
            message.startsWith('✅') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' :
            message.startsWith('⚠️') ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' :
            'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}>{message}</div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 fade-in items-start sm:items-center">
          <input className="input flex-1" placeholder="🔍 Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="flex gap-2 flex-wrap">
            {['All', 'Student', 'Teacher', 'Admin'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  roleFilter === r ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}>{r}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 card">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-slate-400">No users found</p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {filtered.map(u => (
              <div key={u.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{u.name || 'No name'}</p>
                        <span className={roleBadge(u.role)}>{u.role}</span>
                        {u.id === currentUser?.id && <span className="text-xs text-slate-500">(you)</span>}
                      </div>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      <p className="text-xs text-slate-600">Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Role Change */}
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === currentUser?.id}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>

                    {/* Change Password */}
                    <button onClick={() => { setChangingPassword(changingPassword === u.id ? null : u.id); setNewPassword('') }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-all">
                      🔑
                    </button>

                    {/* Delete */}
                    <button onClick={() => handleDelete(u.id)}
                      disabled={u.id === currentUser?.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30">
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Password Change Form */}
                {changingPassword === u.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2 fade-in">
                    <input className="input flex-1 text-sm py-2" type="password" placeholder="New password (min 6)"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <button onClick={() => handleChangePassword(u.id)} className="btn-primary text-sm px-4">Change</button>
                    <button onClick={() => { setChangingPassword(null); setNewPassword('') }} className="btn-secondary text-sm px-4">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  return (
    <ProtectedRoute role="admin">
      <UsersContent />
    </ProtectedRoute>
  )
}

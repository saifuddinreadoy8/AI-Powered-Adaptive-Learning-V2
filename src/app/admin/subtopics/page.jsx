"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getTopics, addSubtopic, updateSubtopic, deleteSubtopic } from '@/services/topicService'

function SubtopicsContent() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadTopics()
  }, [])

  async function loadTopics() {
    const data = await getTopics()
    setTopics(data)
    if (data.length > 0 && !selectedTopic) {
      setSelectedTopic(data[0])
    } else if (selectedTopic) {
      setSelectedTopic(data.find(t => t.id === selectedTopic.id) || data[0])
    }
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim() || !selectedTopic) return
    await addSubtopic(selectedTopic.id, newName.trim())
    setNewName('')
    loadTopics()
  }

  async function handleUpdate(subtopicId) {
    if (!editName.trim()) return
    await updateSubtopic(subtopicId, { subtopic_name: editName.trim() })
    setEditId(null)
    setEditName('')
    loadTopics()
  }

  async function handleDelete(subtopicId) {
    if (!confirm('Delete this subtopic?')) return
    await deleteSubtopic(subtopicId)
    loadTopics()
  }

  const subtopics = selectedTopic?.subtopics || []

  return (
    <div className="page-container min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 fade-in">
          <h1 className="text-3xl font-bold text-white">📑 Manage Subtopics</h1>
          <p className="text-slate-400 mt-1">Add and manage subtopics under each topic</p>
        </div>

        {/* Topic Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 stagger">
          {topics.map(t => (
            <button key={t.id} onClick={() => setSelectedTopic(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedTopic?.id === t.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}>
              {t.icon} {t.topic_name}
              <span className="ml-1.5 text-xs opacity-60">({(t.subtopics || []).length})</span>
            </button>
          ))}
        </div>

        {/* Add Form */}
        {selectedTopic && (
          <form onSubmit={handleAdd} className="flex gap-3 mb-6 fade-in">
            <input className="input flex-1" placeholder={`Add subtopic under ${selectedTopic.topic_name}...`} value={newName} onChange={e => setNewName(e.target.value)} />
            <button type="submit" className="btn-primary px-6">+ Add</button>
          </form>
        )}

        {/* Subtopics List */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4">
            {selectedTopic ? `${selectedTopic.icon} ${selectedTopic.topic_name} Subtopics` : 'Select a topic'}
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : subtopics.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No subtopics yet. Add one above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {subtopics.map(sub => (
                <div key={sub.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800 transition-colors">
                  {editId === sub.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input className="input text-sm py-1.5 flex-1" value={editName} onChange={e => setEditName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleUpdate(sub.id)} />
                      <button onClick={() => handleUpdate(sub.id)} className="text-emerald-400 hover:text-emerald-300 text-sm font-bold">Save</button>
                      <button onClick={() => { setEditId(null); setEditName('') }} className="text-slate-400 hover:text-white text-sm">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-white">{sub.subtopic_name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditId(sub.id); setEditName(sub.subtopic_name) }} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">Edit</button>
                        <button onClick={() => handleDelete(sub.id)} className="text-xs text-red-400 hover:text-red-300 font-bold">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SubtopicsPage() {
  return (
    <ProtectedRoute role="admin">
      <SubtopicsContent />
    </ProtectedRoute>
  )
}

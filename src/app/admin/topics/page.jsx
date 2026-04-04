"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navbar from '@/components/Navbar'
import { getTopics, addTopic, updateTopic, deleteTopic, addSubtopic, updateSubtopic, deleteSubtopic } from '@/services/topicService'

function TopicsContent() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTopic, setExpandedTopic] = useState(null)

  // Topic form
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicIcon, setNewTopicIcon] = useState('📚')
  const [editingTopic, setEditingTopic] = useState(null)

  // Subtopic form
  const [addingSubtopicFor, setAddingSubtopicFor] = useState(null)
  const [newSubtopicName, setNewSubtopicName] = useState('')
  const [editingSubtopic, setEditingSubtopic] = useState(null)

  useEffect(() => { loadTopics() }, [])

  async function loadTopics() {
    const data = await getTopics()
    setTopics(data)
    setLoading(false)
  }

  // Topic CRUD
  async function handleAddTopic() {
    if (!newTopicName.trim()) return
    await addTopic(newTopicName.trim(), newTopicIcon)
    setNewTopicName('')
    setNewTopicIcon('📚')
    setShowAddTopic(false)
    await loadTopics()
  }

  async function handleUpdateTopic(topicId) {
    if (!editingTopic?.topic_name?.trim()) return
    await updateTopic(topicId, { topic_name: editingTopic.topic_name, icon: editingTopic.icon })
    setEditingTopic(null)
    await loadTopics()
  }

  async function handleDeleteTopic(topicId) {
    if (!confirm('Delete this topic and ALL its subtopics?')) return
    await deleteTopic(topicId)
    await loadTopics()
  }

  // Subtopic CRUD
  async function handleAddSubtopic(topicId) {
    if (!newSubtopicName.trim()) return
    await addSubtopic(topicId, newSubtopicName.trim())
    setNewSubtopicName('')
    setAddingSubtopicFor(null)
    await loadTopics()
  }

  async function handleUpdateSubtopic(subtopicId) {
    if (!editingSubtopic?.subtopic_name?.trim()) return
    await updateSubtopic(subtopicId, { subtopic_name: editingSubtopic.subtopic_name })
    setEditingSubtopic(null)
    await loadTopics()
  }

  async function handleDeleteSubtopic(subtopicId) {
    if (!confirm('Delete this subtopic?')) return
    await deleteSubtopic(subtopicId)
    await loadTopics()
  }

  return (
    <div className="page-container min-h-screen"><Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 fade-in">
          <div>
            <h1 className="text-3xl font-bold text-white">📚 Manage Topics</h1>
            <p className="text-slate-400 mt-1">{topics.length} topics • {topics.reduce((s, t) => s + (t.subtopics?.length || 0), 0)} subtopics</p>
          </div>
          <button onClick={() => setShowAddTopic(!showAddTopic)} className="btn-primary text-sm px-5 py-2.5">
            {showAddTopic ? '✕ Cancel' : '➕ Add Topic'}
          </button>
        </div>

        {/* Add Topic Form */}
        {showAddTopic && (
          <div className="card mb-4 fade-in">
            <h3 className="font-bold text-white mb-3">Add New Topic</h3>
            <div className="flex gap-2">
              <input className="input w-16 text-center text-xl" value={newTopicIcon} onChange={e => setNewTopicIcon(e.target.value)} maxLength={2} />
              <input className="input flex-1" placeholder="Topic name" value={newTopicName} onChange={e => setNewTopicName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTopic()} />
              <button onClick={handleAddTopic} className="btn-primary px-5">Add</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {topics.map(topic => (
              <div key={topic.id} className="card">
                {/* Topic Header */}
                <div className="flex items-center justify-between">
                  {editingTopic?.id === topic.id ? (
                    <div className="flex gap-2 flex-1 mr-3">
                      <input className="input w-16 text-center text-xl" value={editingTopic.icon}
                        onChange={e => setEditingTopic({ ...editingTopic, icon: e.target.value })} />
                      <input className="input flex-1" value={editingTopic.topic_name}
                        onChange={e => setEditingTopic({ ...editingTopic, topic_name: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateTopic(topic.id)} />
                      <button onClick={() => handleUpdateTopic(topic.id)} className="btn-primary px-4 text-sm">Save</button>
                      <button onClick={() => setEditingTopic(null)} className="btn-secondary px-4 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                        className="flex items-center gap-3 flex-1 text-left">
                        <span className="text-2xl">{topic.icon}</span>
                        <div>
                          <h3 className="font-bold text-white">{topic.topic_name}</h3>
                          <p className="text-xs text-slate-500">{topic.subtopics?.length || 0} subtopics</p>
                        </div>
                        <span className={`text-slate-500 ml-2 transition-transform ${expandedTopic === topic.id ? 'rotate-90' : ''}`}>▶</span>
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingTopic({ id: topic.id, topic_name: topic.topic_name, icon: topic.icon })}
                          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition-all">Edit</button>
                        <button onClick={() => handleDeleteTopic(topic.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">Delete</button>
                        <button onClick={() => { setAddingSubtopicFor(topic.id); setExpandedTopic(topic.id) }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-all">+ Sub</button>
                      </div>
                    </>
                  )}
                </div>

                {/* Subtopics */}
                {expandedTopic === topic.id && (
                  <div className="mt-4 pl-10 space-y-2 fade-in">
                    {addingSubtopicFor === topic.id && (
                      <div className="flex gap-2">
                        <input className="input flex-1 text-sm" placeholder="Subtopic name"
                          value={newSubtopicName} onChange={e => setNewSubtopicName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddSubtopic(topic.id)} autoFocus />
                        <button onClick={() => handleAddSubtopic(topic.id)} className="btn-primary text-sm px-4">Add</button>
                        <button onClick={() => setAddingSubtopicFor(null)} className="btn-secondary text-sm px-4">Cancel</button>
                      </div>
                    )}

                    {topic.subtopics?.length === 0 && (
                      <p className="text-slate-600 text-sm">No subtopics yet</p>
                    )}

                    {topic.subtopics?.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                        {editingSubtopic?.id === sub.id ? (
                          <div className="flex gap-2 flex-1">
                            <input className="input flex-1 text-sm py-1.5" value={editingSubtopic.subtopic_name}
                              onChange={e => setEditingSubtopic({ ...editingSubtopic, subtopic_name: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && handleUpdateSubtopic(sub.id)} autoFocus />
                            <button onClick={() => handleUpdateSubtopic(sub.id)} className="btn-primary text-xs px-3">Save</button>
                            <button onClick={() => setEditingSubtopic(null)} className="btn-secondary text-xs px-3">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-slate-300">{sub.subtopic_name}</span>
                            <div className="flex gap-1">
                              <button onClick={() => setEditingSubtopic({ id: sub.id, subtopic_name: sub.subtopic_name })}
                                className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 hover:text-white transition-colors">Edit</button>
                              <button onClick={() => handleDeleteSubtopic(sub.id)}
                                className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">Del</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
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

export default function AdminTopics() {
  return (
    <ProtectedRoute role="admin">
      <TopicsContent />
    </ProtectedRoute>
  )
}

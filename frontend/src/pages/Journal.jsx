import React, { useEffect, useState } from 'react'
import { BookMarked, Plus, Star, Trash2, Calendar, BookOpen, MessageSquareQuote } from 'lucide-react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Journal() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [userBooks, setUserBooks] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [selectedBookId, setSelectedBookId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [activeTab, setActiveTab] = useState('journal') // journal, review
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchJournalData = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [entriesRes, libRes] = await Promise.all([
        apiClient.get('/journal'),
        apiClient.get('/library'),
      ])
      setEntries(entriesRes.data || [])
      const booksList = (libRes.data || []).map((item) => item.book).filter(Boolean)
      setUserBooks(booksList)
      if (booksList.length > 0 && !selectedBookId) {
        setSelectedBookId(booksList[0].id)
      }
    } catch (err) {
      console.error('Error loading journal:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournalData()
  }, [user])

  const handleCreateJournal = async (e) => {
    e.preventDefault()
    if (!selectedBookId || !title.trim() || !content.trim()) return

    setSaving(true)
    setMessage('')
    try {
      await apiClient.post('/journal', {
        book_id: selectedBookId,
        title: title.trim(),
        content: content.trim(),
      })
      setTitle('')
      setContent('')
      setMessage('Journal entry saved successfully!')
      setTimeout(() => setMessage(''), 3000)
      fetchJournalData()
    } catch (err) {
      console.error('Error creating entry:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateReview = async (e) => {
    e.preventDefault()
    if (!selectedBookId) return

    setSaving(true)
    setMessage('')
    try {
      await apiClient.post('/reviews', {
        book_id: selectedBookId,
        rating: parseInt(rating, 10),
        review_text: reviewText.trim() || null,
      })
      setReviewText('')
      setMessage('Star review submitted!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error submitting review:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Delete this journal entry?')) return
    try {
      await apiClient.delete(`/journal/${entryId}`)
      fetchJournalData()
    } catch (err) {
      console.error('Error deleting entry:', err)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-100 flex items-center gap-3">
          <BookMarked className="w-8 h-8 text-indigo-400" /> Reading Journal & Reviews
        </h1>
        <p className="text-xs text-slate-400 mt-1">Record your thoughts, quotes, and star ratings</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Add Journal Entry or Review */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5 h-fit">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900/80 border border-white/5">
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'journal' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Journal Note
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'review' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Add Book Review
            </button>
          </div>

          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
              {message}
            </div>
          )}

          {userBooks.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Add books to your library first to write journals or reviews for them.
            </p>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Select Book *</label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none"
              >
                {userBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.author})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'journal' && userBooks.length > 0 && (
            <form onSubmit={handleCreateJournal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Entry Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Chapter 4 reflection..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Journal Thoughts / Quotes *</label>
                <textarea
                  rows="5"
                  required
                  placeholder="Write your detailed reaction, favourite quotes, or theories..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Journal Note'}
              </button>
            </form>
          )}

          {activeTab === 'review' && userBooks.length > 0 && (
            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-125 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${rating >= star ? 'fill-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                  <span className="text-sm font-black text-amber-400 ml-2">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Review Text (Optional)</label>
                <textarea
                  rows="4"
                  placeholder="What did you think of the book overall?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Star className="w-4 h-4 fill-white" /> {saving ? 'Submitting...' : 'Submit Book Review'}
              </button>
            </form>
          )}
        </div>

        {/* Right Section: Timeline of Saved Journal Entries */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-indigo-400" /> Past Journal Notes
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading journal history...</div>
          ) : entries.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-white/10 space-y-2">
              <BookMarked className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-bold">No journal notes written yet</h3>
              <p className="text-xs text-slate-400">Select a book on the left to write your first reflection.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                        {entry.book?.title || 'Book Note'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-100">{entry.title}</h3>
                    </div>

                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {entry.content}
                  </p>

                  <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 border-t border-white/5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'Just now'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

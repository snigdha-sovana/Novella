import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Library as LibraryIcon, Bookmark, BookOpen, CheckCircle2, Trash2, SlidersHorizontal } from 'lucide-react'
import apiClient from '../api/client'
import BookCard from '../components/BookCard'
import ProgressTrackerModal from '../components/ProgressTrackerModal'
import { useAuth } from '../context/AuthContext'

function LibraryBookCover({ src, alt, className }) {
  const fallback = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'
  const [imgSrc, setImgSrc] = useState(src || fallback)

  useEffect(() => {
    setImgSrc(src || fallback)
  }, [src])

  return (
    <img
      src={imgSrc}
      alt={alt || 'Book Cover'}
      onError={() => setImgSrc(fallback)}
      className={className}
    />
  )
}

export default function Library() {
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('all') // all, want_to_read, reading, completed
  const [libraryItems, setLibraryItems] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null)

  const fetchLibrary = async () => {
    try {
      setLoading(true)
      const [libRes, progRes] = await Promise.all([
        apiClient.get('/library'),
        apiClient.get('/progress'),
      ])
      setLibraryItems(libRes.data || [])

      const pMap = {}
      ;(progRes.data || []).forEach((p) => {
        pMap[p.book_id] = p
      })
      setProgressMap(pMap)
    } catch (err) {
      console.error('Error fetching library:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLibrary()
    if (location.state?.addedBookId) {
      setActiveTab('reading')
      const timer = setTimeout(() => {
        fetchLibrary()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [user, authLoading, location.key, location.state])

  const handleUpdateStatus = async (libraryId, newStatus) => {
    try {
      await apiClient.patch(`/library/${libraryId}`, { status: newStatus })
      fetchLibrary()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleRemove = async (libraryId) => {
    if (!window.confirm('Remove this book from your library?')) return
    try {
      await apiClient.delete(`/library/${libraryId}`)
      fetchLibrary()
    } catch (err) {
      console.error('Error removing item:', err)
    }
  }

  const readingItems = libraryItems.filter((i) => i.status === 'reading')
  const wantToReadItems = libraryItems.filter((i) => i.status === 'want_to_read')
  const completedItems = libraryItems.filter((i) => i.status === 'completed')

  // Calculate overview metrics
  let totalPctSum = 0
  readingItems.forEach((item) => {
    const prog = progressMap[item.book_id]
    if (prog) {
      totalPctSum += prog.completion_percentage || 0
    }
  })
  const avgCompletion = readingItems.length > 0 ? Math.round(totalPctSum / readingItems.length) : 0

  const filteredItems = libraryItems.filter((item) => {
    if (activeTab === 'all') return true
    return item.status === activeTab
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 flex items-center gap-3">
            <LibraryIcon className="w-8 h-8 text-indigo-400" /> Personal Library
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage your physical reading shelves & track progress</p>
        </div>

        {/* Shelf Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/80 border border-white/10 glass-panel">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({libraryItems.length})
          </button>
          <button
            onClick={() => setActiveTab('reading')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'reading' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Reading ({readingItems.length})
          </button>
          <button
            onClick={() => setActiveTab('want_to_read')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'want_to_read' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Want to Read ({wantToReadItems.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'completed' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed ({completedItems.length})
          </button>
        </div>
      </div>

      {/* Reading Overview Dashboard */}
      {!loading && libraryItems.length > 0 && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currently Reading</p>
                <p className="text-xl font-black text-slate-100">{readingItems.length} {readingItems.length === 1 ? 'Book' : 'Books'}</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Want to Read</p>
                <p className="text-xl font-black text-slate-100">{wantToReadItems.length} Books</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
                <p className="text-xl font-black text-slate-100">{completedItems.length} Books</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Progress</p>
                <p className="text-xl font-black text-slate-100">{avgCompletion}%</p>
              </div>
            </div>
          </div>

          {/* Active Reading Spotlight */}
          {readingItems.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 to-indigo-950/40 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" /> Active Reading Progress Overview
                </h2>
                <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                  Live Showcase
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {readingItems.map((item) => {
                  const prog = progressMap[item.book_id] || {}
                  const pct = prog.completion_percentage || 0
                  const pagesRemaining = prog.pages_remaining ?? (item.book?.total_pages || 0)

                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 flex gap-4 items-center shadow-lg hover:border-indigo-500/40 transition-all">
                      <LibraryBookCover
                        src={item.book?.cover_url}
                        alt={item.book?.title}
                        className="w-16 h-24 object-cover rounded-xl border border-white/10 shadow-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-100 truncate">{item.book?.title}</h4>
                          <p className="text-xs text-slate-400 truncate">by {item.book?.author}</p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-300">Page {prog.current_page || 0} of {item.book?.total_pages || 0}</span>
                            <span className="text-indigo-400 font-bold">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>{pagesRemaining} pgs remaining</span>
                          <button
                            onClick={() => setSelectedBookForProgress(item.book)}
                            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md text-xs flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3" /> Update Progress
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid Display */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm font-medium">
          Loading library shelves...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-white/10 space-y-3">
          <LibraryIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-bold">No books on this shelf</h3>
          <p className="text-xs text-slate-400">Add books from the catalog to build your collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative group">
              <BookCard
                book={item.book}
                libraryStatus={item.status}
                progress={progressMap[item.book_id]}
                onUpdateProgress={(b) => setSelectedBookForProgress(b)}
              />

              {/* Status Move Bar */}
              <div className="mt-2 p-2 rounded-xl glass-panel border border-white/5 flex items-center justify-between text-xs">
                <select
                  value={item.status}
                  onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                  className="bg-slate-900 text-slate-200 text-xs font-semibold rounded-lg px-2 py-1 border border-white/10 focus:outline-none"
                >
                  <option value="want_to_read">Want to Read</option>
                  <option value="reading">Reading</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  onClick={() => handleRemove(item.id)}
                  title="Remove from library"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Modal */}
      {selectedBookForProgress && (
        <ProgressTrackerModal
          book={selectedBookForProgress}
          initialProgress={progressMap[selectedBookForProgress.id]}
          onClose={() => setSelectedBookForProgress(null)}
          onSaved={() => fetchLibrary()}
        />
      )}

    </div>
  )
}

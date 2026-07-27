import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Compass, Filter, BookOpen, RefreshCw } from 'lucide-react'
import apiClient from '../api/client'
import BookCard from '../components/BookCard'
import AddBookModal from '../components/AddBookModal'
import { useAuth } from '../context/AuthContext'

export default function Catalog() {
  const navigate = useNavigate()
  const { user, signInAsGuest, loading: authLoading } = useAuth()
  const [books, setBooks] = useState([])
  const [userLibraryMap, setUserLibraryMap] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [notification, setNotification] = useState('')

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const params = searchQuery ? { q: searchQuery } : {}
      
      // 1. Fetch public books list independently so catalog ALWAYS loads immediately
      const booksRes = await apiClient.get('/books', { params })
      setBooks(booksRes.data || [])

      // 2. Fetch user library statuses if user is logged in
      if (user) {
        try {
          const libRes = await apiClient.get('/library')
          const lMap = {}
          ;(libRes.data || []).forEach((item) => {
            lMap[item.book_id] = item.status
          })
          setUserLibraryMap(lMap)
        } catch (libErr) {
          console.warn('Notice loading user library map:', libErr)
        }
      }
    } catch (err) {
      console.error('Error loading catalog:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [searchQuery, user, authLoading])

  const handleSyncThumbnails = async () => {
    if (!user) {
      setNotification('Please sign in to sync book thumbnails.')
      setTimeout(() => setNotification(''), 3000)
      return
    }

    try {
      setSyncing(true)
      const res = await apiClient.post('/books/sync-thumbnails')
      setNotification(res.data?.message || 'Thumbnails synced successfully!')
      fetchBooks()
    } catch (err) {
      console.error('Error syncing thumbnails:', err)
      setNotification('Failed to sync thumbnails.')
    } finally {
      setSyncing(false)
      setTimeout(() => setNotification(''), 4000)
    }
  }

  const handleAddToLibrary = async (bookId, status = 'reading') => {
    try {
      const res = await apiClient.post('/library', { book_id: bookId, status })
      setUserLibraryMap((prev) => ({ ...prev, [bookId]: status }))
    } catch (err) {
      console.warn('Notice adding book to library:', err)
    } finally {
      if (status === 'reading') {
        navigate('/library', { state: { addedBookId: bookId, ts: Date.now() } })
      } else {
        setNotification('Book saved to your "Want to Read" shelf!')
        setTimeout(() => setNotification(''), 3000)
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 flex items-center gap-3">
            <Compass className="w-8 h-8 text-indigo-400" /> Book Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">Browse community collection or add new books</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncThumbnails}
            disabled={syncing}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            title="Auto-fetch covers from Open Library API"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Covers'}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Book to Catalog
          </button>
        </div>
      </div>


      {notification && (
        <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold text-center animate-fade-in">
          {notification}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search catalog by title or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/80 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 glass-panel"
        />
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm font-medium">
          Loading catalog...
        </div>
      ) : books.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-white/10 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-bold">No books found matching your query</h3>
          <p className="text-xs text-slate-400">Be the first to add this book to the catalog!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Add Book Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              libraryStatus={userLibraryMap[book.id]}
              onAddToLibrary={(bId, status) => handleAddToLibrary(bId, status)}
            />
          ))}
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onBookAdded={() => fetchBooks()}
        />
      )}

    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Library, BookMarked, MessageSquare, Plus, ArrowRight, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import BookCard from '../components/BookCard'
import ProgressTrackerModal from '../components/ProgressTrackerModal'

export default function Home() {
  const { user, username } = useAuth()
  const [readingList, setReadingList] = useState([])
  const [progressMap, setProgressMap] = useState({})
  const [stats, setStats] = useState({ total: 0, reading: 0, completed: 0, wantToRead: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedBookForProgress, setSelectedBookForProgress] = useState(null)

  const fetchData = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [libRes, progRes] = await Promise.all([
        apiClient.get('/library'),
        apiClient.get('/progress'),
      ])

      const libraryItems = libRes.data || []
      const progressItems = progRes.data || []

      const pMap = {}
      progressItems.forEach((p) => {
        pMap[p.book_id] = p
      })
      setProgressMap(pMap)

      const readingItems = libraryItems.filter((i) => i.status === 'reading')
      setReadingList(readingItems)

      setStats({
        total: libraryItems.length,
        reading: readingItems.length,
        completed: libraryItems.filter((i) => i.status === 'completed').length,
        wantToRead: libraryItems.filter((i) => i.status === 'want_to_read').length,
      })
    } catch (err) {
      console.error('Error loading home data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Hero Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/0 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Physical Copy Progress & Journaling
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-none">
            Welcome back, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">{username}</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Track exact pages and chapters read in your physical books, journal your personal thoughts, rate books, and chat with fellow readers in real-time.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              to="/catalog"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-2"
            >
              Browse Catalog <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/library"
              className="px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 font-bold text-sm transition-all flex items-center gap-2"
            >
              My Shelves
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-100">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">Total Books</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-100">{stats.reading}</span>
            <span className="text-xs text-slate-400 font-medium">Currently Reading</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-100">{stats.completed}</span>
            <span className="text-xs text-slate-400 font-medium">Completed Books</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-100">{stats.wantToRead}</span>
            <span className="text-xs text-slate-400 font-medium">Want to Read</span>
          </div>
        </div>
      </div>

      {/* Currently Reading Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" /> Currently Reading
            </h2>
            <p className="text-xs text-slate-400 mt-1">Update page/chapter milestones anytime</p>
          </div>

          <Link to="/library" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {readingList.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center border border-dashed border-white/10 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-slate-300 font-bold">No active books on your reading shelf</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add books from the catalog to your reading shelf to start tracking page and chapter progress.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {readingList.map((item) => (
              <BookCard
                key={item.id}
                book={item.book}
                libraryStatus={item.status}
                progress={progressMap[item.book_id]}
                onUpdateProgress={(b) => setSelectedBookForProgress(b)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Progress Tracker Modal */}
      {selectedBookForProgress && (
        <ProgressTrackerModal
          book={selectedBookForProgress}
          initialProgress={progressMap[selectedBookForProgress.id]}
          onClose={() => setSelectedBookForProgress(null)}
          onSaved={() => fetchData()}
        />
      )}

    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { X, BookOpen, Layers, CheckCircle, Percent } from 'lucide-react'
import apiClient from '../api/client'

export default function ProgressTrackerModal({ book, initialProgress, onClose, onSaved }) {
  const [currentPage, setCurrentPage] = useState(initialProgress?.current_page || 0)
  const [currentChapter, setCurrentChapter] = useState(initialProgress?.current_chapter || 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalPages = book?.total_pages || 0
  const totalChapters = book?.total_chapters || 0

  const pagesRemaining = Math.max(0, totalPages - currentPage)
  const chaptersRemaining = Math.max(0, totalChapters - currentChapter)
  
  let percentage = 0
  if (totalPages > 0) {
    percentage = Math.min(100, Math.round((currentPage / totalPages) * 100))
  } else if (totalChapters > 0) {
    percentage = Math.min(100, Math.round((currentChapter / totalChapters) * 100))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await apiClient.put(`/progress/${book.id}`, {
        current_page: parseInt(currentPage, 10) || 0,
        current_chapter: parseInt(currentChapter, 10) || 0,
      })
      if (onSaved) onSaved(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update reading progress')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 relative shadow-2xl border border-white/10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 line-clamp-1">{book.title}</h2>
            <p className="text-xs text-slate-400 font-medium">Update Physical Copy Progress</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Progress Math Dashboard */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-white/5 text-center">
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Completion</span>
              <span className="text-xl font-black text-indigo-400 flex items-center justify-center gap-0.5">
                {percentage}<Percent className="w-4 h-4" />
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Pages Left</span>
              <span className="text-xl font-black text-slate-200">
                {totalPages > 0 ? pagesRemaining : 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">Chaps Left</span>
              <span className="text-xl font-black text-slate-200">
                {totalChapters > 0 ? chaptersRemaining : 'N/A'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/5">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Current Page Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Current Page</span>
              {totalPages > 0 && <span className="text-slate-400 font-normal">of {totalPages} pages</span>}
            </label>
            <input
              type="number"
              min="0"
              max={totalPages > 0 ? totalPages : 99999}
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Current Chapter Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-purple-400" /> Current Chapter</span>
              {totalChapters > 0 && <span className="text-slate-400 font-normal">of {totalChapters} chapters</span>}
            </label>
            <input
              type="number"
              min="0"
              max={totalChapters > 0 ? totalChapters : 9999}
              value={currentChapter}
              onChange={(e) => setCurrentChapter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Progress'}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}

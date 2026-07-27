import React, { useState } from 'react'
import { X, Plus, BookOpen, Image, Layers, FileText } from 'lucide-react'
import apiClient from '../api/client'

export default function AddBookModal({ onClose, onBookAdded }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [totalChapters, setTotalChapters] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedFile, setSelectedFile] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !author.trim()) {
      setError('Title and Author are required.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/books', {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim() || null,
        total_pages: parseInt(totalPages, 10) || 0,
        total_chapters: parseInt(totalChapters, 10) || 0,
        cover_url: coverUrl.trim() || null,
        description: description.trim() || null,
      })

      let finalBook = res.data

      // If user provided a custom image file, upload it to the thumbnail API endpoint
      if (selectedFile && finalBook?.id) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        const uploadRes = await apiClient.post(`/books/${finalBook.id}/thumbnail`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        finalBook = uploadRes.data
      }

      if (onBookAdded) onBookAdded(finalBook)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add book to catalog.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 relative shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">Add Book to Catalog</h2>
            <p className="text-xs text-slate-400">Expand the BookJournal community collection</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Book Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. The Hobbit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Author Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. J.R.R. Tolkien"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ISBN <span className="text-[10px] font-normal text-slate-400">(Optional - for exact cover & metadata match)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 9780048231888"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Total Pages</label>
              <input
                type="number"
                min="0"
                placeholder="310"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Total Chapters</label>
              <input
                type="number"
                min="0"
                placeholder="19"
                value={totalChapters}
                onChange={(e) => setTotalChapters(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">Book Thumbnail Cover</label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-900/90 rounded-xl border border-white/10 p-1"
              />
              <p className="text-[10px] text-slate-400">Upload a custom image file (.jpg, .png, .webp) or enter image URL below:</p>
              <input
                type="url"
                placeholder="https://..."
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>


          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description / Synopsis</label>
            <textarea
              rows="3"
              placeholder="A brief overview of the book..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

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
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {loading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { BookOpen, Plus, CheckCircle2, Bookmark, Star } from 'lucide-react'

export default function BookCard({
  book,
  libraryStatus,
  progress,
  onAddToLibrary,
  onUpdateProgress,
  onOpenDetail,
}) {
  const [imgError, setImgError] = useState(false)

  const fallbackCover = `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400`
  const coverSrc = imgError || !book.cover_url ? fallbackCover : book.cover_url

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group relative">
      {/* Cover Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900/80 cursor-pointer" onClick={() => onOpenDetail && onOpenDetail(book)}>
        <img
          src={coverSrc}
          alt={book.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Shelf Badge */}
        {libraryStatus && (
          <div className="absolute top-3 right-3 z-10">
            {libraryStatus === 'want_to_read' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
                <Bookmark className="w-3 h-3" /> Want to Read
              </span>
            )}
            {libraryStatus === 'reading' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Reading
              </span>
            )}
            {libraryStatus === 'completed' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            )}
          </div>
        )}

        {/* Progress Bar Overlay if reading */}
        {progress && progress.completion_percentage !== undefined && (
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-md p-2.5 border-t border-white/10 z-10">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-300 font-medium">{progress.current_page} / {book.total_pages || '?'} pgs</span>
              <span className="text-indigo-400 font-bold">{progress.completion_percentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progress.completion_percentage || 0)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Book Info Underneath */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onOpenDetail && onOpenDetail(book)}
            className="font-bold text-slate-100 text-base leading-tight group-hover:text-indigo-400 transition-colors line-clamp-1 cursor-pointer"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1 line-clamp-1">
            by {book.author}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          {onAddToLibrary && (
            <>
              <button
                onClick={() => onAddToLibrary(book.id, 'reading')}
                className={`flex-1 w-full py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md ${
                  libraryStatus === 'reading'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/30'
                    : 'bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-200 border-indigo-500/40'
                }`}
              >
                {libraryStatus === 'reading' ? (
                  <>
                    <BookOpen className="w-3 h-3 text-indigo-300" /> Reading
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" /> Start Reading
                  </>
                )}
              </button>

              <button
                onClick={() => onAddToLibrary(book.id, 'want_to_read')}
                className={`w-full sm:w-auto py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-md ${
                  libraryStatus === 'want_to_read'
                    ? 'bg-amber-500/30 text-amber-200 border-amber-500/50'
                    : 'bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 border-white/10'
                }`}
                title="Add to Want to Read shelf"
              >
                <Bookmark className="w-3 h-3 text-amber-400" />
                {libraryStatus === 'want_to_read' ? 'Saved' : 'Want to Read'}
              </button>
            </>
          )}

          {onUpdateProgress && libraryStatus && (
            <button
              onClick={() => onUpdateProgress(book)}
              className="w-full py-1.5 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <BookOpen className="w-3 h-3 text-indigo-400" /> Log Progress
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Library, Compass, MessageSquare, BookMarked, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const location = useLocation()
  const { user, username, signOut } = useAuth()

  const navLinks = [
    { name: 'Home', path: '/', icon: BookOpen },
    { name: 'Catalog', path: '/catalog', icon: Compass },
    { name: 'My Library', path: '/library', icon: Library },
    { name: 'Journal', path: '/journal', icon: BookMarked },
    { name: 'Community', path: '/community', icon: MessageSquare },
  ]

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-400 group-hover:text-pink-400 transition-colors" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                Novella
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">BookJournal</span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 hidden sm:inline">{username}</span>
                </div>

                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/5 hover:border-rose-500/30 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 transition-all flex items-center gap-1.5"
              >
                <User className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}

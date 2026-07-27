import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, User, Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        await signUp(email, password, username)
        setMessage('Registration successful! Check your email to confirm, or try logging in.')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err) {
      const errMsg = err.message || 'Authentication failed. Please check credentials.'
      if (errMsg.toLowerCase().includes('rate limit')) {
        setError('Supabase Email Rate Limit Exceeded: Supabase limits confirmation emails sent per hour.')
      } else {
        setError(errMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
        
        {/* Glow accent decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 p-0.5 mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {isSignUp ? 'Join BookJournal' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? 'Start tracking your physical copies & joining the reader community' : 'Sign in to access your library, progress & journal logs'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/80 border border-white/5 mb-6 relative z-10">
          <button
            onClick={() => { setIsSignUp(false); setError(''); setMessage(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              !isSignUp ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(''); setMessage(''); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              isSignUp ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold space-y-1">
            <div className="flex items-center gap-1.5 justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
            {error.includes('Rate Limit') && (
              <p className="text-[11px] text-slate-300 font-normal leading-tight pt-1">
                👉 If you already submitted a signup or registered this email, switch to the <strong>Sign In</strong> tab to log in directly! Or toggle off "Confirm email" in Supabase Auth settings.
              </p>
            )}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="bookworm99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="reader@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  )
}

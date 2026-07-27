import React, { useEffect, useState, useRef } from 'react'
import { MessageSquare, Send, Plus, BookOpen, User, Sparkles, MessageCircle } from 'lucide-react'
import apiClient from '../api/client'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Community() {
  const { user, username } = useAuth()
  
  // Community Posts
  const [posts, setPosts] = useState([])
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [showPostModal, setShowPostModal] = useState(false)
  const [savingPost, setSavingPost] = useState(false)

  // Live Chat
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const chatBottomRef = useRef(null)

  const fetchPosts = async () => {
    try {
      const res = await apiClient.get('/community/posts')
      setPosts(res.data || [])
    } catch (err) {
      console.error('Error fetching posts:', err)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await apiClient.get('/community/messages')
      setMessages(res.data || [])
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      console.error('Error fetching chat messages:', err)
    }
  }

  useEffect(() => {
    fetchPosts()
    fetchMessages()

    // Subscribe to Supabase Realtime for community_messages
    const channel = supabase
      .channel('public:community_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        (payload) => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!postTitle.trim() || !postContent.trim()) return

    setSavingPost(true)
    try {
      await apiClient.post('/community/posts', {
        title: postTitle.trim(),
        content: postContent.trim(),
      })
      setPostTitle('')
      setPostContent('')
      setShowPostModal(false)
      fetchPosts()
    } catch (err) {
      console.error('Error creating post:', err)
    } finally {
      setSavingPost(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || !user) return

    setSendingMsg(true)
    try {
      await apiClient.post('/community/messages', {
        message: chatInput.trim(),
      })
      setChatInput('')
      fetchMessages()
    } catch (err) {
      console.error('Error posting message:', err)
    } finally {
      setSendingMsg(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-indigo-400" /> Reader Community
          </h1>
          <p className="text-xs text-slate-400 mt-1">Discussions and live real-time chat with fellow book lovers</p>
        </div>

        <button
          onClick={() => setShowPostModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Discussion Topic
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Discussion Topics Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-400" /> Community Discussions
          </h2>

          {posts.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-dashed border-white/10 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-bold">No community posts yet</h3>
              <p className="text-xs text-slate-400">Start the conversation by creating a discussion topic above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                        {post.username?.charAt(0).toUpperCase() || 'R'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200">{post.username}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    {post.book_title && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {post.book_title}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-100">{post.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Real-Time Chat Widget */}
        <div className="glass-panel rounded-3xl border border-white/10 flex flex-col h-[600px] overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-100">Live Reader Lounge</h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Realtime
            </span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No messages yet. Say hello!</p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.username === username
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 px-1 mb-0.5">
                      {msg.username}
                    </span>
                    <div
                      className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs font-medium ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                          : 'bg-slate-800/90 text-slate-200 border border-white/10 rounded-bl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-slate-900/80 flex gap-2">
            <input
              type="text"
              placeholder={user ? "Type a live message..." : "Sign in to chat live"}
              disabled={!user || sendingMsg}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!user || !chatInput.trim() || sendingMsg}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

      {/* Modal for New Post */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 relative shadow-2xl border border-white/10">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Start Discussion Topic</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Topic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Best Fantasy Magic Systems of 2026?"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Discussion Content *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Share your thoughts or question with the community..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPost}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  {savingPost ? 'Publishing...' : 'Publish Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

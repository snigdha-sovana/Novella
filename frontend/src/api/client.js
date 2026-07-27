import axios from 'axios'
import { supabase } from '../lib/supabase'

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Inject JWT token from current Supabase session into authorization header
apiClient.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession()
    const session = data?.session
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } catch (err) {
    console.warn('Auth token header interceptor notice:', err)
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export default apiClient

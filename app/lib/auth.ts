// lib/auth.ts
import { load, save } from './storage'

export const auth = {
  async login(email: string, password: string) {
    // demo: accept any non-empty credentials
    if (!email || !password) return false
    if (typeof window !== 'undefined') sessionStorage.setItem('demo_token', '1')
    return true
  },
  async logout() {
    if (typeof window !== 'undefined') localStorage.removeItem('super_admin_logged_in')
    return Promise.resolve()
  },
  getUser() {
    return { id: 'u1', name: 'Admin User', email: 'admin@example.com' }
  },
  isAuthenticated() {
    if (typeof window === 'undefined') return false
    return !!sessionStorage.getItem('demo_token')
  },
}


// app/lib/auth.ts
// Lightweight client-side "auth" for doctors (localStorage based).
// NOT secure for production. For production: use server-side auth + hashed passwords.


const SESSION_KEY = 'doctor_session' // value: { doctorId, username, loggedAt }

export function getDoctorSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveDoctorSession(session: { doctorId: string; username: string }) {
  if (typeof window === 'undefined') return
  const s = { ...session, loggedAt: new Date().toISOString() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(s))
}

export function clearDoctorSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

// Attempt login by checking stored doctors for username/password
export function loginDoctor(username: string, password: string) {
  const docs = load('doctors', []) as any[]
  const found = docs.find(d => d.username === username && d.password === password)
  if (!found) return null
  // Save session
  saveDoctorSession({ doctorId: found.id, username })
  return found
}

// Attempt to fetch current logged-in doctor object or null
export function currentDoctor() {
  const sess = getDoctorSession()
  if (!sess) return null
  const docs = load('doctors', []) as any[]
  const found = docs.find(d => d.id === sess.doctorId) || null
  return found
}

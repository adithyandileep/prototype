// lib/auth.ts
export const auth = {
  async login(email: string, password: string) {
    // demo: accept any non-empty credentials
    if (!email || !password) return false
    if (typeof window !== 'undefined') sessionStorage.setItem('demo_token', '1')
    return true
  },
  async logout() {
    if (typeof window !== 'undefined') sessionStorage.removeItem('demo_token')
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

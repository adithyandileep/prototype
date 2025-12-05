// app/doctor/login/page.tsx
'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginDoctor } from '@/app/lib/auth'

export default function DoctorLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const doc = loginDoctor(username.trim(), password)
      if (!doc) {
        alert('Invalid username or password')
        setLoading(false)
        return
      }
      // success -> go to doctor dashboard
      router.push('/doctor/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold mb-4">Doctor login</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600">Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm text-slate-600">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" disabled={loading} className="px-3 py-1 bg-indigo-600 text-white rounded">
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <a href="/" className="text-sm text-slate-500">Back to site</a>
          </div>
        </form>
      </div>
    </div>
  )
}

// app/admin/dashboard/layout.tsx
'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'
import ProfileMenu from '@/app/components/ProfileMenu'
import { auth } from '@/app/lib/auth'
import { GuardRoute } from '@/app/components/auth/GuardRouts'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  const router = useRouter()

  async function handleLogout() {
    await auth.logout()
    router.push('/login')
  }

  return (
    <GuardRoute>
      <div className="min-h-screen flex bg-slate-50 text-slate-900">
        <aside className="w-72 bg-white border-r h-screen sticky top-0 flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-lg font-semibold">ClinicCare</h1>
            <p className="text-xs text-slate-500">Admin Dashboard</p>
          </div>
          <div className="p-4 flex-1 overflow-auto">
            <Sidebar pathname={pathname} />
          </div>
          <div className="p-4 border-t">
            <ProfileMenu onLogout={handleLogout} user={auth.getUser()} />
          </div>
        </aside>
        <main className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{deriveTitleFromPath(pathname)}</h2>
              <p className="text-sm text-slate-500">{pathname}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/admin/profile')} className="px-3 py-1 border rounded-md text-sm">
                Profile
              </button>
              <button onClick={handleLogout} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm">
                Logout
              </button>
            </div>
          </div>
          <div>{children}</div>
        </main>
      </div>
    </GuardRoute>
  )
}

function deriveTitleFromPath(path: string) {
  const parts = path.split('/').filter(Boolean)
  if (parts.length <= 2) return 'Dashboard'
  const last = capitalize(parts[parts.length - 1])
  const prev = capitalize(parts[parts.length - 2])
  return `${prev} / ${last}`
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

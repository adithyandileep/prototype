// components/Sidebar.tsx
'use client'
import React, { useState } from 'react'
import Link from 'next/link'

export default function Sidebar({ pathname }: { pathname: string }) {
  const [usersOpen, setUsersOpen] = useState(true)
  return (
    <nav className="space-y-2">
      <SidebarLink href="/admin/dashboard" label="Dashboard" pathname={pathname} />

      <div>
        <button onClick={() => setUsersOpen((s) => !s)} className="w-full flex items-center justify-between px-2 py-2 rounded hover:bg-slate-50">
          <span className="font-medium">Users</span>
          <span className="text-xs text-slate-400">{usersOpen ? '▾' : '▸'}</span>
        </button>
        {usersOpen && (
          <div className="pl-3 mt-2 space-y-1">
            <SidebarLink href="/admin/dashboard/users/doctor" label="Doctor" pathname={pathname} small />
            <SidebarLink href="/admin/dashboard/users/receptionist" label="Receptionist" pathname={pathname} small />
            <SidebarLink href="/admin/dashboard/users/admin" label="Admin" pathname={pathname} small />
          </div>
        )}
      </div>

      <SidebarLink href="/admin/dashboard/patient-registration" label="Patient Registration" pathname={pathname} />
      <SidebarLink href="/admin/dashboard/appointments" label="Appointments" pathname={pathname} />
      <SidebarLink href="/admin/dashboard/reports" label="Reports" pathname={pathname} />
    </nav>
  )
}

function SidebarLink({ href, label, pathname, small }: any) {
  const isActive = pathname === href || pathname?.startsWith(href + '/')
  return (
    <Link href={href} className={`block px-2 py-2 rounded ${isActive ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}>
      <span className={small ? 'text-sm' : ''}>{label}</span>
    </Link>
  )
}

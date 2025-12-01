// components/ProfileMenu.tsx
'use client'
import React, { useState } from 'react'

export default function ProfileMenu({ user, onLogout }: any) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen((s) => !s)} className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-slate-50">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">
          {user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-slate-500">{user.email}</div>
        </div>
        <div className="text-xs text-slate-400">▾</div>
      </button>

      {open && (
        <div className="absolute left-0 w-full mt-2 bg-white border rounded shadow-sm z-10">
          <button
            onClick={() => {
              setOpen(false)
              window.location.pathname = '/admin/profile'
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
          >
            View profile
          </button>
          <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

// app/admin/dashboard/page.tsx
import React from 'react'

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-slate-500">Patients</div>
          <div className="text-3xl font-semibold">128</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-slate-500">Doctors</div>
          <div className="text-3xl font-semibold">12</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-slate-500">Appointments (today)</div>
          <div className="text-3xl font-semibold">24</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">Welcome to the dashboard. Use the side menu to navigate.</div>
    </div>
  )
}

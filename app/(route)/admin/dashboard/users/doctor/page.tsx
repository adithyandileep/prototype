// app/admin/dashboard/users/doctor/page.tsx
'use client'
import React from 'react'
import Link from 'next/link'

export default function DoctorUsersPage() {
  const doctors = [
    { id: 'd1', name: 'Dr. Kavita Rao', specialty: 'General Physician' },
    { id: 'd2', name: 'Dr. Amit Shah', specialty: 'Cardiology' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Doctors</h3>
        <Link href="/admin/dashboard/users/doctor/new" className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">
          Add Doctor
        </Link>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Specialty</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2">{d.name}</td>
                <td className="px-4 py-2">{d.specialty}</td>
                <td className="px-4 py-2">
                  <Link href={`/admin/dashboard/users/doctor/${d.id}`} className="text-indigo-600 text-sm">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

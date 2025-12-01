// app/admin/dashboard/users/doctor/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { load } from '@/app/lib/storage'

export default function DoctorUsersPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<any[]>([])

  useEffect(()=> {
    setDoctors(load('doctors', []))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Doctors</h3>
        <div className="flex gap-2">
          <Link href="/admin/dashboard/users/doctor/new" className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm">Add Doctor</Link>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-2">{d.name}</td>
                <td className="px-4 py-2">{d.type}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <Link href={`/admin/dashboard/users/doctor/${d.id}`} className="text-indigo-600 text-sm">Open</Link>
                    <Link href={`/admin/dashboard/users/doctor/${d.id}/book-appointment`} className="text-sm border px-2 py-1 rounded">Book (public)</Link>
                  </div>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && <tr><td colSpan={3} className="p-4 text-sm text-slate-500">No doctors yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

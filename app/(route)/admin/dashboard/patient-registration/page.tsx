'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

type Patient = {
  id: string
  name: string
  age: number
  createdAt: string
}

const STORAGE_KEY = 'patient_registration_patients'

export default function PatientRegistrationPage() {
  const [patients, setPatients] = useState<Patient[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: Patient[] = JSON.parse(stored)
        setPatients(parsed)
      }
    } catch (err) {
      console.error('Failed to load patients from localStorage', err)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Header row like Doctors page */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Patients</h3>
        <Link
          href="/admin/dashboard/patient-registration/new"
          className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm"
        >
          Add Patient
        </Link>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {patients.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">
            No patients registered yet. Click <span className="font-medium">“Add Patient”</span> to create one.
          </div>
        ) : (
          <table className="w-full text-left table-auto">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Age</th>
                <th className="px-4 py-2">Registered At</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.age}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">
                    {new Date(p.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/dashboard/patient-registration/${p.id}`}
                      className="text-indigo-600 text-sm"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

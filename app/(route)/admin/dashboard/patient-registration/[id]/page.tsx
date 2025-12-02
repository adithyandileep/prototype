'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { load, save } from '@/app/lib/storage'

type Patient = {
  id: string
  name: string
  age: number
  doctorId: string | null
  createdAt: string
}

type Doctor = {
  id: string
  name: string
  type?: string
}

const STORAGE_KEY = 'patient_registration_patients'

export default function PatientDetailPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const patientId = params?.id

  const [patient, setPatient] = useState<Patient | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<{ name: string; age: string; doctorId: string }>({
    name: '',
    age: '',
    doctorId: '',
  })

  useEffect(() => {
    if (!patientId) return

    const patients = load(STORAGE_KEY, []) as Patient[]
    const found = patients.find(p => p.id === patientId) || null
    setPatient(found)

    if (found) {
      setForm({
        name: found.name ?? '',
        age: String(found.age ?? ''),
        doctorId: found.doctorId ?? '',
      })

      if (found.doctorId) {
        const docs = load('doctors', []) as Doctor[]
        const doc = docs.find(d => d.id === found.doctorId) || null
        setDoctor(doc)
      }
    }
  }, [patientId])

  function savePatientEdits() {
    if (!patientId) return
    const patients = load(STORAGE_KEY, []) as Patient[]
    const idx = patients.findIndex(p => p.id === patientId)
    if (idx === -1) {
      alert('Patient not found')
      return
    }

    const parsedAge = Number(form.age || 0)
    if (!form.name.trim() || Number.isNaN(parsedAge) || parsedAge <= 0) {
      alert('Please enter valid name and age')
      return
    }

    const updated: Patient = {
      ...patients[idx],
      name: form.name.trim(),
      age: parsedAge,
      doctorId: form.doctorId || null,
    }

    patients[idx] = updated
    save(STORAGE_KEY, patients)

    // broadcast for other pages if needed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('patients-updated', { detail: { patientId } })
      )
    }

    setPatient(updated)

    // refresh doctor relation
    if (updated.doctorId) {
      const docs = load('doctors', []) as Doctor[]
      const doc = docs.find(d => d.id === updated.doctorId) || null
      setDoctor(doc)
    } else {
      setDoctor(null)
    }

    setEditing(false)
    alert('Patient updated (demo)')
  }

  function handleAddAppointment() {
    if (!patient || !patient.doctorId) {
      alert('No doctor assigned to this patient.')
      return
    }

    // Go to the doctor booking page for this doctor.
    // You can switch this to the public route if you prefer:
    //   router.push(`/doctor/${patient.doctorId}/book-appointment?patientId=${patient.id}`)
    router.push(
      `/admin/dashboard/patient-registration/${patient.id}/book-appointment?docId=${patient.doctorId}`
    )
  }

  if (!patientId) {
    return <div className="bg-white p-4 rounded border">Invalid patient id</div>
  }

  if (!patient) {
    return <div className="bg-white p-4 rounded border">Loading patient...</div>
  }

  // Load all doctors once for dropdown when editing
  const allDoctors = (load('doctors', []) as Doctor[]) || []

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded border">
        {!editing ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold">{patient.name}</div>
              <div className="text-sm text-slate-600">
                Age: {patient.age} • ID: {patient.id}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Doctor:{' '}
                {doctor
                  ? `${doctor.name}${doctor.type ? ` • ${doctor.type}` : ''}`
                  : patient.doctorId
                  ? `Unknown (id: ${patient.doctorId})`
                  : 'Not assigned'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Registered:{' '}
                {new Date(patient.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1 border rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() =>
                  router.push('/admin/dashboard/patient-registration')
                }
                className="px-3 py-1 border rounded text-sm"
              >
                Back
              </button>
              <button
                onClick={handleAddAppointment}
                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
              >
                Add appointment
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-600">Name</label>
                <input
                  value={form.name}
                  onChange={e =>
                    setForm(s => ({ ...s, name: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600">Age</label>
                <input
                  type="number"
                  min={0}
                  value={form.age}
                  onChange={e =>
                    setForm(s => ({ ...s, age: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600">
                  Primary Doctor
                </label>
                {allDoctors.length ? (
                  <select
                    value={form.doctorId}
                    onChange={e =>
                      setForm(s => ({ ...s, doctorId: e.target.value }))
                    }
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">None</option>
                    {allDoctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.type ? `• ${d.type}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-500 mt-1">
                    No doctors found in system.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={savePatientEdits}
                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setForm({
                    name: patient.name,
                    age: String(patient.age),
                    doctorId: patient.doctorId ?? '',
                  })
                }}
                className="px-3 py-1 border rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

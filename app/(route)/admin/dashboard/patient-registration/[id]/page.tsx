// app/admin/dashboard/patient-registration/[id]/page.tsx
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
  appointments?: any[]
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

  // Listen for patients-updated (e.g. booking flow or doctor mark done dispatched this event)
  useEffect(() => {
    function onPatientsUpdated(e: any) {
      if (!e?.detail) return
      if (e.detail.patientId !== patientId) return
      const patients = load(STORAGE_KEY, []) as Patient[]
      const found = patients.find(p => p.id === patientId) || null
      setPatient(found)
      if (found && found.doctorId) {
        const docs = load('doctors', []) as Doctor[]
        const doc = docs.find(d => d.id === found.doctorId) || null
        setDoctor(doc)
      }
    }
    window.addEventListener('patients-updated', onPatientsUpdated)
    return () => window.removeEventListener('patients-updated', onPatientsUpdated)
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
      window.dispatchEvent(new CustomEvent('patients-updated', { detail: { patientId } }))
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

    router.push(
      `/admin/dashboard/patient-registration/${patient.id}/book-appointment?docId=${patient.doctorId}&patientId=${patient.id}`
    )
  }

  if (!patientId) {
    return <div className="bg-white p-4 rounded border">Invalid patient id</div>
  }

  if (!patient) {
    return <div className="bg-white p-4 rounded border">Loading patient...</div>
  }

  // Normalize appointment statuses: default booked if missing
  const appointments = (patient.appointments || []).map(a => ({ ...a, status: a.status || 'booked' }))

  const upcoming = appointments.filter((a:any) => a.status !== 'completed')
  const history = appointments.filter((a:any) => a.status === 'completed').sort((a:any,b:any)=> new Date(b.completedAt||0).getTime() - new Date(a.completedAt||0).getTime())

  // Load all doctors once for dropdown when editing
  const allDoctors = (load('doctors', []) as Doctor[]) || []

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded border">
        {!editing ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold">{patient.name}</div>
              <div className="text-sm text-slate-600">Age: {patient.age} • ID: {patient.id}</div>
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
              <button onClick={() => setEditing(true)} className="px-3 py-1 border rounded text-sm">Edit</button>
              <button onClick={() => router.push('/admin/dashboard/patient-registration')} className="px-3 py-1 border rounded text-sm">Back</button>
              <button onClick={handleAddAppointment} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Add appointment</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-600">Name</label>
                <input value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm text-slate-600">Age</label>
                <input type="number" min={0} value={form.age} onChange={e => setForm(s => ({ ...s, age: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm text-slate-600">Primary Doctor</label>
                {allDoctors.length ? (
                  <select value={form.doctorId} onChange={e => setForm(s => ({ ...s, doctorId: e.target.value }))} className="w-full border rounded px-2 py-1">
                    <option value="">None</option>
                    {allDoctors.map(d => <option key={d.id} value={d.id}>{d.name} {d.type ? `• ${d.type}` : ''}</option>)}
                  </select>
                ) : (
                  <div className="text-xs text-slate-500 mt-1">No doctors found in system.</div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button onClick={savePatientEdits} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Save</button>
              <button onClick={() => {
                setEditing(false)
                setForm({ name: patient.name, age: String(patient.age), doctorId: patient.doctorId ?? '' })
              }} className="px-3 py-1 border rounded text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white p-4 rounded border">
        <h4 className="font-medium">Upcoming Appointments</h4>
        {upcoming.length ? (
          <ul className="mt-2 space-y-2">
            {upcoming.map((a:any) => (
              <li key={a.id} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <div className="font-medium">{a.doctorName} • Token: <span className="font-semibold">{a.token}</span></div>
                  <div className="text-xs text-slate-600">{new Date(a.start).toLocaleString()} — booked {new Date(a.bookedAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-slate-500">Slot ID: {a.slotId}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-500 mt-2">No upcoming appointments.</div>
        )}
      </div>

      {/* Appointment History */}
      <div className="bg-white p-4 rounded border">
        <h4 className="font-medium">Appointment History</h4>
        {history.length ? (
          <ul className="mt-2 space-y-2">
            {history.map((a:any) => (
              <li key={a.id} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <div className="font-medium">{a.doctorName} • Token: <span className="font-semibold">{a.token}</span></div>
                  <div className="text-xs text-slate-600">
                    {new Date(a.start).toLocaleString()} — completed {a.completedAt ? new Date(a.completedAt).toLocaleString() : ''}
                  </div>
                </div>
                <div className="text-sm text-slate-500">Slot ID: {a.slotId}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-500 mt-2">No completed appointments yet.</div>
        )}
      </div>
    </div>
  )
}

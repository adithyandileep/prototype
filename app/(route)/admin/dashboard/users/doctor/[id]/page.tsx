// app/admin/dashboard/users/doctor/[id]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { load, save } from '@/app/lib/storage'
import DoctorAvailability from '@/app/components/DoctorAvailablity'
import SlotModal from '@/app/components/SlotModal'

export default function DoctorDetailPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const docId = params?.id
  const [doctor, setDoctor] = useState<any | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', type: '' })
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    if (!docId) return
const doctors = load<any[]>('doctors', [])
    const found = doctors.find((d: any) => d.id === docId) || null
    setDoctor(found)
    if (found) setForm({ name: found.name ?? '', type: found.type ?? '' })
  }, [docId])

  useEffect(() => {
    if (!docId) return
    const all = load(`slots_${docId}`, []) as any[]
    setBookings(all.filter(s => s.status === 'booked'))
    function onSlotsUpdated(e: any) {
      if (e?.detail?.doctorId === docId) {
        const all2 = load(`slots_${docId}`, []) as any[]
        setBookings(all2.filter(s => s.status === 'booked'))
      }
    }
    window.addEventListener('slots-updated', onSlotsUpdated)
    return () => window.removeEventListener('slots-updated', onSlotsUpdated)
  }, [docId])

  function saveDoctorEdits() {
    if (!docId) return
const doctors = load<any[]>('doctors', [])
    const idx = doctors.findIndex((d: any) => d.id === docId)
    if (idx === -1) return alert('Doctor not found')
    doctors[idx] = { ...doctors[idx], name: form.name, type: form.type }
    save('doctors', doctors)
    // broadcast change so other pages (lists / patient registration) reload
    window.dispatchEvent(new CustomEvent('doctors-updated', { detail: { doctorId: docId } }))
    setDoctor(doctors[idx])
    setEditing(false)
    alert('Doctor updated (demo)')
  }

  function handleSaveSlotConfig(cfg: any) {
    if (!docId) return
    const existing = load(`slots_${docId}`, [])
    const map = new Map<string, any>()
    existing.concat(cfg.slots).forEach((s: any) => map.set(s.id, s))
    const merged = Array.from(map.values()).sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
    save(`slots_${docId}`, merged)
    // notify availability components
    window.dispatchEvent(new CustomEvent('slots-updated', { detail: { doctorId: docId } }))
    setOpen(false)
  }

  if (!docId) return <div className="bg-white p-4 rounded border">Invalid doctor id</div>
  if (!doctor) return <div className="bg-white p-4 rounded border">Loading doctor...</div>

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded border">
        {!editing ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{doctor.name}</div>
              <div className="text-sm text-slate-600">{doctor.type} • ID: {doctor.id}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="px-3 py-1 border rounded">Edit</button>
              <button onClick={() => router.push('/admin/dashboard/users/doctor')} className="px-3 py-1 border rounded">Back</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-600">Name</label>
                <input value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="text-sm text-slate-600">Type</label>
                <input value={form.type} onChange={(e) => setForm(s => ({ ...s, type: e.target.value }))} className="w-full border rounded px-2 py-1" />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button onClick={saveDoctorEdits} className="px-3 py-1 bg-indigo-600 text-white rounded">Save</button>
              <button onClick={() => { setEditing(false); setForm({ name: doctor.name, type: doctor.type }) }} className="px-3 py-1 border rounded">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Admin: availability (create slots etc) */}
      <DoctorAvailability doctorId={doctor.id} onOpenSlotModal={() => setOpen(true)} showCreateButton={true} showActions={true} />

      <SlotModal open={open} onClose={() => setOpen(false)} onSave={handleSaveSlotConfig} doctorId={doctor.id} />

      {/* Booked appointments panel */}
      <div className="bg-white p-4 rounded border">
        <h4 className="font-medium">Booked Appointments</h4>
        {bookings.length ? (
          <ul className="mt-2 space-y-2">
            {bookings.map((b:any)=>(
              <li key={b.id} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <div className="font-medium">{b.patientName ?? 'Unknown patient'} • Token: <span className="font-semibold">{b.token}</span></div>
                  <div className="text-xs text-slate-600">{new Date(b.start).toLocaleString()}</div>
                </div>
                <div className="text-sm text-slate-500">Slot ID: {b.id}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-500 mt-2">No bookings yet.</div>
        )}
      </div>
    </div>
  )
}

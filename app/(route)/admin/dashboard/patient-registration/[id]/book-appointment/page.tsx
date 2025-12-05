// app/admin/dashboard/patient-registration/[id]/book-appointment/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DoctorAvailability from '@/app/components/DoctorAvailablity' // your existing component
import { load, save } from '@/app/lib/storage'
import { generateTokenForDoctor } from '@/app/lib/token'

export default function PublicDoctorBookingPage() {
  const params = useSearchParams()
  const router = useRouter()
  const docId = params.get('docId')
  const patientId = params.get('patientId') // optional: if booking for an existing patient
  const [doctor, setDoctor] = useState<any | null>(null)
  const [slotsReloadKey, setSlotsReloadKey] = useState(0)

  useEffect(() => {
    if (!docId) return

    const docs = load('doctors', [])
    const found = docs.find((d: any) => d.id === docId) || null
    setDoctor(found)

    // Re-render availability when a slot config is updated anywhere (admin side)
    const onSlotsUpdated = (e: any) => {
      const detail = e?.detail
      if (!detail || detail.doctorId !== docId) return
      setSlotsReloadKey((k) => k + 1)
    }

    window.addEventListener('slots-updated', onSlotsUpdated)
    return () => window.removeEventListener('slots-updated', onSlotsUpdated)
  }, [docId])

  async function handleBook(bookedSlot: any) {
    if (!bookedSlot || !doctor) {
      alert('Could not book slot.')
      return
    }

    // Load fresh slots and do optimistic check to avoid race
    const slotsKey = `slots_${doctor.id}`
    const latest = load(slotsKey, []) as any[]
    const original = latest.find(s => s.id === bookedSlot.id)
    if (!original) {
      alert('Slot no longer exists.')
      return
    }
    if (original.status !== 'available' || new Date(original.end) <= new Date()) {
      alert('Slot is no longer available. Please pick another slot.')
      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('slots-updated', { detail: { doctorId: doctor.id } }))
      setSlotsReloadKey(k => k + 1)
      return
    }

    // Generate token for this doctor (per-day sequence)
    const token = generateTokenForDoctor(doctor.id)

    // Update slots: mark booked + attach patient info & token
    const updated = latest.map(s => {
      if (s.id !== bookedSlot.id) return s
      return {
        ...s,
        status: 'booked',
        patientId: patientId || null,
        patientName: patientId ? (() => {
          const PAT_KEY = 'patient_registration_patients'
          const patients = load(PAT_KEY, []) as any[]
          const p = patients.find(x => x.id === patientId)
          return p ? p.name : null
        })() : null,
        token,
        bookedAt: new Date().toISOString(),
      }
    })

    // Persist slots and broadcast
    save(slotsKey, updated)
    window.dispatchEvent(new CustomEvent('slots-updated', { detail: { doctorId: doctor.id } }))

    // Also add appointment into patient record if patientId present
    if (patientId) {
      const PAT_KEY = 'patient_registration_patients'
      const patients = load(PAT_KEY, []) as any[]
      const idx = patients.findIndex(p => p.id === patientId)
      if (idx !== -1) {
        const appointment = {
          id: `appt_${Date.now().toString(36)}`,
          doctorId: doctor.id,
          doctorName: doctor.name,
          slotId: bookedSlot.id,
          token,
          start: bookedSlot.start,
          end: bookedSlot.end,
          bookedAt: new Date().toISOString(),
        }
        patients[idx].appointments = patients[idx].appointments || []
        patients[idx].appointments.push(appointment)
        save(PAT_KEY, patients)
        window.dispatchEvent(new CustomEvent('patients-updated', { detail: { patientId } }))
      }
    }

    // Confirmation UI
    alert(`Appointment confirmed. Token: ${token} — ${new Date(bookedSlot.start).toLocaleString()}`)

    // refresh local availability
    setSlotsReloadKey(k => k + 1)
  }

  if (!docId) {
    return <div className="p-4 bg-white rounded border">Invalid doctor id</div>
  }

  if (!doctor) {
    return <div className="p-4 bg-white rounded border">Doctor not found</div>
  }

  return (
    <div className="space-y-4">
      {/* Header card with basic doctor info + back */}
      <div className="bg-white p-4 rounded border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Book appointment</div>
          <div className="text-sm text-slate-600">
            {doctor.name} {doctor.type ? `• ${doctor.type}` : ''}
          </div>
        </div>
        <button onClick={() => router.push('/')} className="px-3 py-1 border rounded text-sm">Back</button>
      </div>

      {/* User-side booking: show only future available slots with a “Book” action */}
      <div className="bg-white p-4 rounded border">
        <div className="text-sm text-slate-600 mb-3">
          Select a suitable time slot to book your appointment with this doctor.
        </div>

        <DoctorAvailability
          key={slotsReloadKey}
          doctorId={doctor.id}
          showCreateButton={false}
          showActions={false}
          onBook={handleBook}
        />
      </div>
    </div>
  )
}

// app/doctor/dashboard/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDoctorSession, clearDoctorSession, currentDoctor } from '@/app/lib/auth'
import { load } from '@/app/lib/storage'
import DoctorAvailability from '@/app/components/DoctorAvailablity'
import { createVisit } from '@/app/lib/visits'

export default function DoctorDashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [doctor, setDoctor] = useState<any | null>(null)
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    const s = getDoctorSession()
    if (!s) {
      router.push('/doctor/login')
      return
    }
    setSession(s)
    const d = currentDoctor()
    if (!d) {
      // session stale: logout and redirect to login
      clearDoctorSession()
      router.push('/doctor/login')
      return
    }
    setDoctor(d)

    // load booked slots
    const allSlots = load(`slots_${d.id}`, []) as any[]
    setBookings(allSlots.filter(s => s.status === 'booked'))

    // listen for updates
    function onSlotsUpdated(e: any) {
      if (!e?.detail) return
      if (e.detail.doctorId !== d.id) return
      const all = load(`slots_${d.id}`, []) as any[]
      setBookings(all.filter(s => s.status === 'booked'))
    }
    window.addEventListener('slots-updated', onSlotsUpdated)
    return () => window.removeEventListener('slots-updated', onSlotsUpdated)
  }, [router])

  function logout() {
    clearDoctorSession()
    router.push('/doctor/login')
  }

  // Acknowledge: create a visit record and redirect the doctor to the visit editor page
  // Note: createVisit will generate the visit id and persist it.
  async function handleAcknowledge(slot: any) {
    if (!slot || !doctor) return
    const confirmOk = confirm(`Open visit page for patient ${slot.patientName ?? 'Unknown'}?`)
    if (!confirmOk) return

    // createVisit expects the limited shape: patientId?, doctorId?, slotId?, token?, complaints?, status?, initialData?
    const created = createVisit({
      patientId: slot.patientId ?? null,
      doctorId: doctor.id,
      slotId: slot.id,
      token: slot.token ?? null,
      complaints: '',
      status: 'acknowledged', // valid status from the union
      initialData: {
        // any extra fields you want inside visit (vitals/prescriptions blank initially)
        vitals: {},
        prescriptions: [],
        investigations: [],
        diagnosis: '',
        notes: '',
      },
    })

    // createVisit returns the created record (with id). navigate using that id.
    const visitId = created?.id
    if (!visitId) {
      alert('Could not create visit. Please try again.')
      return
    }

    // redirect to visit editor
    router.push(`/doctor/dashboard/${slot.patientId}/visit/${visitId}`)
  }

  if (!session || !doctor) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded border">
          <div>
            <div className="text-lg font-semibold">Dr. {doctor.name}</div>
            <div className="text-sm text-slate-600">{doctor.type} • ID: {doctor.id}</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="px-3 py-1 border rounded text-sm">Site</button>
            <button onClick={logout} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Logout</button>
          </div>
        </div>

        {/* Booked appointments panel (same as admin but limited to this doctor) */}
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium">Your Booked Appointments</h4>
          {bookings.length ? (
            <ul className="mt-2 space-y-2">
              {bookings.map((b:any) => (
                <li key={b.id} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <div className="font-medium">{b.patientName ?? 'Unknown'} • Token: <span className="font-semibold">{b.token}</span></div>
                    <div className="text-xs text-slate-600">{new Date(b.start).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAcknowledge(b)} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm">Acknowledge</button>
                    <div className="text-sm text-slate-500">Slot ID: {b.id}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500 mt-2">No bookings yet.</div>
          )}
        </div>

        {/* Availability viewer (read-only) — doctor can see availability and mark done if desired */}
        <DoctorAvailability doctorId={doctor.id} showCreateButton={false} showActions={true} />
      </div>
    </div>
  )
}

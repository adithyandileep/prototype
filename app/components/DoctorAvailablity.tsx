// components/DoctorAvailablity.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { load, save } from '@/app/lib/storage' // adjust import path if needed

/**
 Props:
  - doctorId: string
  - onOpenSlotModal?: () => void       // admin: open slot modal
  - showCreateButton?: boolean         // admin: show create button
  - onBook?: (slot) => void            // public page provides this to handle booking (persist/token)
  - showActions?: boolean              // admin: show actions like markCompleted
*/
export default function DoctorAvailability({
  doctorId,
  onOpenSlotModal,
  showCreateButton = false,
  onBook,
  showActions = false,
}: any) {
  const [slots, setSlots] = useState<any[]>(() => load(`slots_${doctorId}`, []))
  const [summary, setSummary] = useState({ available: 0, booked: 0, expired: 0, completed: 0 })

  // load initial slots when doctorId changes
  useEffect(() => {
    setSlots(load(`slots_${doctorId}`, []))
  }, [doctorId])

  // recalc summary and persist when slots change
  useEffect(() => {
    const now = new Date()
    const s = { available: 0, booked: 0, expired: 0, completed: 0 }
    slots.forEach((slot: any) => {
      if (slot.status === 'completed') s.completed++
      else if (slot.status === 'booked') s.booked++
      else {
        if (new Date(slot.end) <= now) s.expired++
        else s.available++
      }
    })
    setSummary(s)

    // Persist the latest snapshot (component may own changes)
    save(`slots_${doctorId}`, slots)
  }, [slots, doctorId])

  // listen for external updates
  useEffect(() => {
    function onSlotsUpdated(e: any) {
      if (!e?.detail) return
      if (e.detail.doctorId === doctorId) {
        setSlots(load(`slots_${doctorId}`, []))
      }
    }
    window.addEventListener('slots-updated', onSlotsUpdated)
    return () => window.removeEventListener('slots-updated', onSlotsUpdated)
  }, [doctorId])

  // Admin-side internal booking (fallback): used only when parent DOES NOT provide onBook
  function internalBookSlot(slotId: string) {
    const now = new Date()
    const updated = slots.map((s: any) => {
      if (s.id !== slotId) return s
      if (s.status !== 'available') return s
      if (new Date(s.end) <= now) return s
      return { ...s, status: 'booked' }
    })

    setSlots(updated)
    save(`slots_${doctorId}`, updated)
    window.dispatchEvent(new CustomEvent('slots-updated', { detail: { doctorId } }))

    const booked = updated.find((s: any) => s.id === slotId)
    return booked
  }

  // Mark a slot completed: update slot, persist & broadcast, AND update patient appointment record (if any)
  function internalMarkCompleted(slotId: string) {
    const updatedSlots = slots.map((s:any) => s.id === slotId ? { ...s, status: 'completed' } : s)
    setSlots(updatedSlots)
    save(`slots_${doctorId}`, updatedSlots)
    window.dispatchEvent(new CustomEvent('slots-updated', { detail: { doctorId } }))

    // If this slot had a patient, update that patient's appointment record to status 'completed'
    try {
      const slot = updatedSlots.find((s:any) => s.id === slotId)
      if (slot && slot.patientId) {
        const PAT_KEY = 'patient_registration_patients'
        const patients = load(PAT_KEY, []) as any[]
        const pIdx = patients.findIndex((p:any) => p.id === slot.patientId)
        if (pIdx !== -1) {
          patients[pIdx].appointments = patients[pIdx].appointments || []
          // find appointment by slotId (or token)
          const apptIdx = patients[pIdx].appointments.findIndex((a:any) => a.slotId === slotId || a.id === slot.appointmentId)
          if (apptIdx !== -1) {
            patients[pIdx].appointments[apptIdx].status = 'completed'
            patients[pIdx].appointments[apptIdx].completedAt = new Date().toISOString()
          } else {
            // fallback: create an appointment history item if missing
            const fallbackAppt = {
              id: `appt_${Date.now().toString(36)}`,
              doctorId,
              doctorName: '', // we don't have doctor name here; frontends that read appointments often join with doctors list
              slotId: slot.id,
              token: slot.token ?? null,
              start: slot.start,
              end: slot.end,
              bookedAt: slot.bookedAt ?? null,
              status: 'completed',
              completedAt: new Date().toISOString()
            }
            patients[pIdx].appointments.push(fallbackAppt)
          }
          save(PAT_KEY, patients)
          window.dispatchEvent(new CustomEvent('patients-updated', { detail: { patientId: slot.patientId } }))
        }
      }
    } catch (e) {
      console.error('Error updating patient appointment on mark completed', e)
    }
  }

  // When a Book button is clicked in UI:
  // - If parent passed onBook => call onBook(slot) and DO NOT mutate/persist here.
  // - Else (admin/internals) perform internalBookSlot().
  function handleBookClick(slotId: string) {
    const slot = slots.find((s:any) => s.id === slotId)
    if (!slot) {
      alert('Slot not found.')
      return
    }

    if (typeof onBook === 'function') {
      onBook(slot)
      return
    }

    // else admin fallback
    const booked = internalBookSlot(slotId)
    if (typeof onBook === 'function' && booked) {
      try { onBook(booked) } catch {}
    }
  }

  function fmtShort(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString()
  }

  function displayCategory(slot: any) {
    const now = new Date()
    if (slot.status === 'completed') return 'completed'
    if (slot.status === 'booked') return 'booked'
    if (new Date(slot.end) <= now) return 'expired'
    return 'available'
  }

  const sorted = [...slots].sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())

  return (
    <div className="bg-white p-4 rounded border space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Availability</h4>
        <div className="flex gap-2 text-xs">
          <div className="px-2 py-1 rounded border">Available <span className="font-semibold text-green-600">{summary.available}</span></div>
          <div className="px-2 py-1 rounded border">Booked <span className="font-semibold text-red-600">{summary.booked}</span></div>
          <div className="px-2 py-1 rounded border">Expired <span className="font-semibold text-slate-600">{summary.expired}</span></div>
          <div className="px-2 py-1 rounded border">Completed <span className="font-semibold text-slate-500">{summary.completed}</span></div>
        </div>
      </div>

      <div>
        <div className="flex gap-2 mb-3">
          {showCreateButton && (
            <button onClick={onOpenSlotModal} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Create slot / Add slot</button>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="text-sm text-slate-500">No availability configured.</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-72 overflow-auto">
            {sorted.map((slot:any) => {
              const cat = displayCategory(slot)
              const style =
                cat === 'available' ? { background: '#ecfdf5' } :
                cat === 'booked' ? { background: '#fff1f2' } :
                cat === 'expired' ? { background: '#f8fafc', color: '#6b7280' } :
                { background: '#f1f5f9' } // completed

              return (
                <div key={slot.id} className="p-2 rounded flex items-center justify-between" style={style}>
                  <div>
                    <div className="font-medium">{fmtShort(slot.start)} → {new Date(slot.end).toLocaleTimeString()}</div>
                    <div className="text-xs text-slate-600">
                      Status: <span className="font-medium">{slot.status}</span>
                      {slot.patientName ? ` • ${slot.patientName}` : ''}
                      {slot.token ? ` • ${slot.token}` : ''}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {cat === 'available' && !showActions && (
                      <button onClick={() => handleBookClick(slot.id)} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Book</button>
                    )}

                    {showActions && slot.status === 'booked' && (
                      <button onClick={() => internalMarkCompleted(slot.id)} className="px-2 py-1 border rounded text-sm">Mark done</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

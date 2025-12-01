// components/DoctorAvailability.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { load, save } from '../lib/storage'

export default function DoctorAvailability({
  doctorId,
  onOpenSlotModal,
  showCreateButton = false,
  onBook,
  showActions = false,
}: any) {
  const [slots, setSlots] = useState<any[]>(() => load(`slots_${doctorId}`, []))
  const [summary, setSummary] = useState({ available: 0, booked: 0, expired: 0, completed: 0 })

  useEffect(() => {
    // reload when doctorId changes
    setSlots(load(`slots_${doctorId}`, []))
  }, [doctorId])

  useEffect(() => {
    // recalc summary and persist
    const now = new Date()
    const s = { available: 0, booked: 0, expired: 0, completed: 0 }
    slots.forEach(slot => {
      if (slot.status === 'completed') s.completed++
      else if (slot.status === 'booked') s.booked++
      else {
        if (new Date(slot.end) <= now) s.expired++
        else s.available++
      }
    })
    setSummary(s)
    save(`slots_${doctorId}`, slots)
  }, [slots, doctorId])

  // Listen for custom event 'slots-updated' to auto refresh (parent dispatches after save)
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

  function bookSlot(id: string) {
    const now = new Date()
    setSlots(prev =>
      prev.map(s => {
        if (s.id !== id) return s
        if (s.status !== 'available') return s
        if (new Date(s.end) <= now) return s
        const updated = { ...s, status: 'booked' }
        // optional: attach patient info, etc
        return updated
      })
    )
    onBook?.(id)
  }

  function markCompleted(id: string) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, status: 'completed' } : s))
  }

  function displayCategory(slot: any) {
    const now = new Date()
    if (slot.status === 'completed') return 'completed'
    if (slot.status === 'booked') return 'booked'
    if (new Date(slot.end) <= now) return 'expired'
    return 'available'
  }

  const sorted = [...slots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  function fmtShort(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString()
  }

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
            {sorted.map(slot => {
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
                    <div className="text-xs text-slate-600">Status: <span className="font-medium">{slot.status}</span>{slot.patientName ? ` • ${slot.patientName}` : ''}</div>
                  </div>

                  <div className="flex gap-2">
                    {cat === 'available' && !showActions && (
                      <button onClick={() => bookSlot(slot.id)} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Book</button>
                    )}

                    {showActions && slot.status === 'booked' && (
                      <button onClick={() => markCompleted(slot.id)} className="px-2 py-1 border rounded text-sm">Mark done</button>
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

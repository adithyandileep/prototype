// app/lib/visits.ts
import { load, save } from './storage'

/**
 * Visit schema (stored in 'visits' array)
 * {
 *   id: string,
 *   patientId,
 *   doctorId,
 *   slotId?,
 *   appointmentId?,
 *   token?,
 *   createdAt,
 *   updatedAt,
 *   status: 'in-progress' | 'completed',
 *   vitals: {...},
 *   complaints: string,
 *   diagnosis: string,
 *   prescriptions: [{id, drug, dose, duration, notes}],
 *   investigations: [{id, name, result, notes}],
 *   notes: string
 * }
 */

export function loadVisits(): any[] {
  return load('visits', [])
}

export function getVisitById(id: string) {
  const v = load('visits', [])
  return v.find((x:any) => x.id === id) || null
}

export function getVisitsForPatient(patientId: string) {
  return load('visits', []).filter((v:any) => v.patientId === patientId).sort((a:any,b:any)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function createVisit(visit: any) {
  const all = load('visits', [])
  all.push(visit)
  save('visits', all)
  // broadcast so the UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('visits-updated', { detail: { visitId: visit.id, patientId: visit.patientId, doctorId: visit.doctorId } }))
  }
}

export function updateVisit(visit: any) {
  const all = load('visits', [])
  const idx = all.findIndex((v:any) => v.id === visit.id)
  if (idx !== -1) {
    all[idx] = visit
  } else {
    all.push(visit)
  }
  save('visits', all)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('visits-updated', { detail: { visitId: visit.id, patientId: visit.patientId, doctorId: visit.doctorId } }))
  }
}

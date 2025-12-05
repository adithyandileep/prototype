// app/lib/visits.ts
// Simple visits helpers backed by localStorage (demo)

import { load, save } from './storage'

export type VisitRecord = {
  id: string
  patientId?: string | null
  doctorId?: string | null
  slotId?: string | null
  appointmentId?: string | null // optional mapping for patient appointments
  token?: string | null
  complaints?: string
  vitals?: any
  prescriptions?: any[]
  investigations?: any[]
  diagnosis?: string
  notes?: string
  status?: 'draft' | 'acknowledged' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  completedAt?: string | null
  // ...any other fields
}

// Helper: iterate doctors' slots to find a slot and its owning doctor
export function findSlotAndOwner(slotId: string) {
  const doctors = load<any[]>('doctors', [])
  for (const d of doctors) {
    try {
      const slots = load<any[]>(`slots_${d.id}`, [])
      const found = slots.find((s: any) => s.id === slotId)
      if (found) {
        return { doctorId: d.id, slot: found }
      }
    } catch (e) {
      // ignore and continue
    }
  }
  return null
}

const VISITS_KEY = 'visits'

// Create a new visit and persist it. Ensures patientId/doctorId are set where possible.
export function createVisit({
  patientId = null,
  doctorId = null,
  slotId = null,
  token = null,
  complaints = '',
  status = 'draft',
  initialData = {},
}: {
  patientId?: string | null
  doctorId?: string | null
  slotId?: string | null
  token?: string | null
  complaints?: string
  status?: 'draft' | 'acknowledged' | 'completed' | 'cancelled'
  initialData?: any
}): VisitRecord {
  const visits = load<VisitRecord[]>(VISITS_KEY, [])
  const id = `visit_${Date.now().toString(36)}`
  let finalDoctorId = doctorId ?? null
  let finalPatientId = patientId ?? null

  // If doctor or patient missing but slotId present, try to infer from slot
  if ((!finalDoctorId || !finalPatientId) && slotId) {
    const found = findSlotAndOwner(slotId)
    if (found) {
      if (!finalDoctorId) finalDoctorId = found.doctorId
      if (!finalPatientId && found.slot?.patientId) finalPatientId = found.slot.patientId
    }
  }

  const now = new Date().toISOString()
  const visit: VisitRecord = {
    id,
    patientId: finalPatientId,
    doctorId: finalDoctorId,
    slotId,
    token,
    complaints,
    status,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    prescriptions: [],
    investigations: [],
    vitals: {},
    ...initialData,
  }

  visits.push(visit)
  save(VISITS_KEY, visits)

  // broadcast so UI can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('visits-updated', { detail: { visitId: id } }))
  }

  return visit
}

export function getVisitById(id: string): VisitRecord | null {
  const visits = load<VisitRecord[]>(VISITS_KEY, [])
  return visits.find((v) => v.id === id) ?? null
}

export function getVisitsForPatient(patientId?: string | null): VisitRecord[] {
  if (!patientId) return []
  const visits = load<VisitRecord[]>(VISITS_KEY, [])
  // latest first
  return visits.filter((v) => v.patientId === patientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function updateVisit(patch: Partial<VisitRecord> & { id: string }): VisitRecord | null {
  const visits = load<VisitRecord[]>(VISITS_KEY, [])
  const idx = visits.findIndex((v) => v.id === patch.id)
  if (idx === -1) return null
  const now = new Date().toISOString()
  const updated: VisitRecord = {
    ...visits[idx],
    ...patch,
    updatedAt: now,
  }
  // if we're marking completed, set completedAt if not present
  if (updated.status === 'completed' && !updated.completedAt) {
    updated.completedAt = now
  }
  visits[idx] = updated
  save(VISITS_KEY, visits)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('visits-updated', { detail: { visitId: updated.id } }))
  }
  return updated
}

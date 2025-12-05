// app/doctor/dashboard/[patientId]/visit/[visitId]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { load, save } from '@/app/lib/storage'
import { getVisitById, updateVisit, getVisitsForPatient, findSlotAndOwner } from '@/app/lib/visits'

function ViewModal({ open, onClose, visit }: { open: boolean; onClose: ()=>void; visit: any }) {
  if (!open || !visit) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded max-w-2xl w-full p-4 overflow-auto max-h-[80vh]">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold">Visit details</h3>
          <button onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>

        <div className="space-y-3 text-sm">
          <div><b>ID:</b> {visit.id}</div>
          <div><b>Status:</b> {visit.status}</div>
          <div><b>Doctor ID:</b> {visit.doctorId}</div>
          <div><b>Slot ID:</b> {visit.slotId}</div>
          <div><b>Token:</b> {visit.token}</div>
          <div><b>Created:</b> {new Date(visit.createdAt).toLocaleString()}</div>
          <hr />
          <div><b>Vitals</b>
            <div className="text-xs text-slate-600 mt-1">{JSON.stringify(visit.vitals || {}, null, 2)}</div>
          </div>

          <div><b>Complaints</b>
            <div className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{visit.complaints || '-'}</div>
          </div>
          <div><b>Diagnosis</b>
            <div className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{visit.diagnosis || '-'}</div>
          </div>

          <div><b>Prescriptions</b>
            {visit.prescriptions && visit.prescriptions.length ? (
              <ul className="mt-1 list-disc list-inside">
                {visit.prescriptions.map((p:any) => <li key={p.id}>{p.drug} — {p.dose} — {p.duration} {p.notes ? `(${p.notes})` : ''}</li>)}
              </ul>
            ) : <div className="text-xs text-slate-600 mt-1">No prescriptions</div>}
          </div>

          <div><b>Investigations</b>
            {visit.investigations && visit.investigations.length ? (
              <ul className="mt-1 list-disc list-inside">
                {visit.investigations.map((iv:any) => <li key={iv.id}>{iv.name} — {iv.result} {iv.notes ? `(${iv.notes})` : ''}</li>)}
              </ul>
            ) : <div className="text-xs text-slate-600 mt-1">No investigations</div>}
          </div>

          <div><b>Notes</b>
            <div className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{visit.notes || '-'}</div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-3 py-1 border rounded">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function DoctorVisitPage() {
  const params = useParams() as { patientId?: string; visitId?: string }
  const router = useRouter()

  const routePatientId = params?.patientId
  const visitId = params?.visitId

  const [visit, setVisit] = useState<any | null>(null)
  const [draft, setDraft] = useState<any | null>(null)
  const [patient, setPatient] = useState<any | null>(null)
  const [doctor, setDoctor] = useState<any | null>(null)
  const [previousVisits, setPreviousVisits] = useState<any[]>([])
  const [viewModalVisit, setViewModalVisit] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!visitId) return
    const v = getVisitById(visitId)
    if (!v) {
      setVisit(null)
      setDraft(null)
      return
    }

    setVisit(v)
    setDraft(JSON.parse(JSON.stringify(v)))

    // determine patientId and doctorId for this visit.
    // Prefer v.patientId/v.doctorId, then route param, then infer via slot.
    let visitPatientId = v.patientId ?? routePatientId ?? null
    let visitDoctorId = v.doctorId ?? null

    if ((!visitPatientId || !visitDoctorId) && v.slotId) {
      const res = findSlotAndOwner(v.slotId)
      if (res) {
        if (!visitDoctorId) visitDoctorId = res.doctorId
        if (!visitPatientId && res.slot?.patientId) visitPatientId = res.slot.patientId
      }
    }

    // Load patient info
    if (visitPatientId) {
      const patients = load<any[]>('patient_registration_patients', [])
      const p = patients.find((x:any) => x.id === visitPatientId) || null
      setPatient(p)
    } else {
      setPatient(null)
    }

    // Load doctor info
    if (visitDoctorId) {
      const docs = load<any[]>('doctors', [])
      const d = docs.find((x:any) => x.id === visitDoctorId) || null
      setDoctor(d)
    } else {
      setDoctor(null)
    }

    // previous completed visits for this patient (exclude current)
    if (visitPatientId) {
      const pv = getVisitsForPatient(visitPatientId)
      setPreviousVisits(pv.filter((p:any) => p.id !== visitId && p.status === 'completed'))
    } else {
      setPreviousVisits([])
    }
  }, [visitId, routePatientId])

  if (!visit || draft === null) return <div className="p-4 border bg-white rounded">Visit not found</div>

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      // ensure we persist the updated visit and mark completed
      const updated = {
        ...draft,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }
      const saved = updateVisit(updated)

      // guard: updateVisit can return null
      if (!saved) {
        alert('Failed to save visit.')
        setSaving(false)
        return
      }

      // persist saved into local state (safe to use `saved` now)
      setVisit(saved)
      setDraft(JSON.parse(JSON.stringify(saved)))

      // If slot present, mark slot completed
      try {
        if (saved.slotId && saved.doctorId) {
          const slotsKey = `slots_${saved.doctorId}`
          const slots = load<any[]>(slotsKey, [])
          const idx = slots.findIndex((s:any) => s.id === saved.slotId)
          if (idx !== -1) {
            slots[idx].status = 'completed'
            save(slotsKey, slots)
            window.dispatchEvent(new CustomEvent('slots-updated', { detail: { doctorId: saved.doctorId } }))
          }
        }

        // update patient's appointment record if present
        const refreshPid = saved.patientId ?? routePatientId ?? null
        if (refreshPid) {
          const PAT_KEY = 'patient_registration_patients'
          const patients = load<any[]>(PAT_KEY, [])
          const pIdx = patients.findIndex((p:any) => p.id === refreshPid)
          if (pIdx !== -1) {
            patients[pIdx].appointments = patients[pIdx].appointments || []
            const apptIdx = patients[pIdx].appointments.findIndex((a:any) => a.slotId === saved.slotId || a.id === saved.appointmentId)
            if (apptIdx !== -1) {
              patients[pIdx].appointments[apptIdx].status = 'completed'
              patients[pIdx].appointments[apptIdx].completedAt = new Date().toISOString()
            }
            save(PAT_KEY, patients)
            window.dispatchEvent(new CustomEvent('patients-updated', { detail: { patientId: refreshPid } }))
          }
          // refresh previous visits
          const pv = getVisitsForPatient(refreshPid)
          setPreviousVisits(pv.filter((p:any) => p.id !== saved.id && p.status === 'completed'))
        }
      } catch (e) {
        console.error('Error updating slot/patient during save', e)
      }

      alert('Visit saved and added to history.')
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkCompleted() {
    if (saving) return
    await handleSave()
    router.push('/doctor/dashboard')
  }

  function updateDraft(patch: any) {
    setDraft((d:any) => ({ ...d, ...patch }))
  }

  // array helpers
  function addPrescription() {
    const id = `presc_${Date.now().toString(36)}`
    const pres = draft.prescriptions || []
    updateDraft({ prescriptions: [...pres, { id, drug: '', dose: '', duration: '', notes: '' }] })
  }
  function updatePrescription(idx:number, patch:any) {
    const pres = draft.prescriptions || []
    const next = pres.map((p:any,i:number) => i === idx ? { ...p, ...patch } : p)
    updateDraft({ prescriptions: next })
  }
  function removePrescription(idx:number) {
    const pres = draft.prescriptions || []
    const next = pres.filter((_:any,i:number) => i !== idx)
    updateDraft({ prescriptions: next })
  }

  function addInvestigation() {
    const id = `inv_${Date.now().toString(36)}`
    const inv = draft.investigations || []
    updateDraft({ investigations: [...inv, { id, name: '', result: '', notes: '' }] })
  }
  function updateInvestigation(idx:number, patch:any) {
    const inv = draft.investigations || []
    const next = inv.map((p:any,i:number) => i === idx ? { ...p, ...patch } : p)
    updateDraft({ investigations: next })
  }
  function removeInvestigation(idx:number) {
    const inv = draft.investigations || []
    const next = inv.filter((_:any,i:number) => i !== idx)
    updateDraft({ investigations: next })
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <ViewModal open={!!viewModalVisit} visit={viewModalVisit} onClose={() => setViewModalVisit(null)} />

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded border">
          <div>
            <div className="text-lg font-semibold">Visit</div>
            <div className="text-sm text-slate-600">Visit ID: {visit.id} • Status: {visit.status}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/doctor/dashboard`)} className="px-3 py-1 border rounded">Back</button>

            <button
              onClick={handleSave}
              disabled={saving || visit.status === 'completed'}
              className="px-3 py-1 bg-indigo-600 text-white rounded"
            >
              {visit.status === 'completed' ? 'Completed' : (saving ? 'Saving...' : 'Save & Add to History')}
            </button>

            <button onClick={handleMarkCompleted} className="px-3 py-1 bg-emerald-600 text-white rounded">Mark Completed</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium">Patient</h4>
          {patient ? (
            <div className="mt-2">
              <div className="font-medium">{patient.name}</div>
              <div className="text-xs text-slate-500">Age: {patient.age} • ID: {patient.id}</div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Patient not found in system</div>
          )}
        </div>

        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium">Previous Visits (most recent first)</h4>
          {previousVisits.length ? (
            <ul className="mt-2 space-y-2">
              {previousVisits.map((pv:any)=>(
                <li key={pv.id} className="p-2 rounded border flex items-start justify-between">
                  <div>
                    <div className="font-medium">{pv.doctorId ? (load<any[]>('doctors',[]).find((d:any)=>d.id===pv.doctorId)?.name || pv.doctorId) : 'Unknown doctor'}</div>
                    <div className="text-xs text-slate-500">{new Date(pv.createdAt).toLocaleString()} — Status: {pv.status}</div>
                    {pv.diagnosis ? <div className="text-sm mt-2"><b>Diagnosis:</b> {pv.diagnosis}</div> : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setViewModalVisit(pv)} className="px-2 py-1 border rounded text-sm">View details</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500 mt-2">No previous visits.</div>
          )}
        </div>

        <div className="bg-white p-4 rounded border space-y-3">
          <h4 className="font-medium">Visit details</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-600">BP</label>
              <input value={draft.vitals?.bp ?? ''} onChange={e => updateDraft({ vitals: { ...draft.vitals, bp: e.target.value } })} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs text-slate-600">Pulse</label>
              <input value={draft.vitals?.pulse ?? ''} onChange={e => updateDraft({ vitals: { ...draft.vitals, pulse: e.target.value } })} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs text-slate-600">Temperature</label>
              <input value={draft.vitals?.temp ?? ''} onChange={e => updateDraft({ vitals: { ...draft.vitals, temp: e.target.value } })} className="w-full border rounded px-2 py-1" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600">Complaints</label>
            <textarea value={draft.complaints ?? ''} onChange={e => updateDraft({ complaints: e.target.value })} className="w-full border rounded px-2 py-1" rows={3}></textarea>
          </div>

          <div>
            <label className="block text-xs text-slate-600">Diagnosis</label>
            <textarea value={draft.diagnosis ?? ''} onChange={e => updateDraft({ diagnosis: e.target.value })} className="w-full border rounded px-2 py-1" rows={2}></textarea>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs text-slate-600">Prescriptions</label>
              <button onClick={addPrescription} className="px-2 py-1 text-sm border rounded">Add</button>
            </div>
            <div className="space-y-2 mt-2">
              {(draft.prescriptions || []).map((p:any, idx:number) => (
                <div key={p.id} className="p-2 border rounded space-y-1">
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Drug" value={p.drug} onChange={e => updatePrescription(idx, { drug: e.target.value })} className="border rounded px-2 py-1" />
                    <input placeholder="Dose" value={p.dose} onChange={e => updatePrescription(idx, { dose: e.target.value })} className="border rounded px-2 py-1" />
                    <input placeholder="Duration" value={p.duration} onChange={e => updatePrescription(idx, { duration: e.target.value })} className="border rounded px-2 py-1" />
                  </div>
                  <div className="flex items-center justify-between">
                    <input placeholder="Notes" value={p.notes} onChange={e => updatePrescription(idx, { notes: e.target.value })} className="border rounded px-2 py-1 w-full" />
                    <button onClick={() => removePrescription(idx)} className="px-2 py-1 border rounded ml-2 text-sm">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs text-slate-600">Investigations</label>
              <button onClick={addInvestigation} className="px-2 py-1 text-sm border rounded">Add</button>
            </div>
            <div className="space-y-2 mt-2">
              {(draft.investigations || []).map((inv:any, idx:number)=>(
                <div key={inv.id} className="p-2 border rounded space-y-1">
                  <input placeholder="Name (CT, MRI...)" value={inv.name} onChange={e => updateInvestigation(idx, { name: e.target.value })} className="w-full border rounded px-2 py-1" />
                  <input placeholder="Result" value={inv.result} onChange={e => updateInvestigation(idx, { result: e.target.value })} className="w-full border rounded px-2 py-1 mt-1" />
                  <div className="flex items-center justify-between">
                    <input placeholder="Notes" value={inv.notes} onChange={e => updateInvestigation(idx, { notes: e.target.value })} className="border rounded px-2 py-1 w-full" />
                    <button onClick={() => removeInvestigation(idx)} className="px-2 py-1 border rounded ml-2 text-sm">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600">Notes</label>
            <textarea value={draft.notes ?? ''} onChange={e => updateDraft({ notes: e.target.value })} className="w-full border rounded px-2 py-1" rows={3}></textarea>
          </div>
        </div>
      </div>
    </div>
  )
}

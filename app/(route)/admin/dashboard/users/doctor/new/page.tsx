// app/admin/dashboard/users/doctor/new/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { load, save } from '@/app/lib/storage'
import { generateId } from '@/app/lib/uid'
import DoctorTypeManager from '@/app/components/DoctorTypeManager'

export default function NewDoctorPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [types, setTypes] = useState<string[]>(() => load('doctor_types', ['General', 'Gynaecology', 'Dermatology']))

  useEffect(()=>{ if(types.length && !type) setType(types[0]) }, [types])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const id = generateId('doc_')
    const doctors = load('doctors', [])
    doctors.push({ id, name, type })
    save('doctors', doctors)
    router.push(`/admin/dashboard/users/doctor`) // back to list
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Add Doctor</h3>

      <form onSubmit={handleCreate} className="bg-white p-4 rounded border space-y-3">
        <div>
          <label className="block text-sm text-slate-600">Name</label>
          <input required value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>

        <div>
          <label className="block text-sm text-slate-600">Type</label>
          <select value={type} onChange={e=>setType(e.target.value)} className="w-full border rounded px-2 py-1">
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <DoctorTypeManager onTypesChange={(t)=>setTypes(t)} />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">Create doctor</button>
          <button type="button" onClick={()=>router.push('/admin/dashboard/users/doctor')} className="px-3 py-1 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  )
}

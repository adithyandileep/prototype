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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [types, setTypes] = useState<string[]>(() => load('doctor_types', ['General', 'Gynaecology', 'Dermatology']))

  useEffect(()=>{ if(types.length && !type) setType(types[0]) }, [types])

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return alert('Enter doctor name')
    if (!type) return alert('Select a type')
    if (!username.trim()) return alert('Enter username for doctor (unique)')
    if (!password) return alert('Enter a password for doctor')

    // ensure username unique
    const doctors = load('doctors', []) as any[]
    if (doctors.some(d => d.username === username.trim())) {
      return alert('Username already taken. Choose another username.')
    }

    const id = generateId('doc_')
    doctors.push({
      id,
      name: name.trim(),
      type,
      username: username.trim(),
      password, // NOTE: stored in plaintext here for demo only
    })
    save('doctors', doctors)

    // optionally persist doctor_types globally (you may remove if undesired)
    save('doctor_types', types)

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
          <label className="block text-sm text-slate-600">Username (doctor login)</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="unique username" />
        </div>

        <div>
          <label className="block text-sm text-slate-600">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="secure password" />
        </div>

        <div>
          <DoctorTypeManager types={types} onTypesChange={(t)=>setTypes(t)} />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">Create doctor</button>
          <button type="button" onClick={()=>router.push('/admin/dashboard/users/doctor')} className="px-3 py-1 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  )
}

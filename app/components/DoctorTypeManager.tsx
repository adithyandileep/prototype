// components/DoctorTypeManager.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { load, save } from '../lib/storage'

export default function DoctorTypeManager({ onTypesChange }: { onTypesChange?: (types: string[]) => void }) {
  const [types, setTypes] = useState<string[]>(() => load('doctor_types', ['General', 'Gynaecology', 'Dermatology']))
  const [v, setV] = useState('')

  useEffect(() => { save('doctor_types', types); onTypesChange?.(types) }, [types])

  function addType() {
    const t = v.trim()
    if (!t) return
    if (!types.includes(t)) setTypes((s) => [...s, t])
    setV('')
  }
  function removeType(idx: number) {
    const copy = [...types]; copy.splice(idx, 1); setTypes(copy)
  }

  return (
    <div className="bg-white p-3 rounded border">
      <div className="flex gap-2">
        <input value={v} onChange={(e)=>setV(e.target.value)} placeholder="Add doctor type (e.g. ENT)" className="flex-1 border rounded px-2 py-1" />
        <button onClick={addType} className="px-3 py-1 bg-indigo-600 text-white rounded">Add</button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {types.map((t, i) => (
          <div key={t} className="px-2 py-1 border rounded flex items-center gap-2 text-sm">
            <span>{t}</span>
            <button onClick={()=>removeType(i)} className="text-xs text-red-500">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

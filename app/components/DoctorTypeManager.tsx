// app/components/DoctorTypeManager.tsx
'use client'
import React, { useState } from 'react'

type Props = {
  types: string[]
  onTypesChange: (types: string[]) => void
}

/**
 * DoctorTypeManager: lightweight, local-only manager.
 * - shows current types (from parent)
 * - allows adding a new type inline (does NOT persist to localStorage)
 * - calls onTypesChange(updatedTypes) so parent can show new type in dropdown
 */
export default function DoctorTypeManager({ types, onTypesChange }: Props) {
  const [openAdd, setOpenAdd] = useState(false)
  const [newType, setNewType] = useState('')

  function handleAdd() {
    const t = newType.trim()
    if (!t) return alert('Enter a valid type')
    if (types.includes(t)) {
      setNewType('')
      setOpenAdd(false)
      return // already exists, just close
    }
    const updated = [...types, t]
    onTypesChange(updated)
    setNewType('')
    setOpenAdd(false)
  }

  function handleRemove(typeToRemove: string) {
    if (!confirm(`Remove type "${typeToRemove}" from this form's list? This does not delete existing doctors.`)) return
    const updated = types.filter(t => t !== typeToRemove)
    onTypesChange(updated)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Doctor types</div>
        <div>
          {!openAdd ? (
            <button type="button" onClick={() => setOpenAdd(true)} className="px-2 py-1 text-sm border rounded">Add</button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={newType}
                onChange={e => setNewType(e.target.value)}
                placeholder="New type (e.g. Cardiology)"
                className="border rounded px-2 py-1 text-sm"
              />
              <button type="button" onClick={handleAdd} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Save</button>
              <button type="button" onClick={() => { setOpenAdd(false); setNewType('') }} className="px-2 py-1 border rounded text-sm">Cancel</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {types && types.length ? types.map(t => (
          <div key={t} className="px-2 py-1 border rounded flex items-center gap-2 text-sm">
            <span>{t}</span>
            <button type="button" onClick={() => handleRemove(t)} className="text-xs px-1 py-0.5 border rounded">×</button>
          </div>
        )) : (
          <div className="text-xs text-slate-500">No types defined yet</div>
        )}
      </div>

      <div className="text-xs text-slate-400">
        Note: Adding here updates the dropdown in the current form only. The doctor is created when you submit the form.
      </div>
    </div>
  )
}

'use client'

import React, { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Patient = {
  id: string
  name: string
  age: number
  createdAt: string
}

const STORAGE_KEY = 'patient_registration_patients'

export default function NewPatientPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [age, setAge] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const parsedAge = Number(age)

    if (!trimmedName) {
      setError("Please enter the patient's name.")
      return
    }

    if (!age || Number.isNaN(parsedAge) || parsedAge <= 0) {
      setError('Please enter a valid age.')
      return
    }

    let existing: Patient[] = []
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          existing = JSON.parse(stored)
        }
      } catch (err) {
        console.error('Failed to read patients from localStorage', err)
      }
    }

    const newPatient: Patient = {
      id: crypto.randomUUID(),
      name: trimmedName,
      age: parsedAge,
      createdAt: new Date().toISOString(),
    }

    const updated = [newPatient, ...existing]

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (err) {
        console.error('Failed to save patient to localStorage', err)
      }
    }

    // After saving, go back to list
    router.push('/admin/dashboard/patient-registration')
  }

  return (
    <div className="space-y-4">
      {/* Header row matching style */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Add Patient</h3>
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          onClick={() => router.push('/admin/dashboard/patient-registration')}
        >
          Cancel
        </Button>
      </div>

      {/* Form card */}
      <div className="bg-white border rounded-lg p-4">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="patient-name">Patient Name</Label>
            <Input
              id="patient-name"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient-age">Age</Label>
            <Input
              id="patient-age"
              type="number"
              min={0}
              placeholder="Age in years"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" className="px-4 py-2">
              Save Patient
            </Button>
            <p className="text-xs text-slate-500">
              Data is stored locally in this browser (localStorage).
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

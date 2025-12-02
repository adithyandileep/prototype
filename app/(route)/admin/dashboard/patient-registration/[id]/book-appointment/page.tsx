"use client"

import DoctorAvailability from "@/app/components/DoctorAvailablity"
import { load } from "@/app/lib/storage"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PublicDoctorBookingPage() {
  const params = useSearchParams()
  const router = useRouter()
  const docId = params.get("docId")
  const [doctor, setDoctor] = useState<any | null>(null)
  const [slotsReloadKey, setSlotsReloadKey] = useState(0)

  useEffect(() => {
    if (!docId) return

    const docs = load("doctors", [])
    const found = docs.find((d: any) => d.id === docId) || null
    setDoctor(found)

    // Re-render availability when a slot config is updated anywhere (admin side)
    const onSlotsUpdated = (e: any) => {
      const detail = e?.detail
      if (!detail || detail.doctorId !== docId) return
      setSlotsReloadKey((k) => k + 1)
    }

    window.addEventListener("slots-updated", onSlotsUpdated)
    return () => window.removeEventListener("slots-updated", onSlotsUpdated)
  }, [docId])

  function handleBook(slot: any) {
    // Here it's from the USER side: they’re booking an appointment with this doctor.
    // Later we’ll plug in token_number + patient mapping.
    alert("Appointment booked (demo). Your slot is confirmed.")
    // Force refresh of availability to reflect the booked status
    setSlotsReloadKey((k) => k + 1)
  }

  if (!docId) {
    return <div className="p-4 bg-white rounded border">Invalid doctor id </div>
  }

  if (!doctor) {
    return <div className="p-4 bg-white rounded border">Doctor not found </div>
  }

  return (
    <div className="space-y-4">
      {/* Header card with basic doctor info + back */}
      <div className="bg-white p-4 rounded border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">Book appointment</div>
          <div className="text-sm text-slate-600">
            {doctor.name} {doctor.type ? `• ${doctor.type}` : ""}
          </div>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-3 py-1 border rounded text-sm"
        >
          Back
        </button>
      </div>

      {/* User-side booking: show only future available slots with a “Book” action */}
      <div className="bg-white p-4 rounded border">
        <div className="text-sm text-slate-600 mb-3">
          Select a suitable time slot to book your appointment with this doctor.
        </div>

        <DoctorAvailability
          key={slotsReloadKey}
          doctorId={doctor.id}
          showCreateButton={false}
          showActions={false}
          onBook={handleBook}
        />
      </div>
    </div>
  )
}

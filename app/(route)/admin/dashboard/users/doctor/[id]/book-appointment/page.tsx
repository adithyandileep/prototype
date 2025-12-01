// app/doctor/[id]/book-appointment/page.tsx  (snippet)
"use client"
import DoctorAvailability from '@/app/components/DoctorAvailablity'
import { load } from '@/app/lib/storage'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PublicDoctorBooking() {
  const params = useParams() as { id: string }
  const docId = params.id
  const [doctor, setDoctor] = useState<any>(null)
  const [slotsReloadKey, setSlotsReloadKey] = useState(0)

  useEffect(()=>{
    const docs = load('doctors', [])
    setDoctor(docs.find((d:any)=>d.id === docId) || null)
    // re-render when storage event is fired (slot creation)
    const onStorage = () => setSlotsReloadKey(k => k + 1)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [docId])

  function handleBook(slot:any) {
    // optional: show confirmation or redirect to thank-you page
    alert('Slot booked (demo). Refreshing list.')
    // since DoctorAvailability already marks slot.status = 'booked' in local state,
    // ensure storage is updated (DoctorAvailability already saves), but we may force reload here:
    setSlotsReloadKey(k => k + 1)
  }

  if (!doctor) return <div className="p-4 bg-white rounded border">Doctor not found</div>

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded border">
        <div className="text-lg font-semibold">{doctor.name}</div>
        <div className="text-sm text-slate-600">{doctor.type}</div>
      </div>

      {/* public: hide create button, show booking buttons only for future available slots */}
      <DoctorAvailability doctorId={doctor.id} showCreateButton={false} showActions={false} onBook={handleBook} />
    </div>
  )
}

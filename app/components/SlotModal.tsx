// components/SlotModal.tsx
'use client'
import React, { useMemo, useState } from 'react'
import { generateId } from '../lib/uid'

function daysInMonth(year: number, monthZeroIndexed: number) {
  return new Date(year, monthZeroIndexed + 1, 0).getDate()
}

function formatDateISO(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 Props:
 - open: boolean
 - onClose: () => void
 - onSave: (slotConfig) => void   // parent will be responsible for saving to storage/db
 - doctorId: string
*/
export default function SlotModal({ open, onClose, onSave, doctorId }: any) {
  const now = new Date()
  const todayISO = formatDateISO(now)

  const [mode, setMode] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [fromTime, setFromTime] = useState('09:00')
  const [toTime, setToTime] = useState('17:00')
  const [increment, setIncrement] = useState(30)

  // --- Daily (single date) ---
  const [selectedDate, setSelectedDate] = useState<string>(todayISO) // iso yyyy-mm-dd

  // --- Weekly ---
  // weekOffset: 0 = this week, 1 = next week, -1 = previous (we'll only allow >= 0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]) // 0..6 (0=Sun..6=Sat)

  // --- Monthly ---
  const currentYear = now.getFullYear()
  const currentMonthZero = now.getMonth()
  const daysThisMonth = daysInMonth(currentYear, currentMonthZero)
  const monthDayOptions = Array.from({ length: daysThisMonth - (now.getDate() - 1) }, (_, i) => now.getDate() + i)
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([now.getDate()])
  const [monthlyMode, setMonthlyMode] = useState<'multi' | 'range'>('multi')
  const [rangeStart, setRangeStart] = useState<number>(now.getDate())
  const [rangeEnd, setRangeEnd] = useState<number>(Math.min(now.getDate() + 6, daysThisMonth))

  // toggle helpers
  function toggleWeekDay(idx: number) {
    setSelectedWeekDays(s => s.includes(idx) ? s.filter(x => x !== idx) : [...s, idx])
  }
  function toggleMonthDay(day: number) {
    setSelectedMonthDays(s => s.includes(day) ? s.filter(x => x !== day) : [...s, day])
  }

  // compute selected calendar dates based on mode
  const selectedDates: string[] = useMemo(() => {
    const dates: string[] = []
    if (mode === 'daily') {
      if (selectedDate) dates.push(selectedDate)
      return dates
    }

    if (mode === 'weekly') {
      // compute the start of the week (Monday based) for the chosen offset
      const base = new Date()
      const currentDay = base.getDay() // 0..6 (Sun..Sat)
      // compute monday of current week: subtract ((currentDay + 6) % 7)
      const mondayOfCurrent = new Date(base)
      mondayOfCurrent.setDate(base.getDate() - ((currentDay + 6) % 7))
      mondayOfCurrent.setHours(0,0,0,0)
      // add weekOffset weeks
      mondayOfCurrent.setDate(mondayOfCurrent.getDate() + weekOffset * 7)

      selectedWeekDays.forEach(dow => {
        // dow: 0..6 (Sun..Sat). Our UI will use 0..6
        const dt = new Date(mondayOfCurrent)
        // mondayOfCurrent is Monday, its getDay() is 1; compute offset from Monday:
        // we want date for dayIndex where Monday=1..Sunday=0 -> easier: map dow: 0..6 to offset relative to Monday:
        // If dow is 0 (Sun), its offset from Monday is +6
        const offsetFromMonday = ((dow + 6) % 7) // maps 0(Sun)->6,1(Mon)->0,...6(Sat)->5
        dt.setDate(dt.getDate() + offsetFromMonday)
        if (dt >= new Date(formatDateISO(now) + 'T00:00:00')) {
          dates.push(formatDateISO(dt))
        }
      })

      // dedupe and sort
      return Array.from(new Set(dates)).sort()
    }

    if (mode === 'monthly') {
      // compute dates in current month according to multi or range; only allow >= today
      if (monthlyMode === 'multi') {
        selectedMonthDays.forEach(d => {
          if (d >= now.getDate() && d <= daysThisMonth) {
            const dt = new Date(currentYear, currentMonthZero, d)
            dates.push(formatDateISO(dt))
          }
        })
      } else {
        const start = Math.max(rangeStart, now.getDate())
        const end = Math.min(rangeEnd, daysThisMonth)
        for (let d = start; d <= end; d++) {
          const dt = new Date(currentYear, currentMonthZero, d)
          dates.push(formatDateISO(dt))
        }
      }
      return Array.from(new Set(dates)).sort()
    }

    return dates
  }, [mode, selectedDate, weekOffset, selectedWeekDays, monthlyMode, selectedMonthDays, rangeStart, rangeEnd, now])

  // buildSlots: generate slots only for selectedDates
  function buildSlots() {
    const slots: any[] = []
    const [fh, fm] = fromTime.split(':').map(Number)
    const [th, tm] = toTime.split(':').map(Number)

    selectedDates.forEach(dateISO => {
      const day = new Date(dateISO + 'T00:00:00')
      const from = new Date(day); from.setHours(fh, fm, 0, 0)
      const to = new Date(day); to.setHours(th, tm, 0, 0)
      if (to <= from) return

      let cur = new Date(from)
      while (cur < to) {
        const end = new Date(cur); end.setMinutes(end.getMinutes() + increment)
        if (end > to) break
        slots.push({
          id: generateId('slot_'),
          doctorId,
          start: cur.toISOString(),
          end: end.toISOString(),
          status: 'available'
        })
        cur = new Date(end)
      }
    })

    return slots
  }

  function handleSave() {
    // parent will persist; we pass cfg including selectedDates for audit
    const cfg = {
      id: generateId('cfg_'),
      mode,
      fromTime,
      toTime,
      increment,
      selectedDates,
      selectedWeekDays,
      selectedMonthDays,
      monthlyMode,
      rangeStart,
      rangeEnd,
      slots: buildSlots(),
    }
    onSave(cfg)
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded max-w-2xl w-full p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold">Create slots</h4>
          <button onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setMode('daily')} className={`px-3 py-1 rounded ${mode === 'daily' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>Daily</button>
            <button onClick={() => setMode('weekly')} className={`px-3 py-1 rounded ${mode === 'weekly' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>Weekly</button>
            <button onClick={() => setMode('monthly')} className={`px-3 py-1 rounded ${mode === 'monthly' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>Monthly</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600">From</label>
              <input type="time" value={fromTime} onChange={e => setFromTime(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs text-slate-600">To</label>
              <input type="time" value={toTime} onChange={e => setToTime(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs text-slate-600">Increment (minutes)</label>
              <input type="number" min={5} step={5} value={increment} onChange={e => setIncrement(Number(e.target.value))} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="text-xs text-slate-500">
              Slots will be generated only for the selected date(s).
            </div>
          </div>

          {/* DAILY */}
          {mode === 'daily' && (
            <div>
              <label className="block text-sm">Pick date (today or future)</label>
              <input type="date" min={todayISO} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="mt-2 border rounded px-2 py-1" />
            </div>
          )}

          {/* WEEKLY */}
          {mode === 'weekly' && (
            <div>
              <label className="block text-sm">Choose week and days (dates shown for the selected week)</label>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} className="px-2 py-1 border rounded">◀</button>
                <div className="text-sm">Week: {weekOffset === 0 ? 'This week' : `+${weekOffset} week(s)`}</div>
                <button onClick={() => setWeekOffset(weekOffset + 1)} className="px-2 py-1 border rounded">▶</button>
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2">
                {(() => {
                  // build monday of selected week
                  const base = new Date()
                  const currentDay = base.getDay()
                  const monday = new Date(base)
                  monday.setDate(base.getDate() - ((currentDay + 6) % 7) + (weekOffset * 7))
                  monday.setHours(0,0,0,0)
                  const items = []
                  for (let i = 0; i < 7; i++) {
                    const dt = new Date(monday); dt.setDate(monday.getDate() + i)
                    const iso = formatDateISO(dt)
                    const label = `${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]} ${dt.getDate()}`
                    const isPast = dt < new Date(formatDateISO(now) + 'T00:00:00')
                    const dowIdx = (dt.getDay() + 0) % 7 // 0..6 (Sun..Sat)
                    const sel = selectedWeekDays.includes(dowIdx)
                    items.push(
                      <button key={iso} disabled={isPast} onClick={() => toggleWeekDay(dowIdx)}
                        className={`px-2 py-1 text-sm rounded ${sel ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'} ${isPast ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {label}
                      </button>
                    )
                  }
                  return items
                })()}
              </div>
            </div>
          )}

          {/* MONTHLY */}
          {mode === 'monthly' && (
            <div>
              <label className="block text-sm">Monthly selection (current month only) — choose multi or range</label>

              <div className="mt-2 flex gap-2">
                <button onClick={() => setMonthlyMode('multi')} className={`px-2 py-1 rounded ${monthlyMode === 'multi' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>Multi</button>
                <button onClick={() => setMonthlyMode('range')} className={`px-2 py-1 rounded ${monthlyMode === 'range' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>Range</button>
              </div>

              {monthlyMode === 'multi' && (
                <div className="mt-2 grid grid-cols-7 gap-1 max-h-44 overflow-auto">
                  {monthDayOptions.map(d => {
                    const sel = selectedMonthDays.includes(d)
                    return <button key={d} onClick={() => toggleMonthDay(d)} className={`px-2 py-1 text-sm rounded ${sel ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>{d}</button>
                  })}
                </div>
              )}

              {monthlyMode === 'range' && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs">Start (≥ today)</label>
                    <select value={rangeStart} onChange={e => setRangeStart(Number(e.target.value))} className="w-full border rounded px-2 py-1">
                      {monthDayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs">End</label>
                    <select value={rangeEnd} onChange={e => setRangeEnd(Number(e.target.value))} className="w-full border rounded px-2 py-1">
                      {monthDayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={handleSave} className="px-3 py-1 bg-indigo-600 text-white rounded">Save slots</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// app/lib/token.ts
export function todayKeyDate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}` // YYYYMMDD
}

/**
 * Generates a token string for a doctor for today, increments sequence.
 * Format: TK001, TK002, ...
 * Stores sequence in localStorage key: token_seq_{doctorId}_{YYYYMMDD}
 */
export function generateTokenForDoctor(doctorId: string) {
  if (typeof window === 'undefined') return null
  const day = todayKeyDate()
  const key = `token_seq_${doctorId}_${day}`
  const raw = localStorage.getItem(key)
  let seq = raw ? parseInt(raw, 10) : 0
  seq = seq + 1
  localStorage.setItem(key, String(seq))
  const token = `TK${String(seq).padStart(3, '0')}`
  return token
}

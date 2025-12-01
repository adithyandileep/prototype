// lib/storage.ts
// small helpers for storing/retrieving data in localStorage (demo)
export function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
export function save(key: string, data: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}
    
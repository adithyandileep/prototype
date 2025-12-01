// lib/uid.ts
export function generateId(prefix = '') {
  // simple unique id: prefix + timestamp + random
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`
}

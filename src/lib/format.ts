import { sha256 } from './sha256'

const clpFmt = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export const clp = (n: number) => clpFmt.format(Math.round(n))

export const dateShort = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(
    new Date(iso),
  )

export const dateLong = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))

export const dateFull = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))

export const timeShort = (iso: string) =>
  new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))

export const dateTime = (iso: string) => `${dateFull(iso)} · ${timeShort(iso)}`

export const minutesSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))

export const elapsed = (iso: string) => {
  const m = minutesSince(iso)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r === 0 ? `${h} h` : `${h} h ${r} min`
}

export const age = (nacimiento: string) => {
  const b = new Date(nacimiento)
  const now = new Date()
  let a = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--
  return a
}

export const initials = (nombre: string) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

export const daysUntil = (iso: string) => {
  const target = new Date(iso)
  target.setHours(23, 59, 59, 999)
  return Math.ceil((target.getTime() - Date.now()) / 86400000)
}

export const isoDay = (d = new Date()) => {
  const x = new Date(d)
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 10)
}

export const isToday = (iso: string) => isoDay(new Date(iso)) === isoDay()

export const hashText = (text: string) => sha256(text).toUpperCase()

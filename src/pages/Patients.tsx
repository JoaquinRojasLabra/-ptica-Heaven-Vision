import { motion } from 'framer-motion'
import { MagnifyingGlass, Plus, UserPlus, UsersThree } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageTitle,
  Select,
  cx,
} from '../components/UI'
import { age, clp, dateShort } from '../lib/format'
import { useStore } from '../lib/store'
import type { Patient } from '../lib/types'

type Filter = 'todos' | 'saldo' | 'convenio' | 'nuevo'

export default function Patients() {
  const { patients, orders, addPatient } = useStore()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [filter, setFilter] = useState<Filter>('todos')
  const [open, setOpen] = useState(params.get('nuevo') === '1')

  useEffect(() => {
    setQuery(params.get('q') ?? '')
  }, [params])

  useEffect(() => {
    if (params.get('nuevo') === '1') setOpen(true)
  }, [params])

  const closeModal = () => {
    setOpen(false)
    if (params.get('nuevo')) {
      const next = new URLSearchParams(params)
      next.delete('nuevo')
      setParams(next, { replace: true })
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return patients
      .map((p) => {
        const patientOrders = orders.filter((o) => o.patientId === p.id)
        const saldo = patientOrders.reduce((a, o) => a + Math.max(0, o.total - o.abono), 0)
        const last = patientOrders
          .map((o) => o.createdAt)
          .sort()
          .at(-1)
        return { patient: p, saldo, last, count: patientOrders.length }
      })
      .filter(({ patient, saldo }) => {
        if (filter === 'saldo' && saldo <= 0) return false
        if (filter === 'convenio' && !patient.convenio) return false
        if (filter === 'nuevo' && patient.createdAt.slice(0, 4) < '2026') return false
        if (!q) return true
        return (
          patient.nombre.toLowerCase().includes(q) ||
          patient.rut.toLowerCase().includes(q) ||
          patient.telefono.includes(q)
        )
      })
      .sort((a, b) => a.patient.nombre.localeCompare(b.patient.nombre))
  }, [patients, orders, query, filter])

  const filters: Array<{ key: Filter; label: string }> = [
    { key: 'todos', label: `Todos · ${patients.length}` },
    { key: 'saldo', label: 'Con saldo' },
    { key: 'convenio', label: 'Con convenio' },
    { key: 'nuevo', label: 'Ingresos 2026' },
  ]

  return (
    <div>
      <PageTitle
        title="Pacientes"
        subtitle="Una ficha por persona. Recetas, pedidos y pagos cuelgan del mismo registro."
        action={
          <Button variant="brand" onClick={() => setOpen(true)}>
            <UserPlus size={17} weight="bold" />
            Nuevo paciente
          </Button>
        }
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, RUT o teléfono…"
            aria-label="Buscar paciente"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cx(
                'h-8 rounded-full px-3 text-[11px] font-bold transition-colors',
                filter === f.key
                  ? 'bg-ink text-white'
                  : 'border border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<UsersThree size={28} />}
            title="Sin resultados"
            description="Prueba con otro nombre o crea una ficha nueva."
            action={
              <Button variant="outline" onClick={() => setOpen(true)}>
                <Plus size={16} />
                Nuevo paciente
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <Card className="mt-4 hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    <th className="px-5 py-3">Paciente</th>
                    <th className="px-3 py-3">Contacto</th>
                    <th className="px-3 py-3">Convenio</th>
                    <th className="px-3 py-3">Última compra</th>
                    <th className="px-3 py-3 text-right">Saldo</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map(({ patient, saldo, last, count }, index) => (
                    <motion.tr
                      key={patient.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.02, 0.2) }}
                      className="group transition-colors hover:bg-paper/60"
                    >
                      <td className="px-5 py-3">
                        <Link to={`/pacientes/${patient.id}`} className="flex items-center gap-3">
                          <Avatar name={patient.nombre} />
                          <span>
                            <span className="block text-[13px] font-bold text-ink group-hover:text-brand">
                              {patient.nombre}
                            </span>
                            <span className="tnum block text-[11px] text-muted">
                              {patient.rut} · {age(patient.nacimiento)} años
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block text-[12px] text-ink-soft">{patient.telefono}</span>
                        <span className="block max-w-[180px] truncate text-[11px] text-muted">
                          {patient.email}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {patient.convenio ? (
                          <Badge tone="info">{patient.convenio}</Badge>
                        ) : (
                          <span className="text-[12px] text-muted">Particular</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="tnum text-[12px] text-ink-soft">
                          {last ? dateShort(last) : '—'}
                        </span>
                        <span className="block text-[11px] text-muted">{count} {count === 1 ? 'pedido' : 'pedidos'}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={cx(
                            'tnum text-[12px] font-bold',
                            saldo > 0 ? 'text-danger' : 'text-muted',
                          )}
                        >
                          {saldo > 0 ? clp(saldo) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/pacientes/${patient.id}`}
                          className="text-[11px] font-bold text-brand hover:underline"
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-4 grid gap-2.5 md:hidden">
            {rows.map(({ patient, saldo }) => (
              <Link key={patient.id} to={`/pacientes/${patient.id}`}>
                <Card className="flex items-center gap-3 p-4">
                  <Avatar name={patient.nombre} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink">{patient.nombre}</p>
                    <p className="tnum truncate text-[11px] text-muted">
                      {patient.rut} · {age(patient.nacimiento)} años
                    </p>
                  </div>
                  {saldo > 0 ? (
                    <Badge tone="danger">{clp(saldo)}</Badge>
                  ) : (
                    <Badge tone="outline">Al día</Badge>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      <NewPatientModal
        open={open}
        onClose={closeModal}
        onCreate={(data) => {
          addPatient(data)
          closeModal()
        }}
      />
    </div>
  )
}

function NewPatientModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (data: Omit<Patient, 'id' | 'createdAt'>) => void
}) {
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    telefono: '',
    email: '',
    nacimiento: '',
    direccion: '',
    convenio: '',
    notas: '',
    consentimiento: true,
  })
  const [error, setError] = useState('')

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.rut.trim()) {
      setError('Nombre y RUT son obligatorios.')
      return
    }
    setError('')
    onCreate({
      nombre: form.nombre.trim(),
      rut: form.rut.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      nacimiento: form.nacimiento || '1990-01-01',
      direccion: form.direccion.trim(),
      convenio: form.convenio.trim() || null,
      notas: form.notas.trim(),
      consentimiento: form.consentimiento,
    })
    setForm({
      nombre: '',
      rut: '',
      telefono: '',
      email: '',
      nacimiento: '',
      direccion: '',
      convenio: '',
      notas: '',
      consentimiento: true,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo paciente"
      description="Estos datos se reutilizan en la receta, el pedido y la boleta. No se vuelven a pedir."
      width="max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre completo" required>
            <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="María José Fuentes" autoFocus />
          </Field>
          <Field label="RUT" required>
            <Input value={form.rut} onChange={(e) => set('rut', e.target.value)} placeholder="12.345.678-9" />
          </Field>
          <Field label="Teléfono">
            <Input type="tel" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+56 9 8765 4321" />
          </Field>
          <Field label="Correo">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@ejemplo.cl" />
          </Field>
          <Field label="Fecha de nacimiento">
            <Input type="date" value={form.nacimiento} onChange={(e) => set('nacimiento', e.target.value)} />
          </Field>
          <Field label="Convenio" hint="opcional">
            <Select value={form.convenio} onChange={(e) => set('convenio', e.target.value)}>
              <option value="">Particular</option>
              <option>Convenio Municipal</option>
              <option>Planilla Colegio Médico</option>
              <option>Convenio Empresa Andes</option>
            </Select>
          </Field>
          <Field label="Dirección" className="sm:col-span-2">
            <Input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Av. Providencia 1234, Ñuñoa" />
          </Field>
          <Field label="Notas" hint="opcional" className="sm:col-span-2">
            <Input value={form.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Preferencias, alergias, observaciones…" />
          </Field>
        </div>

        <label className="flex items-start gap-2.5 rounded-[10px] border border-line bg-paper/70 p-3">
          <input
            type="checkbox"
            checked={form.consentimiento}
            onChange={(e) => set('consentimiento', e.target.checked)}
            className="mt-0.5 size-4 accent-[#B4471F]"
          />
          <span className="text-[11px] leading-relaxed text-ink-soft">
            El paciente autoriza el tratamiento de sus datos clínicos y el uso de su teléfono para avisos
            de retiro. Queda registrado con fecha, usuario y hash.
          </span>
        </label>

        {error && (
          <p role="alert" className="text-[12px] font-bold text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand">
            <UserPlus size={16} weight="bold" />
            Crear ficha
          </Button>
        </div>
      </form>
    </Modal>
  )
}

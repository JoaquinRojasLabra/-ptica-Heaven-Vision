import { useMemo, useState } from 'react'
import {
  CalendarPlus,
  Clock,
  Stethoscope,
  XCircle,
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
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
  Stat,
  Textarea,
  cx,
} from '../components/UI'
import { isToday, timeShort } from '../lib/format'
import { useStore } from '../lib/store'
import type { Appointment, AppointmentStatus } from '../lib/types'

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
}

const statusTone = (estado: AppointmentStatus) =>
  estado === 'atendida'
    ? 'pine'
    : estado === 'confirmada'
      ? 'brand'
      : estado === 'cancelada'
        ? 'danger'
        : 'neutral'

const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (isToday(iso)) return 'Hoy'
  if (d.toDateString() === tomorrow.toDateString()) return 'Mañana'
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Agenda() {
  const { role, appointments, patient, addAppointment, setAppointmentStatus, addWaiting } =
    useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const canEdit = role === 'admin' || role === 'vendedora' || role === 'tecnologo'

  const sorted = useMemo(
    () =>
      [...appointments]
        .filter((a) => a.estado !== 'cancelada')
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    [appointments],
  )

  const groups = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    sorted.forEach((a) => {
      const key = dayLabel(a.fecha)
      map.set(key, [...(map.get(key) ?? []), a])
    })
    return [...map.entries()]
  }, [sorted])

  const todayCount = appointments.filter((a) => isToday(a.fecha) && a.estado !== 'cancelada').length
  const weekCount = appointments.filter((a) => {
    const d = new Date(a.fecha).getTime()
    return d >= Date.now() - 86400000 && d <= Date.now() + 7 * 86400000 && a.estado !== 'cancelada'
  }).length
  const confirmed = appointments.filter((a) => a.estado === 'confirmada').length

  const attend = (a: Appointment) => {
    setAppointmentStatus(a.id, 'atendida')
    const p = patient(a.patientId)
    if (p) {
      addWaiting(a.patientId, a.motivo)
      navigate('/sala')
    }
  }

  return (
    <div>
      <PageTitle
        title="Agenda"
        subtitle="Las horas agendadas de la semana, con el paciente y el motivo de la visita."
        action={
          canEdit ? (
            <Button onClick={() => setOpen(true)}>
              <CalendarPlus size={17} weight="bold" />
              Agendar cita
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Citas de hoy" value={todayCount} hint="Incluye confirmadas y por confirmar" />
        <Stat label="Próximos 7 días" value={weekCount} tone="brand" />
        <Stat label="Confirmadas" value={confirmed} tone="pine" hint="El paciente ya avisó que viene" />
        <Stat
          label="Por confirmar"
          value={appointments.filter((a) => a.estado === 'agendada').length}
          tone="amber"
        />
      </div>

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<CalendarPlus size={22} weight="duotone" />}
            title="No hay citas agendadas"
            description="Agenda la primera hora para que el tecnólogo la vea en su día."
            action={canEdit ? <Button onClick={() => setOpen(true)}>Agendar cita</Button> : undefined}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {groups.map(([label, items]) => (
            <Card key={label} className="overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3.5">
                <h2 className="font-display text-[16px] capitalize text-ink">{label}</h2>
                <span className="text-[11.5px] font-medium text-muted">
                  {items.length} {items.length === 1 ? 'cita' : 'citas'}
                </span>
              </div>
              <ul className="divide-y divide-line">
                {items.map((a) => {
                  const p = patient(a.patientId)
                  const past = new Date(a.fecha).getTime() < Date.now()
                  return (
                    <li
                      key={a.id}
                      className={cx(
                        'flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center',
                        a.estado === 'atendida' && 'bg-surface-2/60',
                      )}
                    >
                      <div className="flex w-full items-center gap-3 sm:w-auto">
                        <div className="w-14 shrink-0">
                          <p className="tnum text-[14px] font-semibold text-ink">
                            {timeShort(a.fecha)}
                          </p>
                          <p className="text-[10.5px] font-medium text-muted">
                            {new Date(a.fecha).toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </p>
                        </div>
                        <Avatar name={p?.nombre ?? '?'} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold text-ink">
                            {p?.nombre ?? 'Paciente'}
                          </p>
                          <p className="truncate text-[11.5px] text-muted">{a.motivo}</p>
                        </div>
                        <Badge tone={statusTone(a.estado)}>{STATUS_LABEL[a.estado]}</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                        {a.notas && (
                          <span className="mr-1 hidden max-w-[240px] truncate text-[11px] text-muted lg:block">
                            {a.notas}
                          </span>
                        )}
                        {a.estado === 'agendada' && canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAppointmentStatus(a.id, 'confirmada')}
                          >
                            Confirmar
                          </Button>
                        )}
                        {(a.estado === 'agendada' || a.estado === 'confirmada') && canEdit && (
                          <>
                            <Button
                              size="sm"
                              variant="soft"
                              onClick={() => attend(a)}
                              title="Pasar a la sala de espera"
                            >
                              <Stethoscope size={14} />
                              Atender
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="px-2"
                              onClick={() => setAppointmentStatus(a.id, 'cancelada')}
                              aria-label="Cancelar cita"
                            >
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}

                        {past && a.estado === 'agendada' && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-amber">
                            <Clock size={13} />
                            Sin confirmar
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <NewAppointment
        open={open}
        onClose={() => setOpen(false)}
        onSave={(data) => {
          addAppointment(data)
          setOpen(false)
        }}
      />
    </div>
  )
}

function NewAppointment({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: { patientId: string; fecha: string; motivo: string; notas: string }) => void
}) {
  const { patients } = useStore()
  const [patientId, setPatientId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('10:00')
  const [motivo, setMotivo] = useState('Examen visual')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId) {
      setError('Selecciona un paciente.')
      return
    }
    setError('')
    onSave({
      patientId,
      fecha: new Date(`${date}T${time}:00`).toISOString(),
      motivo,
      notas,
    })
    setPatientId('')
    setNotas('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agendar cita"
      description="Quedará visible para el tecnólogo y para el mostrador."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Paciente" required error={error}>
          <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Buscar paciente…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · {p.rut}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Día" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Hora" required>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </Field>
        </div>
        <Field label="Motivo">
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Field>
        <Field label="Notas" hint="opcional">
          <Textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: llamar antes para confirmar"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            <CalendarPlus size={16} weight="bold" />
            Agendar
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import {
  Armchair,
  CheckCircle,
  Clock,
  Plus,
  Stethoscope,
  UserPlus,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageTitle,
  Select,
  cx,
} from '../components/UI'
import { elapsed, minutesSince, timeShort } from '../lib/format'
import { useStore } from '../lib/store'
import { ROLE_LABEL, type WaitingEntry } from '../lib/types'

function waitTone(minutes: number) {
  if (minutes >= 20) return 'danger' as const
  if (minutes >= 10) return 'amber' as const
  return 'pine' as const
}

export default function Waiting() {
  const {
    role,
    waiting,
    patient,
    patients,
    setWaitingStatus,
    addWaiting,
    logAccess,
  } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(params.get('nuevo') === '1')
  const [tick, setTick] = useState(0)

  const closeModal = () => {
    setOpen(false)
    if (params.get('nuevo')) setParams({}, { replace: true })
  }

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000)
    return () => window.clearInterval(id)
  }, [])

  const columns = useMemo(
    () => [
      {
        key: 'esperando' as const,
        title: 'Esperando',
        hint: 'Pacientes que ya llegaron',
        items: waiting
          .filter((w) => w.estado === 'esperando')
          .sort((a, b) => new Date(a.hora).getTime() - new Date(b.hora).getTime()),
      },
      {
        key: 'en_consulta' as const,
        title: 'En consulta',
        hint: 'Con el tecnólogo ahora',
        items: waiting.filter((w) => w.estado === 'en_consulta'),
      },
      {
        key: 'atendido' as const,
        title: 'Atendidos hoy',
        hint: 'Últimas atenciones',
        items: waiting.filter((w) => w.estado === 'atendido').slice(-4).reverse(),
      },
    ],
    [waiting],
  )

  const canAttend = role === 'tecnologo' || role === 'admin'
  const canRegister = role !== 'montajista'

  const attend = (w: WaitingEntry) => {
    setWaitingStatus(w.id, 'en_consulta')
    logAccess(w.patientId)
    navigate(`/consulta/${w.patientId}`)
  }

  return (
    <div data-tick={tick}>
      <PageTitle
        title="Sala de espera"
        subtitle="Pantalla compartida entre mostrador y taller. Se actualiza sola."
        action={
          canRegister ? (
            <Button variant="brand" onClick={() => setOpen(true)}>
              <UserPlus size={17} weight="bold" />
              Registrar llegada
            </Button>
          ) : undefined
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[12px] border border-line bg-surface/70 px-4 py-2.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-pine opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-pine" />
        </span>
        <p className="text-[12px] font-semibold text-ink-soft">
          {waiting.filter((w) => w.estado === 'esperando').length} esperando ·{' '}
          {waiting.filter((w) => w.estado === 'en_consulta').length} en consulta
        </p>
        <span className="ml-auto text-[11px] font-medium text-muted">
          Vista: {ROLE_LABEL[role]} · actualiza cada 30 s
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {columns.map((col) => (
          <section key={col.key} className="flex flex-col">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <div>
                <h2 className="font-display text-[22px] leading-none text-ink">{col.title}</h2>
                <p className="mt-1 text-[11px] text-muted">{col.hint}</p>
              </div>
              <span className="tnum grid size-7 place-items-center rounded-full bg-ink/[0.06] text-[11px] font-bold text-ink-soft">
                {col.items.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {col.items.map((w) => {
                  const p = patient(w.patientId)
                  const mins = minutesSince(w.hora)
                  return (
                    <motion.article
                      key={w.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className={cx(
                        'rounded-[14px] border bg-surface p-4',
                        col.key === 'en_consulta'
                          ? 'border-pine/30 shadow-[0_0_0_3px_rgba(23,66,58,0.06)]'
                          : 'border-line',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={p?.nombre ?? '?'} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold text-ink">{p?.nombre}</p>
                          <p className="truncate text-[11px] text-muted">{p?.rut}</p>
                        </div>
                        {col.key !== 'atendido' && (
                          <Badge tone={waitTone(mins)} dot>
                            {elapsed(w.hora)}
                          </Badge>
                        )}
                      </div>

                      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-soft">
                        <Armchair size={14} className="text-muted" />
                        {w.motivo}
                      </p>

                      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                          <Clock size={12} />
                          Llegó {timeShort(w.hora)}
                        </span>
                        <div className="ml-auto flex gap-1.5">
                          {col.key === 'esperando' && canAttend && (
                            <Button size="sm" variant="soft" onClick={() => attend(w)}>
                              <Stethoscope size={14} />
                              Atender
                            </Button>
                          )}
                          {col.key === 'esperando' && !canAttend && (
                            <Link to={`/pacientes/${w.patientId}`}>
                              <Button size="sm" variant="ghost">
                                Ver ficha
                              </Button>
                            </Link>
                          )}
                          {col.key === 'en_consulta' && (
                            <>
                              <Link to={`/consulta/${w.patientId}`}>
                                <Button size="sm" variant="ghost">
                                  Consulta
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setWaitingStatus(w.id, 'atendido')}
                              >
                                <CheckCircle size={14} />
                                Finalizar
                              </Button>
                            </>
                          )}
                          {col.key === 'atendido' && (
                            <Link to={`/pacientes/${w.patientId}`}>
                              <Button size="sm" variant="ghost">
                                Ver ficha
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  )
                })}
              </AnimatePresence>

              {col.items.length === 0 && (
                <div className="rounded-[14px] border border-dashed border-line-strong bg-surface/50 px-4 py-8 text-center">
                  <p className="text-[12.5px] font-medium text-muted">
                    {col.key === 'esperando'
                      ? 'No hay nadie esperando'
                      : col.key === 'en_consulta'
                        ? 'Nadie en consulta ahora'
                        : 'Todavía no hay atenciones hoy'}
                  </p>
                  {col.key === 'esperando' && canRegister && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1.5"
                      onClick={() => setOpen(true)}
                    >
                      Registrar llegada
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <RegisterModal
        open={open}
        onClose={closeModal}
        patients={patients}
        waiting={waiting}
        onRegister={(patientId, motivo) => {
          addWaiting(patientId, motivo)
          closeModal()
        }}
      />
    </div>
  )
}

function RegisterModal({
  open,
  onClose,
  patients,
  waiting,
  onRegister,
}: {
  open: boolean
  onClose: () => void
  patients: ReturnType<typeof useStore>['patients']
  waiting: WaitingEntry[]
  onRegister: (patientId: string, motivo: string) => void
}) {
  const [patientId, setPatientId] = useState('')
  const [motivo, setMotivo] = useState('Examen visual')
  const [error, setError] = useState('')

  const available = patients.filter(
    (p) => !waiting.some((w) => w.patientId === p.id && w.estado !== 'atendido'),
  )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId) {
      setError('Selecciona un paciente.')
      return
    }
    setError('')
    onRegister(patientId, motivo)
    setPatientId('')
    setMotivo('Examen visual')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar llegada"
      description="El paciente aparecerá de inmediato en la pantalla del tecnólogo."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Paciente" required error={error}>
          <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Buscar paciente…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · {p.rut}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Motivo de la visita">
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Examen visual" />
        </Field>
        <div className="rounded-[10px] bg-paper/80 p-3 text-[11px] leading-relaxed text-muted">
          Si el paciente no existe, créalo primero en{' '}
          <Link to="/pacientes?nuevo=1" className="font-bold text-brand hover:underline" onClick={onClose}>
            Pacientes → Nuevo paciente
          </Link>
          . Los datos se ingresan una sola vez.
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand">
            <Plus size={16} weight="bold" />
            Agregar a la sala
          </Button>
        </div>
      </form>
    </Modal>
  )
}

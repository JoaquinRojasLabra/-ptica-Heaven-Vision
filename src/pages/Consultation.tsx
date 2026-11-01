import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ClipboardText,
  Eye,
  Info,
  Sparkle,
  Stethoscope,
} from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageTitle,
  Textarea,
  cx,
} from '../components/UI'
import { age, dateFull } from '../lib/format'
import { useStore } from '../lib/store'
import type { Eye as EyeType, Prescription } from '../lib/types'

const emptyEye: EyeType = { esfera: '', cilindro: '', eje: '', adicion: '0.00', dp: '' }

export default function Consultation() {
  const { id = '' } = useParams()
  const { role, patient, prescriptions, addPrescription } = useStore()
  const navigate = useNavigate()

  const p = patient(id)
  const previous = useMemo(
    () =>
      prescriptions
        .filter((r) => r.patientId === id)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0],
    [prescriptions, id],
  )

  const [od, setOd] = useState<EyeType>(previous?.od ?? emptyEye)
  const [oi, setOi] = useState<EyeType>(previous?.oi ?? emptyEye)
  const [agudezaOD, setAgudezaOD] = useState(previous?.agudezaOD ?? '1.0')
  const [agudezaOI, setAgudezaOI] = useState(previous?.agudezaOI ?? '1.0')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  if (!p) return <Navigate to="/pacientes" replace />

  const readOnly = role !== 'tecnologo'
  const canSell = role === 'admin' || role === 'vendedora'

  const setEye = (
    setter: React.Dispatch<React.SetStateAction<EyeType>>,
    key: keyof EyeType,
    value: string,
  ) => setter((prev) => ({ ...prev, [key]: value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (readOnly) return
    if (!od.esfera.trim() || !oi.esfera.trim()) {
      setError('La esfera de ambos ojos es obligatoria.')
      return
    }
    setError('')
    const newId = addPrescription(p.id, {
      od,
      oi,
      agudezaOD,
      agudezaOI,
      observaciones: observaciones.trim(),
    })
    setSaved(true)
    window.setTimeout(() => {
      if (canSell) navigate(`/cotizacion/${p.id}?receta=${newId}`)
      else navigate(`/pacientes/${p.id}`)
    }, 700)
  }

  const loadPrevious = () => {
    if (!previous) return
    setOd(previous.od)
    setOi(previous.oi)
    setAgudezaOD(previous.agudezaOD)
    setAgudezaOI(previous.agudezaOI)
    setObservaciones(previous.observaciones)
  }

  return (
    <div>
      <Link
        to={`/pacientes/${p.id}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> Ficha de {p.nombre.split(' ')[0]}
      </Link>

      <div className="mt-3">
        <PageTitle
          title="Examen visual"
          subtitle={`${p.nombre} · ${p.rut} · ${age(p.nacimiento)} años`}
          action={
            previous ? (
              <Badge tone="outline">Última receta: {dateFull(previous.fecha)}</Badge>
            ) : (
              <Badge tone="copper">Primera consulta</Badge>
            )
          }
        />
      </div>

      {readOnly && (
        <div className="mt-4 flex items-start gap-2.5 rounded-[12px] border border-amber/30 bg-amber-soft/50 p-3.5">
          <Info size={17} className="mt-0.5 shrink-0 text-amber" />
          <p className="text-[12px] leading-relaxed text-ink-soft">
            <strong className="font-bold">Vista de solo lectura.</strong> La sección clínica solo la
            modifica el tecnólogo. La administradora puede visualizarla para fiscalización, pero no
            editarla.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-xl text-ink">
                <Eye size={19} className="text-copper" />
                Refracción
              </h2>
              {previous && !readOnly && (
                <Button type="button" size="sm" variant="ghost" onClick={loadPrevious}>
                  <Sparkle size={14} />
                  Usar receta anterior
                </Button>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <EyeFields
                label="Ojo derecho · OD"
                eye={od}
                disabled={readOnly}
                onChange={(key, value) => setEye(setOd, key, value)}
              />
              <EyeFields
                label="Ojo izquierdo · OI"
                eye={oi}
                disabled={readOnly}
                onChange={(key, value) => setEye(setOi, key, value)}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Agudeza visual OD" hint="decimal">
                <Input
                  value={agudezaOD}
                  onChange={(e) => setAgudezaOD(e.target.value)}
                  disabled={readOnly}
                  placeholder="1.0"
                />
              </Field>
              <Field label="Agudeza visual OI" hint="decimal">
                <Input
                  value={agudezaOI}
                  onChange={(e) => setAgudezaOI(e.target.value)}
                  disabled={readOnly}
                  placeholder="1.0"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <Stethoscope size={19} className="text-copper" />
              Observaciones clínicas
            </h2>
            <Field label="Notas del examen" hint="opcional" className="mt-3">
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={readOnly}
                placeholder="Hallazgos, recomendaciones, control sugerido…"
              />
            </Field>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
              <ClipboardText size={13} />
              La receta queda firmada con usuario, fecha y hash. No se puede borrar.
            </p>
          </Card>

          {error && (
            <p role="alert" className="rounded-[10px] bg-danger-soft px-3 py-2 text-[12px] font-bold text-danger">
              {error}
            </p>
          )}

          {!readOnly && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link to={`/pacientes/${p.id}`}>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" variant="copper" disabled={saved}>
                {saved ? 'Receta guardada ✓' : canSell ? 'Guardar y cotizar' : 'Emitir receta'}
                {!saved && <ArrowRight size={16} />}
              </Button>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <PrescriptionPreview
            patientName={p.nombre}
            od={od}
            oi={oi}
            agudezaOD={agudezaOD}
            agudezaOI={agudezaOI}
            previous={previous}
          />
        </div>
      </form>
    </div>
  )
}

function EyeFields({
  label,
  eye,
  disabled,
  onChange,
}: {
  label: string
  eye: EyeType
  disabled: boolean
  onChange: (key: keyof EyeType, value: string) => void
}) {
  return (
    <div className="rounded-[12px] border border-line bg-paper/40 p-3.5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-copper">{label}</p>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Esfera" required>
          <Input
            value={eye.esfera}
            onChange={(e) => onChange('esfera', e.target.value)}
            disabled={disabled}
            placeholder="-2.25"
            inputMode="decimal"
          />
        </Field>
        <Field label="Cilindro">
          <Input
            value={eye.cilindro}
            onChange={(e) => onChange('cilindro', e.target.value)}
            disabled={disabled}
            placeholder="-0.75"
            inputMode="decimal"
          />
        </Field>
        <Field label="Eje">
          <Input
            value={eye.eje}
            onChange={(e) => onChange('eje', e.target.value)}
            disabled={disabled}
            placeholder="180"
            inputMode="numeric"
          />
        </Field>
        <Field label="Adición">
          <Input
            value={eye.adicion}
            onChange={(e) => onChange('adicion', e.target.value)}
            disabled={disabled}
            placeholder="0.00"
            inputMode="decimal"
          />
        </Field>
        <Field label="DP" className="col-span-2">
          <Input
            value={eye.dp}
            onChange={(e) => onChange('dp', e.target.value)}
            disabled={disabled}
            placeholder="31.0"
            inputMode="decimal"
          />
        </Field>
      </div>
    </div>
  )
}

function PrescriptionPreview({
  patientName,
  od,
  oi,
  agudezaOD,
  agudezaOI,
  previous,
}: {
  patientName: string
  od: EyeType
  oi: EyeType
  agudezaOD: string
  agudezaOI: string
  previous?: Prescription
}) {
  const changed =
    previous &&
    JSON.stringify(previous.od) !== JSON.stringify(od) ||
    (previous && JSON.stringify(previous.oi) !== JSON.stringify(oi))

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line bg-pine px-5 py-4 text-paper">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-paper/60">Vista previa</p>
        <p className="mt-1 font-display text-xl">Receta óptica</p>
      </div>
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Paciente</p>
        <p className="text-[14px] font-bold text-ink">{patientName}</p>

        <div className="mt-4 space-y-3">
          <PreviewRow label="OD" eye={od} />
          <PreviewRow label="OI" eye={oi} />
        </div>

        <div className="mt-4 flex gap-4 border-t border-line pt-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Agudeza OD</p>
            <p className="tnum text-[13px] font-bold text-ink">{agudezaOD || '—'}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-muted">Agudeza OI</p>
            <p className="tnum text-[13px] font-bold text-ink">{agudezaOI || '—'}</p>
          </div>
        </div>

        {previous && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cx(
              'mt-4 rounded-[8px] px-3 py-2 text-[11px] font-semibold',
              changed ? 'bg-amber-soft text-amber' : 'bg-pine-soft text-pine',
            )}
          >
            {changed ? 'Cambios respecto de la receta anterior' : 'Sin cambios respecto de la anterior'}
          </motion.div>
        )}

        <p className="mt-4 text-[9px] leading-relaxed text-muted">
          Documento preliminar. Al emitir se agrega folio correlativo, timbre del establecimiento y
          firma del tecnólogo.
        </p>
      </div>
    </Card>
  )
}

function PreviewRow({ label, eye }: { label: string; eye: EyeType }) {
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-[8px] bg-paper/70 px-3 py-2">
      <span className="text-[10px] font-bold text-copper">{label}</span>
      <span className="tnum text-right text-[12px] font-semibold text-ink">
        {eye.esfera || '—'} {eye.cilindro ? `/ ${eye.cilindro}` : ''}{' '}
        {eye.eje ? `× ${eye.eje}°` : ''} {eye.adicion !== '0.00' ? `· Add ${eye.adicion}` : ''}
      </span>
    </div>
  )
}

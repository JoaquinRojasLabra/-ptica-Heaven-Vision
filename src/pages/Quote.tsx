import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Flask,
  Info,
  Package,
  ShoppingBag,
  WarningCircle,
} from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageTitle,
  Select,
  cx,
} from '../components/UI'
import { clp, dateFull } from '../lib/format'
import { useStore } from '../lib/store'
import type { Frame, Lens } from '../lib/types'

const FRAMES: Frame[] = [
  { nombre: 'Ray-Ban RB5154', precio: 89900 },
  { nombre: 'Vogue VO5412', precio: 54900 },
  { nombre: 'Carrera 8871', precio: 79900 },
  { nombre: 'Oakley OX8046', precio: 99000 },
  { nombre: 'Silhouette 5560', precio: 159000 },
  { nombre: 'Ted Baker 9182', precio: 64900 },
  { nombre: 'Armazón económico', precio: 29900 },
  { nombre: 'Sin armazón (solo cristales)', precio: 0 },
  { nombre: 'Armazón del paciente', precio: 0 },
]

const BASE: Record<string, number> = {
  Monofocal: 45000,
  Bifocal: 85000,
  Multifocal: 145000,
}

const EXTRAS: Array<{ name: string; price: number }> = [
  { name: 'Antirreflejo', price: 25000 },
  { name: 'Filtro azul', price: 20000 },
  { name: 'Fotocromático', price: 35000 },
]

export default function Quote() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { role, patient, prescriptions, inventory, createOrder, stockStatus } = useStore()

  const p = patient(id)
  const recetas = useMemo(
    () =>
      prescriptions
        .filter((r) => r.patientId === id)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    [prescriptions, id],
  )
  const [prescriptionId, setPrescriptionId] = useState(params.get('receta') ?? recetas[0]?.id ?? '')
  const receta = recetas.find((r) => r.id === prescriptionId) ?? recetas[0]

  const [mode, setMode] = useState<'stock' | 'pedido'>('stock')
  const [itemId, setItemId] = useState('')
  const [tipo, setTipo] = useState('Monofocal')
  const [material, setMaterial] = useState('Resina 1.60')
  const [lab, setLab] = useState('Laboratorio Central')
  const [extras, setExtras] = useState<string[]>([])
  const [frameName, setFrameName] = useState(FRAMES[0].nombre)
  const [framePrice, setFramePrice] = useState(FRAMES[0].precio)
  const [convenio, setConvenio] = useState(Boolean(p?.convenio))
  const [recetaComprada, setRecetaComprada] = useState(false)
  const [abono, setAbono] = useState(0)
  const [error, setError] = useState('')

  if (!p) return <Navigate to="/pacientes" replace />

  if (!receta) {
    return (
      <div>
        <Link to={`/pacientes/${p.id}`} className="text-[12px] font-bold text-muted hover:text-ink">
          ← Volver a la ficha
        </Link>
        <div className="mt-6 rounded-[18px] border border-dashed border-line-strong bg-surface p-10 text-center">
          <Package size={30} className="mx-auto text-muted" />
          <h1 className="mt-3 font-display text-2xl text-ink">Este paciente no tiene receta</h1>
          <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">
            Para cotizar lentes con graduación primero se debe realizar el examen visual. La receta
            queda en la ficha y no se vuelve a ingresar.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link to={`/consulta/${p.id}`}>
              <Button variant="primary">Ir a consulta</Button>
            </Link>
            <Link to={`/pacientes/${p.id}`}>
              <Button variant="outline">Ver ficha</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const selectedItem = inventory.find((i) => i.id === itemId)

  const lens: Lens =
    mode === 'stock' && selectedItem
      ? {
          tipo: selectedItem.tipo,
          material: selectedItem.material,
          tratamientos: Array.from(new Set([...selectedItem.tratamientos, ...extras])),
          laboratorio: selectedItem.laboratorio,
          precio:
            selectedItem.precio +
            extras
              .filter((e) => !selectedItem.tratamientos.includes(e))
              .reduce((a, e) => a + (EXTRAS.find((x) => x.name === e)?.price ?? 0), 0),
        }
      : {
          tipo,
          material,
          tratamientos: extras,
          laboratorio: lab,
          precio:
            (BASE[tipo] ?? 45000) +
            extras.reduce((a, e) => a + (EXTRAS.find((x) => x.name === e)?.price ?? 0), 0),
        }

  const stockAvailable = mode === 'stock' && (selectedItem?.stock ?? 0) > 0
  const delivery = stockAvailable
    ? lens.tipo === 'Monofocal'
      ? 'Listo en 1 hora'
      : '3 a 4 días hábiles'
    : '10 a 15 días hábiles'

  const frame = { nombre: frameName, precio: framePrice }
  const bruto = lens.precio + frame.precio
  const descuentoConvenio = convenio ? Math.round(bruto * 0.15) : 0
  const descuentoReceta = recetaComprada ? 15000 : 0
  const descuento = descuentoConvenio + descuentoReceta
  const total = Math.max(0, bruto - descuento)
  const saldo = Math.max(0, total - abono)

  const toggleExtra = (name: string) =>
    setExtras((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'tecnologo' || role === 'montajista') {
      setError('Tu rol no puede generar órdenes de trabajo.')
      return
    }
    if (mode === 'stock' && !selectedItem) {
      setError('Selecciona un cristal del stock o cambia a "Pedir al laboratorio".')
      return
    }
    if (abono > total) {
      setError('El abono no puede superar el total.')
      return
    }
    setError('')
    const promesa = new Date()
    if (delivery.includes('1 hora')) promesa.setHours(promesa.getHours() + 1)
    else if (delivery.includes('3 a 4')) promesa.setDate(promesa.getDate() + 4)
    else promesa.setDate(promesa.getDate() + 15)

    const orderId = createOrder({
      patientId: p.id,
      prescriptionId: receta.id,
      cristal: lens,
      armazon: frame,
      descuento,
      abono,
      promesa: promesa.toISOString(),
      recetaComprada,
      inventoryId: mode === 'stock' ? selectedItem?.id : undefined,
    })
    navigate(`/ordenes/${orderId}`)
  }

  const canSell = role === 'admin' || role === 'vendedora'

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
          title="Cotización y orden"
          subtitle={`${p.nombre} · ${p.rut}`}
          action={
            <Badge tone={p.consentimiento ? 'pine' : 'danger'} dot>
              {p.consentimiento ? 'Consentimiento firmado' : 'Falta consentimiento'}
            </Badge>
          }
        />
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl text-ink">Receta que se usará</h2>
              <Badge tone="outline">{recetas.length} disponibles</Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Receta">
                <Select value={receta.id} onChange={(e) => setPrescriptionId(e.target.value)}>
                  {recetas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {dateFull(r.fecha)} · OD {r.od.esfera} / OI {r.oi.esfera}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="rounded-[10px] bg-paper/80 px-3 py-2 text-[11px] text-muted">
                OD <strong className="tnum text-ink">{receta.od.esfera}</strong> · OI{' '}
                <strong className="tnum text-ink">{receta.oi.esfera}</strong>
                <br />
                Add {receta.od.adicion} · DP {receta.od.dp}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl text-ink">Cristales</h2>
              <div className="flex rounded-full border border-line bg-paper/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setMode('stock')}
                  className={cx(
                    'rounded-full px-3 py-1 text-[11px] font-bold transition-colors',
                    mode === 'stock' ? 'bg-surface text-ink shadow-sm' : 'text-muted',
                  )}
                >
                  Stock disponible
                </button>
                <button
                  type="button"
                  onClick={() => setMode('pedido')}
                  className={cx(
                    'rounded-full px-3 py-1 text-[11px] font-bold transition-colors',
                    mode === 'pedido' ? 'bg-surface text-ink shadow-sm' : 'text-muted',
                  )}
                >
                  Pedir al laboratorio
                </button>
              </div>
            </div>

            {mode === 'stock' ? (
              <>
                <p className="mt-1 text-[12px] text-muted">
                  El stock se descuenta automáticamente al generar la orden.
                </p>
                <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                  {inventory.map((item) => {
                    const selected = item.id === itemId
                    const status = stockStatus(item)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setItemId(item.id)}
                        className={cx(
                          'flex w-full items-center gap-3 rounded-[10px] border p-3 text-left transition-colors',
                          selected
                            ? 'border-copper bg-copper-soft/40'
                            : 'border-line hover:border-line-strong hover:bg-paper/50',
                        )}
                      >
                        <span
                          className={cx(
                            'grid size-5 shrink-0 place-items-center rounded-full border',
                            selected ? 'border-copper bg-copper text-white' : 'border-line-strong',
                          )}
                        >
                          {selected && <Check size={12} weight="bold" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[12px] font-bold text-ink">
                              {item.tipo} · {item.esfera} {item.cilindro}
                            </span>
                            <Badge tone={status === 'rojo' ? 'danger' : status === 'amarillo' ? 'amber' : 'pine'}>
                              {item.stock} en stock
                            </Badge>
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted">
                            {item.material} · {item.tratamientos.join(', ') || 'Sin tratamiento'} ·{' '}
                            {item.laboratorio}
                          </span>
                        </span>
                        <span className="tnum shrink-0 text-[12px] font-bold text-ink">
                          {clp(item.precio)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Tipo de cristal">
                  <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option>Monofocal</option>
                    <option>Bifocal</option>
                    <option>Multifocal</option>
                  </Select>
                </Field>
                <Field label="Material">
                  <Select value={material} onChange={(e) => setMaterial(e.target.value)}>
                    <option>Resina 1.56</option>
                    <option>Resina 1.60</option>
                    <option>Resina 1.67</option>
                    <option>Policarbonato</option>
                  </Select>
                </Field>
                <Field label="Laboratorio" className="sm:col-span-2">
                  <Select value={lab} onChange={(e) => setLab(e.target.value)}>
                    <option>Laboratorio Central</option>
                    <option>Laboratorio Externo Visión</option>
                  </Select>
                </Field>
                <div className="sm:col-span-2 flex items-start gap-2 rounded-[10px] bg-info-soft/60 px-3 py-2.5">
                  <Info size={15} className="mt-0.5 shrink-0 text-info" />
                  <p className="text-[11px] leading-relaxed text-ink-soft">
                    Se genera un pedido al laboratorio y se avisa al celular de la administradora.
                    Entrega estimada: <strong>10 a 15 días hábiles</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                Tratamientos adicionales
              </p>
              <div className="flex flex-wrap gap-2">
                {EXTRAS.map((extra) => {
                  const active = extras.includes(extra.name)
                  return (
                    <button
                      key={extra.name}
                      type="button"
                      onClick={() => toggleExtra(extra.name)}
                      className={cx(
                        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors',
                        active
                          ? 'border-pine bg-pine-soft text-pine'
                          : 'border-line text-muted hover:border-line-strong hover:text-ink',
                      )}
                    >
                      {active && <Check size={11} weight="bold" />}
                      {extra.name} · +{clp(extra.price)}
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-xl text-ink">Armazón</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
              <Field label="Modelo">
                <Select
                  value={frameName}
                  onChange={(e) => {
                    const f = FRAMES.find((x) => x.nombre === e.target.value)
                    setFrameName(e.target.value)
                    if (f) setFramePrice(f.precio)
                  }}
                >
                  {FRAMES.map((f) => (
                    <option key={f.nombre} value={f.nombre}>
                      {f.nombre} · {clp(f.precio)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Precio">
                <Input
                  type="number"
                  min={0}
                  value={framePrice}
                  onChange={(e) => setFramePrice(Number(e.target.value))}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-xl text-ink">Condiciones</h2>
            <div className="mt-3 space-y-2">
              {p.convenio && (
                <label className="flex items-center justify-between gap-3 rounded-[10px] border border-line p-3">
                  <span>
                    <span className="block text-[12px] font-bold text-ink">Descuento convenio</span>
                    <span className="block text-[11px] text-muted">{p.convenio} · 15% del total</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={convenio}
                    onChange={(e) => setConvenio(e.target.checked)}
                    className="size-4 accent-[#B4471F]"
                  />
                </label>
              )}
              <label className="flex items-center justify-between gap-3 rounded-[10px] border border-line p-3">
                <span>
                  <span className="block text-[12px] font-bold text-ink">Ya compró la receta</span>
                  <span className="block text-[11px] text-muted">
                    Se descuentan {clp(15000)} del valor del lente
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={recetaComprada}
                  onChange={(e) => setRecetaComprada(e.target.checked)}
                  className="size-4 accent-[#B4471F]"
                />
              </label>
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-pine px-5 py-4 text-paper">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-paper/60">Resumen</p>
              <p className="mt-1 font-display text-2xl">{clp(total)}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-paper/70">
                <Clock size={13} />
                {delivery}
              </p>
            </div>

            <div className="space-y-2.5 p-5 text-[12px]">
              <Row label={`Cristal ${lens.tipo}`} value={clp(lens.precio)} />
              <Row label={frame.nombre} value={clp(frame.precio)} />
              {descuentoConvenio > 0 && (
                <Row label="Descuento convenio (15%)" value={`− ${clp(descuentoConvenio)}`} tone="pine" />
              )}
              {descuentoReceta > 0 && (
                <Row label="Receta ya comprada" value={`− ${clp(descuentoReceta)}`} tone="pine" />
              )}
              <div className="my-2 h-px bg-line" />
              <Row label="Total" value={clp(total)} bold />
            </div>

            <div className="border-t border-line p-5">
              <Field label="Abono inicial" hint={`Saldo ${clp(saldo)}`}>
                <Input
                  type="number"
                  min={0}
                  max={total}
                  value={abono}
                  onChange={(e) => setAbono(Math.max(0, Number(e.target.value)))}
                />
              </Field>
              <div className="mt-2 flex gap-1.5">
                {[0, 0.5, 1].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setAbono(Math.round(total * pct))}
                    className="flex-1 rounded-full border border-line py-1 text-[10px] font-bold text-muted transition-colors hover:border-line-strong hover:text-ink"
                  >
                    {pct === 0 ? 'Sin abono' : pct === 0.5 ? '50%' : '100%'}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-[10px] bg-paper/80 px-3 py-2.5">
                <span className="text-[11px] font-semibold text-muted">Saldo a pagar</span>
                <span className={cx('tnum text-[15px] font-bold', saldo > 0 ? 'text-danger' : 'text-pine')}>
                  {clp(saldo)}
                </span>
              </div>

              {error && (
                <p role="alert" className="mt-3 flex items-start gap-1.5 text-[11px] font-semibold text-danger">
                  <WarningCircle size={14} className="mt-0.5 shrink-0" />
                  {error}
                </p>
              )}

              {canSell ? (
                <Button type="submit" variant="copper" className="mt-4 w-full" size="lg">
                  <ShoppingBag size={17} weight="bold" />
                  Generar orden de trabajo
                </Button>
              ) : (
                <p className="mt-4 rounded-[10px] bg-amber-soft px-3 py-2 text-[11px] font-semibold text-amber">
                  Tu rol no puede generar órdenes. Pide a la vendedora que cierre la venta.
                </p>
              )}

              <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
                <CheckCircle size={13} className="mt-0.5 shrink-0 text-pine" />
                Al generar la orden se descuenta el stock, se registra el abono y el paciente recibe
                el aviso cuando los lentes estén listos.
              </p>
            </div>
          </Card>

          <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-line bg-surface/60 px-3 py-2.5">
            <Flask size={16} className="text-muted" />
            <p className="text-[10px] leading-relaxed text-muted">
              Si el paciente no compra, la cotización queda en la ficha y puede retomarse sin volver a
              ingresar datos.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}

function Row({
  label,
  value,
  tone,
  bold,
}: {
  label: string
  value: string
  tone?: 'pine'
  bold?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={cx('text-muted', bold && 'font-bold text-ink')}>{label}</span>
      <span
        className={cx(
          'tnum shrink-0',
          bold ? 'text-[15px] font-bold text-ink' : 'font-semibold',
          tone === 'pine' ? 'text-pine' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  )
}

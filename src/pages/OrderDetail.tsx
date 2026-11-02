import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  FileText,
  Flask,
  Package,
  Printer,
  ShieldCheck,
  User,
} from '@phosphor-icons/react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
  cx,
} from '../components/UI'
import { clp, dateFull, dateTime, daysUntil } from '../lib/format'
import { useStore } from '../lib/store'
import { STATUS_LABEL, STATUS_ORDER, type Payment } from '../lib/types'

export default function OrderDetail() {
  const { id = '' } = useParams()
  const { role, order, patient, prescription, advanceOrder, addPayment } = useStore()
  const [payOpen, setPayOpen] = useState(false)
  const [amount, setAmount] = useState(0)
  const [medio, setMedio] = useState<Payment['medio']>('Débito')
  const [notice, setNotice] = useState('')

  const o = order(id)
  if (!o) return <Navigate to="/ordenes" replace />

  const p = patient(o.patientId)
  const r = prescription(o.prescriptionId)
  const saldo = Math.max(0, o.total - o.abono)
  const index = STATUS_ORDER.indexOf(o.estado)
  const next = STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)]
  const canAdvance = role !== 'tecnologo' && o.estado !== 'entregada'
  const canPay = role === 'admin' || role === 'vendedora'

  const openPay = () => {
    setAmount(saldo)
    setNotice('')
    setPayOpen(true)
  }

  const handleAdvance = () => {
    if (next === 'entregada' && saldo > 0) {
      openPay()
      setNotice('Para entregar los lentes primero hay que registrar el saldo pendiente.')
      return
    }
    advanceOrder(o.id)
  }

  const submitPay = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount <= 0 || amount > saldo) {
      setNotice('El monto debe ser mayor que cero y no superar el saldo.')
      return
    }
    addPayment(o.id, amount, medio)
    setPayOpen(false)
    setNotice('')
  }

  return (
    <div>
      <Link
        to="/ordenes"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> Pedidos
      </Link>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="tnum font-display text-[28px] leading-tight text-ink sm:text-[34px]">
              {o.folio}
            </h1>
            <Badge
              tone={o.estado === 'entregada' ? 'pine' : o.estado === 'lista' ? 'brand' : 'info'}
              dot
            >
              {STATUS_LABEL[o.estado]}
            </Badge>
          </div>
          <p className="mt-1.5 text-[13.5px] font-medium text-ink-soft">
            {p?.nombre} · {p?.rut}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            Creado el {dateFull(o.createdAt)} · Entrega prometida {dateFull(o.promesa)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/imprimir/${o.id}/receta`}>
            <Button variant="outline" size="sm">
              <FileText size={15} />
              Receta
            </Button>
          </Link>
          <Link to={`/imprimir/${o.id}/ot`}>
            <Button variant="outline" size="sm">
              <Printer size={15} />
              Imprimir
            </Button>
          </Link>
          {canPay && saldo > 0 && (
            <Button variant="outline" size="sm" onClick={openPay}>
              <CurrencyCircleDollar size={15} />
              Registrar pago
            </Button>
          )}
          {canAdvance && (
            <Button variant="primary" size="sm" onClick={handleAdvance}>
              {next === 'entregada' ? 'Entregar lentes' : next === 'lista' ? 'Marcar listo para retirar' : `Pasar a ${STATUS_LABEL[next].toLowerCase()}`}
              <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-4 rounded-[10px] border border-amber/30 bg-amber-soft px-3 py-2 text-[12px] font-semibold text-amber"
        >
          {notice}
        </p>
      )}

      <Card className="mt-5 overflow-x-auto p-4">
        <ol className="flex min-w-[620px] items-start justify-between gap-1">
          {STATUS_ORDER.map((status, i) => {
            const event = o.historial.find((h) => h.estado === status)
            const done = i < index || o.estado === status
            const current = o.estado === status
            return (
              <li key={status} className="relative flex flex-1 flex-col items-center text-center">
                {i < STATUS_ORDER.length - 1 && (
                  <span
                    className={cx(
                      'absolute left-1/2 top-4 h-px w-full',
                      i < index ? 'bg-pine' : 'bg-line',
                    )}
                  />
                )}
                <span
                  className={cx(
                    'relative z-10 grid size-8 place-items-center rounded-full border-2 text-[11px] font-bold',
                    current
                      ? 'border-brand bg-brand text-white'
                      : done
                        ? 'border-pine bg-pine text-white'
                        : 'border-line-strong bg-surface text-muted',
                  )}
                >
                  {done && !current ? <Check size={14} weight="bold" /> : i + 1}
                </span>
                <span
                  className={cx(
                    'mt-2 text-[10px] font-bold uppercase tracking-wide',
                    current ? 'text-brand' : done ? 'text-ink' : 'text-muted',
                  )}
                >
                  {STATUS_LABEL[status]}
                </span>
                {event && (
                  <span className="tnum mt-0.5 text-[9px] text-muted">{dateFull(event.fecha)}</span>
                )}
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <Flask size={19} className="text-brand" />
              Detalle del pedido
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Cristal</p>
                <p className="mt-1 text-[14px] font-bold text-ink">
                  {o.cristal.tipo} · {o.cristal.material}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {o.cristal.tratamientos.join(', ') || 'Sin tratamientos'}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">{o.cristal.laboratorio}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Armazón</p>
                <p className="mt-1 text-[14px] font-bold text-ink">{o.armazon.nombre}</p>
                <p className="mt-0.5 text-[11px] text-muted">{clp(o.armazon.precio)}</p>
              </div>
            </div>

            {r && (
              <div className="mt-4 overflow-hidden rounded-[10px] border border-line">
                <table className="w-full text-center text-[11px]">
                  <thead className="bg-paper/70 text-[9px] font-bold uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-2 py-2 text-left">Ojo</th>
                      <th className="px-2 py-2">Esfera</th>
                      <th className="px-2 py-2">Cilindro</th>
                      <th className="px-2 py-2">Eje</th>
                      <th className="px-2 py-2">Adición</th>
                      <th className="px-2 py-2">DP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {[
                      ['OD', r.od],
                      ['OI', r.oi],
                    ].map(([label, eye]) => {
                      const e = eye as typeof r.od
                      return (
                        <tr key={label as string}>
                          <td className="px-2 py-2 text-left font-bold text-brand">{label as string}</td>
                          <td className="tnum px-2 py-2 font-semibold text-ink">{e.esfera}</td>
                          <td className="tnum px-2 py-2 text-ink-soft">{e.cilindro}</td>
                          <td className="tnum px-2 py-2 text-ink-soft">{e.eje}</td>
                          <td className="tnum px-2 py-2 text-ink-soft">{e.adicion}</td>
                          <td className="tnum px-2 py-2 text-ink-soft">{e.dp}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <Clock size={19} className="text-brand" />
              Historial
            </h2>
            <ol className="mt-4">
              {[...o.historial].reverse().map((h, i) => (
                <li key={`${h.estado}-${h.fecha}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cx(
                        'mt-1 size-2 shrink-0 rounded-full',
                        i === 0 ? 'bg-brand' : 'bg-line-strong',
                      )}
                    />
                    {i < o.historial.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-[12px] font-bold text-ink">{STATUS_LABEL[h.estado]}</p>
                    <p className="text-[10px] text-muted">
                      {dateTime(h.fecha)} · {h.usuario}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="flex items-start gap-3 p-5">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-pine" />
            <div>
              <p className="text-[12px] font-bold text-ink">Garantía legal de 6 meses</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                El reverso de la orden impresa incluye la garantía, la exclusión del derecho a
                retracto por bien a medida y el consentimiento informado. La versión firmada queda
                archivada por 15 años.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <User size={19} className="text-brand" />
              Paciente
            </h2>
            {p && (
              <Link
                to={`/pacientes/${p.id}`}
                className="mt-3 flex items-center gap-3 rounded-[10px] bg-paper/70 p-3 transition-colors hover:bg-paper"
              >
                <span className="grid size-10 place-items-center rounded-full bg-surface text-[12px] font-bold text-pine">
                  {p.nombre
                    .split(' ')
                    .slice(0, 2)
                    .map((x) => x[0])
                    .join('')}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-ink">{p.nombre}</span>
                  <span className="block text-[11px] text-muted">{p.telefono}</span>
                </span>
                <ArrowRight size={14} className="ml-auto text-muted" />
              </Link>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone={p?.consentimiento ? 'pine' : 'danger'} dot>
                {p?.consentimiento ? 'Consentimiento firmado' : 'Sin consentimiento'}
              </Badge>
              {o.recetaComprada && <Badge tone="info">Receta ya comprada</Badge>}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <CurrencyCircleDollar size={19} className="text-brand" />
              Pagos
            </h2>
            <dl className="mt-4 space-y-2 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-muted">Cristales + armazón</dt>
                <dd className="tnum font-semibold text-ink">{clp(o.cristal.precio + o.armazon.precio)}</dd>
              </div>
              {o.descuento > 0 && (
                <div className="flex justify-between text-pine">
                  <dt>Descuentos</dt>
                  <dd className="tnum font-semibold">− {clp(o.descuento)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="font-bold text-ink">Total</dt>
                <dd className="tnum text-[15px] font-bold text-ink">{clp(o.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Abonado</dt>
                <dd className="tnum font-semibold text-pine">{clp(o.abono)}</dd>
              </div>
              <div className="flex items-center justify-between rounded-[8px] bg-paper/80 px-2.5 py-2">
                <dt className="font-bold text-ink">Saldo</dt>
                <dd className={cx('tnum text-[15px] font-bold', saldo > 0 ? 'text-danger' : 'text-pine')}>
                  {clp(saldo)}
                </dd>
              </div>
            </dl>

            {canPay && saldo > 0 && (
              <Button variant="brand" className="mt-4 w-full" onClick={openPay}>
                Registrar pago del saldo
              </Button>
            )}
            {saldo === 0 && (
              <p className="mt-4 flex items-center gap-1.5 rounded-[8px] bg-pine-soft px-2.5 py-2 text-[11px] font-bold text-pine">
                <CheckCircle size={14} />
                Orden pagada en su totalidad
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <Package size={19} className="text-brand" />
              Entrega
            </h2>
            <p className="mt-3 text-[12px] text-ink-soft">
              {o.estado === 'entregada'
                ? `Entregada el ${dateFull(o.historial.at(-1)?.fecha ?? o.promesa)}`
                : daysUntil(o.promesa) < 0
                  ? `Atrasada por ${Math.abs(daysUntil(o.promesa))} días`
                  : `Faltan ${daysUntil(o.promesa)} días`}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Promesa: {dateFull(o.promesa)} · {o.cristal.laboratorio}
            </p>
            {o.estado === 'lista' && (
              <p className="mt-3 rounded-[8px] bg-brand-soft px-3 py-2 text-[11px] font-semibold text-brand-deep">
                Lentes listos. Falta avisar al paciente y coordinar el retiro.
              </p>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Registrar pago"
        description={`${o.folio} · saldo pendiente ${clp(saldo)}`}
      >
        <form onSubmit={submitPay} className="space-y-4">
          <Field label="Monto" required>
            <Input
              type="number"
              min={1}
              max={saldo}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              autoFocus
            />
          </Field>
          <Field label="Medio de pago">
            <Select value={medio} onChange={(e) => setMedio(e.target.value as Payment['medio'])}>
              <option>Efectivo</option>
              <option>Débito</option>
              <option>Crédito</option>
              <option>Transferencia</option>
            </Select>
          </Field>
          <p className="rounded-[10px] bg-paper/80 px-3 py-2 text-[11px] leading-relaxed text-muted">
            El pago se registra en la caja del día. El documento tributario se emite en el POS Klap,
            enlazado al SII.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand">
              <CheckCircle size={16} />
              Registrar {clp(amount)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

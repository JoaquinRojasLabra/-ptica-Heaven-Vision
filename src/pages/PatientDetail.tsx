import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  CheckCircle,
  ClipboardText,
  CurrencyCircleDollar,
  Eye,
  FileText,
  Phone,
  Plus,
  Printer,
  ShieldCheck,
  UserFocus,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  PageTitle,
  cx,
} from '../components/UI'
import { age, clp, dateFull, dateTime, timeShort } from '../lib/format'
import { useStore } from '../lib/store'
import { STATUS_LABEL, type Eye as EyeType, type Prescription } from '../lib/types'

type Tab = 'resumen' | 'recetas' | 'ordenes' | 'pagos'

export default function PatientDetail() {
  const { id = '' } = useParams()
  const { role, patient, prescriptions, orders, payments, logAccess } = useStore()
  const [tab, setTab] = useState<Tab>('resumen')

  const p = patient(id)
  if (!p) return <Navigate to="/pacientes" replace />

  const recetas = prescriptions
    .filter((r) => r.patientId === id)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  const ordenes = orders
    .filter((o) => o.patientId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const pagos = payments
    .filter((pay) => ordenes.some((o) => o.id === pay.orderId))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  const saldo = ordenes.reduce((a, o) => a + Math.max(0, o.total - o.abono), 0)
  const comprado = ordenes.reduce((a, o) => a + o.abono, 0)

  const canConsult = role === 'tecnologo'
  const canSell = role === 'vendedora' || role === 'admin'
  const seesCommercial = role === 'admin' || role === 'vendedora'

  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'recetas', label: 'Recetas', count: recetas.length },
    ...(seesCommercial
      ? [
          { key: 'ordenes' as Tab, label: 'Pedidos', count: ordenes.length },
          { key: 'pagos' as Tab, label: 'Pagos', count: pagos.length },
        ]
      : []),
  ]

  const timeline = [
    ...recetas.map((r) => ({
      id: `pr-${r.id}`,
      fecha: r.fecha,
      title: 'Receta emitida',
      detail: `OD ${r.od.esfera} · OI ${r.oi.esfera} · ${r.profesional}`,
      tone: 'info' as const,
    })),
    ...ordenes.flatMap((o) =>
      o.historial.map((h) => ({
        id: `${o.id}-${h.estado}`,
        fecha: h.fecha,
        title: `${o.folio} · ${STATUS_LABEL[h.estado]}`,
        detail: `${o.cristal.tipo} · ${h.usuario}`,
        tone: h.estado === 'entregada' ? ('pine' as const) : ('brand' as const),
      })),
    ),
    ...pagos.map((pay) => ({
      id: pay.id,
      fecha: pay.fecha,
      title: 'Pago registrado',
      detail: `${clp(pay.monto)} · ${pay.medio}`,
      tone: 'pine' as const,
    })),
  ]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 9)

  return (
    <div>
      <Link
        to="/pacientes"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> Pacientes
      </Link>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={p.nombre} size="lg" />
          <div>
            <PageTitle
              title={p.nombre}
              subtitle={`${p.rut} · ${age(p.nacimiento)} años · ${p.telefono}`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {p.convenio ? <Badge tone="info">{p.convenio}</Badge> : <Badge tone="outline">Particular</Badge>}
              <Badge tone={p.consentimiento ? 'pine' : 'danger'} dot>
                {p.consentimiento ? 'Consentimiento firmado' : 'Sin consentimiento'}
              </Badge>
              {saldo > 0 && <Badge tone="danger">Saldo {clp(saldo)}</Badge>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canConsult && (
            <Link to={`/consulta/${p.id}`}>
              <Button variant="primary">
                <UserFocus size={17} />
                Nueva consulta
              </Button>
            </Link>
          )}
          {canSell && recetas.length > 0 && (
            <Link to={`/cotizacion/${p.id}`}>
              <Button variant="brand">
                <Plus size={17} weight="bold" />
                Cotizar lentes
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cx(
              'relative flex h-10 items-center gap-1.5 whitespace-nowrap px-3 text-[12px] font-bold transition-colors',
              tab === t.key ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="tnum rounded-full bg-ink/[0.06] px-1.5 py-0.5 text-[10px] text-ink-soft">
                {t.count}
              </span>
            )}
            {tab === t.key && (
              <motion.span
                layoutId="patient-tab"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand"
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'resumen' && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Card className="p-5">
              <h2 className="font-display text-xl text-ink">Historial de la ficha</h2>
              {timeline.length === 0 ? (
                <p className="mt-4 text-[13px] text-muted">Todavía no hay movimientos.</p>
              ) : (
                <ol className="mt-5 space-y-0">
                  {timeline.map((t, i) => (
                    <li key={t.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={cx(
                            'mt-1 size-2 shrink-0 rounded-full',
                            t.tone === 'pine' ? 'bg-pine' : t.tone === 'info' ? 'bg-info' : 'bg-brand',
                          )}
                        />
                        {i < timeline.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-[13px] font-bold text-ink">{t.title}</p>
                        <p className="text-[11px] text-muted">{t.detail}</p>
                        <p className="tnum mt-0.5 text-[10px] text-muted/80">{dateTime(t.fecha)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="font-display text-xl text-ink">Datos de contacto</h2>
                <dl className="mt-4 space-y-3 text-[12px]">
                  <div className="flex items-start gap-2">
                    <Phone size={15} className="mt-0.5 text-muted" />
                    <div>
                      <dt className="font-semibold text-ink">{p.telefono}</dt>
                      <dd className="text-muted">{p.email || 'Sin correo'}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarBlank size={15} className="mt-0.5 text-muted" />
                    <div>
                      <dt className="font-semibold text-ink">Nacimiento</dt>
                      <dd className="text-muted">{dateFull(p.nacimiento)}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={15} className="mt-0.5 text-muted" />
                    <div>
                      <dt className="font-semibold text-ink">Consentimiento</dt>
                      <dd className="text-muted">
                        {p.consentimiento ? 'Firmado en la orden de trabajo' : 'Pendiente'}
                      </dd>
                    </div>
                  </div>
                </dl>
                {p.notas && (
                  <p className="mt-4 rounded-[10px] bg-paper/80 p-3 text-[11px] leading-relaxed text-ink-soft">
                    {p.notas}
                  </p>
                )}
                <p className="mt-3 text-[10px] leading-relaxed text-muted">
                  {p.direccion || 'Sin dirección registrada'}
                </p>
              </Card>

              {seesCommercial && (
                <Card className="p-5">
                  <h2 className="font-display text-xl text-ink">Resumen comercial</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Comprado</p>
                      <p className="tnum mt-1 font-display text-2xl text-ink">{clp(comprado)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Saldo</p>
                      <p className={cx('tnum mt-1 font-display text-2xl', saldo > 0 ? 'text-danger' : 'text-pine')}>
                        {saldo > 0 ? clp(saldo) : '$0'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {ordenes.slice(0, 3).map((o) => (
                      <Link
                        key={o.id}
                        to={`/ordenes/${o.id}`}
                        className="flex items-center justify-between rounded-[8px] px-2 py-1.5 text-[11px] transition-colors hover:bg-paper"
                      >
                        <span className="tnum font-bold text-ink">{o.folio}</span>
                        <Badge tone={o.estado === 'entregada' ? 'pine' : o.estado === 'lista' ? 'brand' : 'neutral'}>
                          {STATUS_LABEL[o.estado]}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === 'recetas' && (
          <div className="space-y-3">
            {recetas.length === 0 ? (
              <EmptyState
                icon={<FileText size={28} />}
                title="Sin recetas registradas"
                description="El tecnólogo debe realizar el examen visual para emitir la primera receta."
                action={
                  canConsult ? (
                    <Link to={`/consulta/${p.id}`}>
                      <Button variant="primary">Iniciar consulta</Button>
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              recetas.map((r) => (
                <PrescriptionCard
                  key={r.id}
                  receta={r}
                  onUse={canSell ? () => logAccess(p.id) : undefined}
                  patientId={p.id}
                  canSell={canSell}
                />
              ))
            )}
          </div>
        )}

        {tab === 'ordenes' && (
          <div className="space-y-2.5">
            {ordenes.length === 0 ? (
              <EmptyState
                icon={<ClipboardText size={28} />}
                title="Sin pedidos"
                description="Crea una cotización para generar la primera orden."
              />
            ) : (
              ordenes.map((o) => (
                <Link key={o.id} to={`/ordenes/${o.id}`}>
                  <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-line-strong sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="tnum text-[13px] font-bold text-ink">{o.folio}</p>
                        <Badge
                          tone={
                            o.estado === 'entregada'
                              ? 'pine'
                              : o.estado === 'lista'
                                ? 'brand'
                                : o.estado === 'laboratorio'
                                  ? 'info'
                                  : 'neutral'
                          }
                        >
                          {STATUS_LABEL[o.estado]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[12px] text-muted">
                        {o.cristal.tipo} · {o.armazon.nombre} · {dateFull(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="tnum text-[13px] font-bold text-ink">{clp(o.total)}</p>
                      <p className={cx('tnum text-[11px]', o.total - o.abono > 0 ? 'text-danger' : 'text-pine')}>
                        {o.total - o.abono > 0 ? `Saldo ${clp(o.total - o.abono)}` : 'Pagada'}
                      </p>
                    </div>
                    <ArrowRight size={16} className="hidden text-muted sm:block" />
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === 'pagos' && (
          <Card className="overflow-hidden">
            {pagos.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={<CurrencyCircleDollar size={28} />} title="Sin pagos registrados" />
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-3 py-3">Orden</th>
                    <th className="px-3 py-3">Medio</th>
                    <th className="px-3 py-3">Usuario</th>
                    <th className="px-5 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pagos.map((pay) => {
                    const o = ordenes.find((x) => x.id === pay.orderId)
                    return (
                      <tr key={pay.id}>
                        <td className="px-5 py-3 text-[12px] text-ink-soft">{dateTime(pay.fecha)}</td>
                        <td className="tnum px-3 py-3 text-[12px] font-bold text-ink">{o?.folio}</td>
                        <td className="px-3 py-3 text-[12px] text-muted">{pay.medio}</td>
                        <td className="px-3 py-3 text-[12px] text-muted">{pay.usuario}</td>
                        <td className="tnum px-5 py-3 text-right text-[12px] font-bold text-ink">
                          {clp(pay.monto)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>

      {tab === 'resumen' && ordenes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ordenes.slice(0, 2).map((o) => (
            <Link key={o.id} to={`/imprimir/${o.id}/ot`}>
              <Button variant="outline" size="sm">
                <Printer size={15} />
                Imprimir {o.folio}
              </Button>
            </Link>
          ))}
          <Link to={`/imprimir/${ordenes[0].id}/receta`}>
            <Button variant="outline" size="sm">
              <FileText size={15} />
              Receta firmada
            </Button>
          </Link>
        </div>
      )}

      {canConsult && recetas.length > 0 && (
        <p className="mt-6 flex items-center gap-1.5 text-[11px] text-muted">
          <CheckCircle size={14} className="text-pine" />
          La receta anterior se carga automáticamente en la próxima consulta.
        </p>
      )}

      <div className="mt-6 flex items-center gap-2 text-[10px] text-muted">
        <Eye size={13} />
        Acceso a ficha registrado en auditoría · {timeShort(new Date().toISOString())}
      </div>
    </div>
  )
}

function PrescriptionCard({
  receta,
  patientId,
  canSell,
  onUse,
}: {
  receta: Prescription
  patientId: string
  canSell: boolean
  onUse?: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <div>
          <p className="text-[13px] font-bold text-ink">Receta del {dateFull(receta.fecha)}</p>
          <p className="text-[11px] text-muted">
            {receta.profesional} · Agudeza OD {receta.agudezaOD} / OI {receta.agudezaOI}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Link to={`/imprimir/${receta.id}/receta`}>
            <Button size="sm" variant="ghost">
              <Printer size={14} />
              Imprimir
            </Button>
          </Link>
          {canSell && (
            <Link to={`/cotizacion/${patientId}?receta=${receta.id}`} onClick={onUse}>
              <Button size="sm" variant="soft">
                Usar para cotizar
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="grid gap-0 sm:grid-cols-2 sm:divide-x sm:divide-line">
        <EyeTable label="Ojo derecho (OD)" eye={receta.od} />
        <EyeTable label="Ojo izquierdo (OI)" eye={receta.oi} />
      </div>
      {receta.observaciones && (
        <p className="border-t border-line bg-paper/60 px-5 py-2.5 text-[11px] text-ink-soft">
          {receta.observaciones}
        </p>
      )}
    </Card>
  )
}

function EyeTable({ label, eye }: { label: string; eye: EyeType }) {
  const rows = [
    ['Esfera', eye.esfera],
    ['Cilindro', eye.cilindro],
    ['Eje', eye.eje],
    ['Adición', eye.adicion],
    ['DP', eye.dp],
  ]
  return (
    <div className="px-5 py-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand">{label}</p>
      <dl className="grid grid-cols-5 gap-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[9px] font-semibold uppercase tracking-wide text-muted">{k}</dt>
            <dd className="tnum mt-0.5 text-[13px] font-bold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

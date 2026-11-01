import { motion } from 'framer-motion'
import {
  ArrowRight,
  ClipboardText,
  Clock,
  MagnifyingGlass,
  WarningCircle,
} from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Input, PageTitle, Stat, cx } from '../components/UI'
import { clp, dateShort, daysUntil } from '../lib/format'
import { useStore } from '../lib/store'
import { STATUS_LABEL, STATUS_ORDER, type OrderStatus } from '../lib/types'

const columnTone: Record<OrderStatus, 'neutral' | 'info' | 'amber' | 'copper' | 'pine'> = {
  recepcion: 'neutral',
  laboratorio: 'info',
  montaje: 'amber',
  lista: 'copper',
  entregada: 'pine',
}

export default function Orders() {
  const { role, orders, patient, advanceOrder } = useStore()
  const [query, setQuery] = useState('')
  const [onlyLate, setOnlyLate] = useState(false)

  const canAdvance = role !== 'tecnologo'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      const p = patient(o.patientId)
      if (onlyLate && (o.estado === 'entregada' || daysUntil(o.promesa) >= 0)) return false
      if (!q) return true
      return (
        o.folio.toLowerCase().includes(q) ||
        (p?.nombre.toLowerCase().includes(q) ?? false) ||
        o.cristal.tipo.toLowerCase().includes(q)
      )
    })
  }, [orders, patient, query, onlyLate])

  const active = orders.filter((o) => o.estado !== 'entregada')
  const late = active.filter((o) => daysUntil(o.promesa) < 0)
  const ready = orders.filter((o) => o.estado === 'lista')
  const pending = active.reduce((a, o) => a + Math.max(0, o.total - o.abono), 0)

  return (
    <div>
      <PageTitle
        title="Órdenes de trabajo"
        subtitle="El ciclo completo: recepción, laboratorio, montaje, aviso y entrega."
        action={
          <Link to="/pacientes">
            <Button variant="outline">
              <ClipboardText size={17} />
              Buscar paciente
            </Button>
          </Link>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="En curso" value={active.length} hint="Órdenes abiertas" icon={<ClipboardText size={18} />} />
        <Stat
          label="Atrasadas"
          value={late.length}
          tone={late.length > 0 ? 'danger' : 'ink'}
          hint="Pasaron la fecha prometida"
          icon={<WarningCircle size={18} />}
        />
        <Stat label="Listas" value={ready.length} tone="pine" hint="Pendientes de aviso y retiro" />
        <Stat label="Por cobrar" value={clp(pending)} tone="copper" hint="Saldo de órdenes abiertas" />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlass
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Folio, paciente o cristal…"
            aria-label="Buscar orden"
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setOnlyLate((v) => !v)}
          className={cx(
            'flex h-9 w-fit items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors',
            onlyLate
              ? 'border-danger bg-danger-soft text-danger'
              : 'border-line bg-surface text-muted hover:text-ink',
          )}
        >
          <Clock size={13} />
          Solo atrasadas
        </button>
        <p className="text-[11px] text-muted sm:ml-auto">
          {filtered.length} de {orders.length} órdenes
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-flow-col md:auto-cols-[280px] md:overflow-x-auto md:pb-3 md:scrollbar-thin xl:grid-flow-row xl:auto-cols-auto xl:grid-cols-5 xl:overflow-visible xl:pb-0">
        {STATUS_ORDER.map((status) => {
          const items = filtered.filter((o) => o.estado === status)
          return (
            <section key={status} className="flex flex-col">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[12px] font-bold text-ink">{STATUS_LABEL[status]}</h2>
                  <Badge tone={columnTone[status]}>{items.length}</Badge>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2 rounded-[14px] bg-ink/[0.025] p-2">
                {items.map((o) => {
                  const p = patient(o.patientId)
                  const days = daysUntil(o.promesa)
                  const lateOrder = days < 0 && o.estado !== 'entregada'
                  const index = STATUS_ORDER.indexOf(o.estado)
                  return (
                    <motion.article
                      key={o.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-[12px] border border-line bg-surface p-3.5 shadow-[0_1px_0_rgba(20,24,26,0.03)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/ordenes/${o.id}`} className="tnum text-[11px] font-bold text-ink hover:text-copper">
                          {o.folio}
                        </Link>
                        {lateOrder && <Badge tone="danger">Atrasada</Badge>}
                      </div>
                      <Link to={`/ordenes/${o.id}`} className="mt-1.5 block">
                        <p className="truncate text-[13px] font-bold text-ink">{p?.nombre}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {o.cristal.tipo} · {o.cristal.material}
                        </p>
                      </Link>

                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                        <span
                          className={cx(
                            'tnum flex items-center gap-1 text-[10px] font-semibold',
                            lateOrder ? 'text-danger' : 'text-muted',
                          )}
                        >
                          <Clock size={11} />
                          {dateShort(o.promesa)}
                        </span>
                        <span className="flex items-center gap-1">
                          {o.total - o.abono > 0 && (
                            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-danger/70">
                              Saldo
                            </span>
                          )}
                          <span
                            className={cx(
                              'tnum text-[10px] font-bold',
                              o.total - o.abono > 0 ? 'text-danger' : 'text-pine',
                            )}
                          >
                            {clp(o.total - o.abono > 0 ? o.total - o.abono : o.total)}
                          </span>
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        <Link to={`/ordenes/${o.id}`} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full">
                            Ver
                          </Button>
                        </Link>
                        {canAdvance && index < STATUS_ORDER.length - 1 && (
                          <Button
                            size="sm"
                            variant="soft"
                            className="w-9 shrink-0 px-0"
                            onClick={() => advanceOrder(o.id)}
                            title={`Pasar a ${STATUS_LABEL[STATUS_ORDER[index + 1]]}`}
                            aria-label={`Avanzar ${o.folio} a ${STATUS_LABEL[STATUS_ORDER[index + 1]]}`}
                          >
                            <ArrowRight size={14} weight="bold" />
                          </Button>
                        )}
                      </div>
                    </motion.article>
                  )
                })}

                {items.length === 0 && (
                  <div className="grid flex-1 place-items-center rounded-[10px] border border-dashed border-line-strong/70 px-3 py-8 text-center">
                    <p className="text-[11px] text-muted">Sin órdenes</p>
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {orders.length === 0 && (
        <div className="mt-4">
          <EmptyState
            icon={<ClipboardText size={28} />}
            title="Todavía no hay órdenes"
            description="Crea una cotización desde la ficha de un paciente para generar la primera."
          />
        </div>
      )}

      <Card className="mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-pine-soft text-pine">
          <Clock size={17} />
        </div>
        <p className="text-[12px] leading-relaxed text-ink-soft">
          <strong className="font-bold text-ink">El ciclo no termina en la entrega.</strong> La orden
          guarda la garantía legal de 6 meses, el consentimiento firmado y el historial completo para
          la ficha clínica.
        </p>
        <Link to="/cumplimiento" className="shrink-0 text-[11px] font-bold text-copper hover:underline">
          Ver cumplimiento
        </Link>
      </Card>
    </div>
  )
}

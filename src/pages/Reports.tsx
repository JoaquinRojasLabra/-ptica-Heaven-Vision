import { useMemo } from 'react'
import { DownloadSimple, TrendUp, WarningCircle } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageTitle,
  SectionHeader,
  Stat,
  cx,
} from '../components/UI'
import { clp, dateShort } from '../lib/format'
import { useStore } from '../lib/store'
import { STATUS_LABEL, STATUS_ORDER, type Order } from '../lib/types'

const orderCost = (o: Order) =>
  Math.round(o.cristal.precio * 0.45 + o.armazon.precio * 0.55)

export default function Reports() {
  const { orders, payments, purchases, warranty, patient } = useStore()

  const monthStart = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }, [])

  const inMonth = (iso: string) => new Date(iso).getTime() >= monthStart.getTime()

  const monthOrders = orders.filter((o) => inMonth(o.createdAt))
  const monthPayments = payments.filter((p) => inMonth(p.fecha))
  const monthPurchases = purchases.filter((p) => inMonth(p.fecha))

  const revenue = monthOrders.reduce((a, o) => a + o.total, 0)
  const collected = monthPayments.reduce((a, p) => a + p.monto, 0)
  const cost = monthOrders.reduce((a, o) => a + orderCost(o), 0)
  const margin = revenue - cost
  const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0
  const ticket = monthOrders.length > 0 ? Math.round(revenue / monthOrders.length) : 0
  const pendingBalance = orders
    .filter((o) => o.estado !== 'entregada')
    .reduce((a, o) => a + Math.max(0, o.total - o.abono), 0)

  const byStatus = STATUS_ORDER.map((estado) => ({
    estado,
    count: orders.filter((o) => o.estado === estado).length,
  }))

  const lensRanking = Object.entries(
    monthOrders.reduce<Record<string, { count: number; total: number }>>((acc, o) => {
      const key = `${o.cristal.tipo} · ${o.cristal.material}`
      const cur = acc[key] ?? { count: 0, total: 0 }
      acc[key] = { count: cur.count + 1, total: cur.total + o.cristal.precio }
      return acc
    }, {}),
  )
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)

  const openWarranty = warranty.filter((w) => w.estado === 'Abierto')

  const exportCsv = () => {
    const rows = [
      ['Reporte mensual Heaven Vision'],
      ['Periodo', monthStart.toLocaleDateString('es-CL'), new Date().toLocaleDateString('es-CL')],
      [],
      ['Pedido', 'Fecha', 'Paciente', 'Estado', 'Venta', 'Costo estimado', 'Margen'],
      ...monthOrders.map((o) => [
        o.folio,
        dateShort(o.createdAt),
        patient(o.patientId)?.nombre ?? '',
        STATUS_LABEL[o.estado],
        String(o.total),
        String(orderCost(o)),
        String(o.total - orderCost(o)),
      ]),
      [],
      ['Totales'],
      ['Ventas del mes', String(revenue)],
      ['Cobrado', String(collected)],
      ['Costo estimado', String(cost)],
      ['Margen bruto', String(margin)],
      ['Compras del mes', String(monthPurchases.reduce((a, p) => a + p.monto, 0))],
      ['Saldo por cobrar', String(pendingBalance)],
    ]
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `heaven-vision-reporte-${new Date().toISOString().slice(0, 7)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageTitle
        title="Reportes"
        subtitle="Cómo va el mes: ventas, margen por pedido y lo que falta cobrar."
        action={
          <Button variant="outline" onClick={exportCsv}>
            <DownloadSimple size={17} weight="bold" />
            Exportar CSV
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat
          label="Ventas del mes"
          value={clp(revenue)}
          hint={`${monthOrders.length} pedidos · ticket ${clp(ticket)}`}
          icon={<TrendUp size={18} />}
        />
        <Stat label="Cobrado" value={clp(collected)} tone="pine" hint="Incluye pagos de pedidos anteriores" />
        <Stat
          label="Margen bruto"
          value={clp(margin)}
          tone="brand"
          hint={`${marginPct}% sobre la venta`}
        />
        <Stat label="Saldo por cobrar" value={clp(pendingBalance)} tone="danger" hint="Pedidos abiertos" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
            <SectionHeader
              title="Margen por pedido"
              description="Costo estimado según cristal y armazón. Sirve para decidir precios."
            />
          </div>
          {monthOrders.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState title="Sin pedidos este mes" description="Aún no hay ventas registradas." />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-line bg-surface-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-2 font-semibold">Pedido</th>
                    <th className="px-3 py-2 font-semibold">Paciente</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                    <th className="px-3 py-2 text-right font-semibold">Venta</th>
                    <th className="px-3 py-2 text-right font-semibold">Costo</th>
                    <th className="px-5 py-2 text-right font-semibold">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {monthOrders.map((o) => {
                    const c = orderCost(o)
                    const m = o.total - c
                    const pct = o.total > 0 ? Math.round((m / o.total) * 100) : 0
                    return (
                      <tr key={o.id} className="transition-colors hover:bg-surface-2">
                        <td className="whitespace-nowrap px-5 py-3">
                          <Link
                            to={`/ordenes/${o.id}`}
                            className="tnum text-[12px] font-semibold text-ink hover:text-brand"
                          >
                            {o.folio}
                          </Link>
                          <p className="text-[10.5px] text-muted">{dateShort(o.createdAt)}</p>
                        </td>
                        <td className="max-w-[170px] truncate px-3 py-3 text-[12.5px] text-ink">
                          {patient(o.patientId)?.nombre ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <Badge tone={o.estado === 'entregada' ? 'pine' : 'brand'}>
                            {STATUS_LABEL[o.estado]}
                          </Badge>
                        </td>
                        <td className="tnum whitespace-nowrap px-3 py-3 text-right text-[12.5px] font-medium text-ink">
                          {clp(o.total)}
                        </td>
                        <td className="tnum whitespace-nowrap px-3 py-3 text-right text-[12px] text-muted">
                          {clp(c)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right">
                          <span className="tnum text-[12.5px] font-semibold text-pine">{clp(m)}</span>
                          <span className="ml-1.5 text-[10.5px] text-muted">{pct}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line bg-surface-2">
                    <td colSpan={3} className="px-5 py-2.5 text-[11.5px] font-semibold text-ink-soft">
                      Total del mes
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-[12px] font-semibold text-ink">
                      {clp(revenue)}
                    </td>
                    <td className="tnum px-3 py-2.5 text-right text-[12px] text-muted">{clp(cost)}</td>
                    <td className="tnum px-5 py-2.5 text-right text-[12.5px] font-bold text-pine">
                      {clp(margin)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionHeader title="Pedidos por estado" description="Foto del taller hoy." />
            <ul className="mt-4 space-y-2.5">
              {byStatus.map((row) => {
                const total = orders.length || 1
                return (
                  <li key={row.estado}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="font-medium text-ink-soft">{STATUS_LABEL[row.estado]}</span>
                      <span className="tnum font-semibold text-ink">{row.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                      <div
                        className={cx(
                          'h-full rounded-full',
                          row.estado === 'entregada' ? 'bg-pine' : 'bg-brand',
                        )}
                        style={{ width: `${Math.round((row.count / total) * 100)}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Cristales más vendidos" />
            {lensRanking.length === 0 ? (
              <p className="mt-3 text-[12.5px] text-muted">Sin ventas este mes.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {lensRanking.map(([name, data]) => (
                  <li key={name} className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="min-w-0 truncate text-ink-soft">{name}</span>
                    <span className="tnum shrink-0 font-semibold text-ink">
                      {data.count} · {clp(data.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <SectionHeader title="Postventa" />
              <Link to="/postventa" className="text-[12px] font-semibold text-brand hover:text-brand-deep">
                Ver casos
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-[12px] bg-surface-2 p-3">
              <span
                className={cx(
                  'grid size-9 shrink-0 place-items-center rounded-[10px]',
                  openWarranty.length > 0 ? 'bg-amber-soft text-amber' : 'bg-pine-soft text-pine',
                )}
              >
                <WarningCircle size={18} weight="duotone" />
              </span>
              <div>
                <p className="tnum text-[18px] font-bold leading-none text-ink">
                  {openWarranty.length}
                </p>
                <p className="text-[11.5px] text-muted">casos abiertos de garantía</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        El costo es estimado (45% del cristal + 55% del armazón) para la demo. En producción se toma
        el costo real de cada compra registrada.
      </p>
    </div>
  )
}

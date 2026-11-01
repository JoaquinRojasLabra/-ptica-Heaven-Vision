import { useState } from 'react'
import {
  ArrowRight,
  CashRegister,
  CheckCircle,
  CurrencyCircleDollar,
  Receipt,
  WarningCircle,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageTitle,
  Stat,
  cx,
} from '../components/UI'
import { clp, isToday, timeShort } from '../lib/format'
import { useStore } from '../lib/store'
import { ROLE_PERSON } from '../lib/types'

const MEDIOS = ['Efectivo', 'Débito', 'Crédito', 'Transferencia'] as const

export default function Cash() {
  const { role, payments, orders, patient } = useStore()
  const [klap, setKlap] = useState('')
  const [closed, setClosed] = useState(false)

  const today = payments
    .filter((p) => isToday(p.fecha))
    .filter((p) => (role === 'vendedora' ? p.usuario === ROLE_PERSON.vendedora : true))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  const total = today.reduce((a, p) => a + p.monto, 0)
  const byMedio = MEDIOS.map((m) => ({
    medio: m,
    total: today.filter((p) => p.medio === m).reduce((a, p) => a + p.monto, 0),
    count: today.filter((p) => p.medio === m).length,
  }))
  const efectivo = byMedio.find((m) => m.medio === 'Efectivo')?.total ?? 0
  const klapNumber = Number(klap || 0)
  const difference = klapNumber - total
  const openOrders = orders.filter((o) => o.estado !== 'entregada')
  const pending = openOrders.reduce((a, o) => a + Math.max(0, o.total - o.abono), 0)

  return (
    <div>
      <PageTitle
        title="Caja y ventas"
        subtitle="Cierre diario que cuadra con el POS Klap. El sistema registra; la boleta la emite Klap."
        action={<Badge tone={closed ? 'pine' : 'amber'} dot>{closed ? 'Caja cerrada' : 'Caja abierta'}</Badge>}
      />

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Recaudado hoy" value={clp(total)} hint={`${today.length} movimientos`} icon={<CurrencyCircleDollar size={18} />} />
        <Stat label="Efectivo" value={clp(efectivo)} hint="Se cuenta en caja" tone="pine" icon={<CashRegister size={18} />} />
        <Stat label="Por cobrar" value={clp(pending)} hint={`${openOrders.length} órdenes abiertas`} tone="copper" />
        <Stat label="Ticket promedio" value={clp(today.length ? total / today.length : 0)} hint="Por movimiento" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-xl text-ink">Movimientos de hoy</h2>
              <Badge tone="outline">{role === 'vendedora' ? 'Mi cierre' : 'Todo el local'}</Badge>
            </div>

            {today.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Receipt size={26} />}
                  title="Sin movimientos hoy"
                  description="Los abonos y pagos aparecerán acá en cuanto se registren."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                      <th className="px-5 py-3">Hora</th>
                      <th className="px-3 py-3">Orden</th>
                      <th className="px-3 py-3">Paciente</th>
                      <th className="px-3 py-3">Medio</th>
                      <th className="px-5 py-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {today.map((pay) => {
                      const o = orders.find((x) => x.id === pay.orderId)
                      return (
                        <tr key={pay.id} className="transition-colors hover:bg-paper/60">
                          <td className="tnum px-5 py-3 text-[12px] text-muted">{timeShort(pay.fecha)}</td>
                          <td className="px-3 py-3">
                            <Link
                              to={`/ordenes/${pay.orderId}`}
                              className="tnum text-[12px] font-bold text-ink hover:text-copper"
                            >
                              {o?.folio ?? '—'}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-[12px] text-ink-soft">
                            {o ? patient(o.patientId)?.nombre : '—'}
                          </td>
                          <td className="px-3 py-3">
                            <Badge tone={pay.medio === 'Efectivo' ? 'pine' : 'info'}>{pay.medio}</Badge>
                          </td>
                          <td className="tnum px-5 py-3 text-right text-[12px] font-bold text-ink">
                            {clp(pay.monto)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Órdenes con saldo</h2>
              <Link to="/ordenes" className="flex items-center gap-1 text-[11px] font-bold text-copper hover:underline">
                Ver órdenes <ArrowRight size={12} />
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {openOrders
                .filter((o) => o.total - o.abono > 0)
                .map((o) => (
                  <li key={o.id} className="flex items-center gap-3 py-2.5">
                    <Link to={`/ordenes/${o.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-ink">{patient(o.patientId)?.nombre}</p>
                      <p className="tnum text-[10px] text-muted">{o.folio}</p>
                    </Link>
                    <span className="tnum text-[12px] font-bold text-danger">{clp(o.total - o.abono)}</span>
                  </li>
                ))}
              {openOrders.filter((o) => o.total - o.abono > 0).length === 0 && (
                <li className="py-4 text-center text-[12px] text-muted">No hay saldos pendientes.</li>
              )}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-xl text-ink">Cuadre del día</h2>
              <p className="mt-0.5 text-[11px] text-muted">Compara lo registrado con el POS Klap.</p>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {byMedio.map((m) => (
                  <div key={m.medio} className="flex items-center justify-between text-[12px]">
                    <span className="text-muted">
                      {m.medio} <span className="text-[10px]">({m.count})</span>
                    </span>
                    <span className="tnum font-semibold text-ink">{clp(m.total)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-line pt-2">
                  <span className="font-bold text-ink">Total sistema</span>
                  <span className="tnum text-[15px] font-bold text-ink">{clp(total)}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <Field label="Total del POS Klap" hint="del cierre impreso">
                  <Input
                    type="number"
                    value={klap}
                    onChange={(e) => {
                      setKlap(e.target.value)
                      setClosed(false)
                    }}
                    placeholder="0"
                  />
                </Field>
                <div
                  className={cx(
                    'mt-3 flex items-center justify-between rounded-[10px] px-3 py-2.5',
                    klap === ''
                      ? 'bg-paper/80'
                      : difference === 0
                        ? 'bg-pine-soft'
                        : 'bg-danger-soft',
                  )}
                >
                  <span className="text-[11px] font-semibold text-ink-soft">Diferencia</span>
                  <span
                    className={cx(
                      'tnum text-[15px] font-bold',
                      klap === '' ? 'text-muted' : difference === 0 ? 'text-pine' : 'text-danger',
                    )}
                  >
                    {klap === '' ? '—' : clp(difference)}
                  </span>
                </div>

                {klap !== '' && difference !== 0 && (
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-danger">
                    <WarningCircle size={14} className="mt-0.5 shrink-0" />
                    Revisa los movimientos antes de cerrar. No se puede cerrar con diferencia.
                  </p>
                )}

                <Button
                  variant={closed ? 'primary' : 'copper'}
                  className="mt-4 w-full"
                  disabled={klap === '' || difference !== 0 || closed}
                  onClick={() => setClosed(true)}
                >
                  {closed ? (
                    <>
                      <CheckCircle size={16} /> Caja cerrada
                    </>
                  ) : (
                    <>
                      <CashRegister size={16} /> Cerrar caja del día
                    </>
                  )}
                </Button>

                {closed && (
                  <p className="mt-2 text-center text-[10px] text-muted">
                    Cierre guardado en auditoría · {timeShort(new Date().toISOString())}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-xl text-ink">Cómo cuadra</h2>
            <ol className="mt-3 space-y-2.5">
              {[
                'El sistema registra cada abono y pago con su medio.',
                'Klap emite la boleta o factura y queda enlazado al SII.',
                'Al final del día se compara el total del POS con el sistema.',
                'Si cuadra, se cierra la caja. Si no, se revisa movimiento por movimiento.',
              ].map((text, i) => (
                <li key={text} className="flex gap-2.5 text-[11px] leading-relaxed text-ink-soft">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink/[0.06] text-[10px] font-bold text-ink">
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-[8px] bg-info-soft/60 px-2.5 py-2 text-[10px] leading-relaxed text-info">
              El sistema no emite documentos tributarios. Esa responsabilidad sigue en Klap, como
              exige el SII.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

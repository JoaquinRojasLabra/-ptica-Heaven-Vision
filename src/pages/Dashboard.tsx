import { motion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  Flask,
  Package,
  Plus,
  UsersThree,
  WarningCircle,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, PageTitle, Stat, cx } from '../components/UI'
import { clp, dateLong, elapsed, isToday, minutesSince, timeShort } from '../lib/format'
import { useStore } from '../lib/store'
import { ROLE_LABEL, STATUS_LABEL, type Order } from '../lib/types'

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

function statusTone(order: Order) {
  if (order.estado === 'entregada') return 'pine' as const
  if (order.estado === 'lista') return 'copper' as const
  if (order.estado === 'laboratorio') return 'info' as const
  if (order.estado === 'montaje') return 'amber' as const
  return 'neutral' as const
}

export default function Dashboard() {
  const { role, patients, orders, inventory, waiting, payments, audit, setWaitingStatus, patient, prescription } =
    useStore()
  const navigate = useNavigate()

  const waitingNow = waiting.filter((w) => w.estado === 'esperando')
  const inLab = orders.filter((o) => o.estado === 'laboratorio' || o.estado === 'montaje')
  const ready = orders.filter((o) => o.estado === 'lista')
  const salesToday = payments.filter((p) => isToday(p.fecha)).reduce((a, p) => a + p.monto, 0)
  const lowStock = inventory.filter((i) => i.stock <= i.minimo)
  const overdue = orders.filter(
    (o) => o.estado !== 'entregada' && new Date(o.promesa).getTime() < Date.now(),
  )
  const todayDeliveries = orders.filter((o) => isToday(o.promesa) && o.estado !== 'entregada')
  const recentAudit = [...audit].slice(-4).reverse()

  const canAttend = role === 'tecnologo' || role === 'admin'
  const canSell = role === 'vendedora' || role === 'admin'

  const attend = (waitingId: string, patientId: string) => {
    setWaitingStatus(waitingId, 'en_consulta')
    navigate(`/consulta/${patientId}`)
  }

  return (
    <div>
      <PageTitle
        title="Hoy en la óptica"
        subtitle={`${dateLong(new Date().toISOString())} · ${ROLE_LABEL[role]}`}
        action={
          <>
            <Link to="/sala">
              <Button variant="outline">
                <UsersThree size={17} />
                Ver sala
              </Button>
            </Link>
            {canSell && (
              <Link to="/pacientes?nuevo=1">
                <Button variant="copper">
                  <Plus size={17} weight="bold" />
                  Nueva atención
                </Button>
              </Link>
            )}
          </>
        }
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <motion.div variants={item}>
          <Stat
            label="Pacientes en espera"
            value={waitingNow.length}
            tone={waitingNow.length > 2 ? 'copper' : 'ink'}
            icon={<UsersThree size={19} />}
            hint={
              waitingNow.length > 0
                ? `El más antiguo espera ${elapsed(waitingNow[0].hora)}`
                : 'Sin pacientes esperando'
            }
          />
        </motion.div>
        <motion.div variants={item}>
          <Stat
            label="En laboratorio"
            value={inLab.length}
            icon={<Flask size={19} />}
            hint={`${orders.filter((o) => o.estado === 'laboratorio').length} en lab · ${orders.filter((o) => o.estado === 'montaje').length} en montaje`}
          />
        </motion.div>
        <motion.div variants={item}>
          <Stat
            label="Listas para retiro"
            value={ready.length}
            tone="pine"
            icon={<Package size={19} />}
            hint="Pacientes por avisar"
          />
        </motion.div>
        <motion.div variants={item}>
          <Stat
            label="Ventas de hoy"
            value={clp(salesToday)}
            icon={<CurrencyCircleDollar size={19} />}
            hint={`${payments.filter((p) => isToday(p.fecha)).length} movimientos registrados`}
          />
        </motion.div>
      </motion.div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl text-ink">Sala de espera</h2>
                <span className="flex items-center gap-1.5 rounded-full bg-pine-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pine">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-pine opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-pine" />
                  </span>
                  En vivo
                </span>
              </div>
              <Link
                to="/sala"
                className="flex items-center gap-1 text-[12px] font-bold text-copper hover:underline"
              >
                Ver todo <ArrowRight size={13} />
              </Link>
            </div>

            {waitingNow.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Nadie esperando ahora"
                  description="Cuando registres una llegada, aparecerá acá y el tecnólogo recibirá el aviso."
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {waitingNow.slice(0, 4).map((w) => {
                  const p = patient(w.patientId)
                  const mins = minutesSince(w.hora)
                  const tone = mins >= 20 ? 'danger' : mins >= 10 ? 'amber' : 'pine'
                  return (
                    <li key={w.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-[12px] font-bold text-pine">
                        {p?.nombre
                          .split(' ')
                          .slice(0, 2)
                          .map((x) => x[0])
                          .join('')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-ink">{p?.nombre}</p>
                        <p className="truncate text-[12px] text-muted">{w.motivo}</p>
                      </div>
                      <Badge tone={tone} dot>
                        {elapsed(w.hora)}
                      </Badge>
                      {canAttend ? (
                        <Button size="sm" variant="soft" onClick={() => attend(w.id, w.patientId)}>
                          Atender
                        </Button>
                      ) : (
                        <Link to={`/pacientes/${w.patientId}`}>
                          <Button size="sm" variant="ghost">
                            Ficha
                          </Button>
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-xl text-ink">Órdenes en curso</h2>
              <Link
                to="/ordenes"
                className="flex items-center gap-1 text-[12px] font-bold text-copper hover:underline"
              >
                Todas <ArrowRight size={13} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    <th className="px-5 py-2.5">Folio</th>
                    <th className="px-3 py-2.5">Paciente</th>
                    <th className="px-3 py-2.5">Cristal</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-5 py-2.5 text-right">Promesa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders
                    .filter((o) => o.estado !== 'entregada')
                    .slice(0, 5)
                    .map((o) => {
                      const p = patient(o.patientId)
                      const late = new Date(o.promesa).getTime() < Date.now()
                      return (
                        <tr key={o.id} className="group transition-colors hover:bg-paper/60">
                          <td className="whitespace-nowrap px-5 py-3">
                            <Link to={`/ordenes/${o.id}`} className="tnum text-[12px] font-bold text-ink group-hover:text-copper">
                              {o.folio}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-[13px] font-semibold text-ink">{p?.nombre}</td>
                          <td className="px-3 py-3 text-[12px] text-muted">
                            {o.cristal.tipo} · {o.cristal.material}
                          </td>
                          <td className="px-3 py-3">
                            <Badge tone={statusTone(o)}>{STATUS_LABEL[o.estado]}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right">
                            <span className={cx('tnum text-[12px] font-semibold', late ? 'text-danger' : 'text-muted')}>
                              {late ? 'Atrasada' : timeShort(o.promesa)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Alertas</h2>
              <Badge tone={lowStock.length + overdue.length > 0 ? 'copper' : 'pine'}>
                {lowStock.length + overdue.length + ready.length} activas
              </Badge>
            </div>
            <ul className="mt-4 space-y-2">
              <AlertRow
                to="/inventario"
                icon={<WarningCircle size={17} />}
                tone="danger"
                title="Stock bajo"
                detail={`${lowStock.length} combinaciones en o bajo el mínimo`}
                count={lowStock.length}
              />
              <AlertRow
                to="/ordenes"
                icon={<Clock size={17} />}
                tone="amber"
                title="Órdenes atrasadas"
                detail="Pasaron la fecha de entrega prometida"
                count={overdue.length}
              />
              <AlertRow
                to="/ordenes"
                icon={<CheckCircle size={17} />}
                tone="pine"
                title="Lentes listos"
                detail="Pacientes pendientes de aviso y retiro"
                count={ready.length}
              />
              <AlertRow
                to="/sala"
                icon={<WhatsappLogo size={17} />}
                tone="info"
                title="Pacientes esperando"
                detail="Aviso en pantalla al tecnólogo"
                count={waitingNow.length}
              />
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Agenda de hoy</h2>
              <Badge tone="outline">{todayDeliveries.length} entregas</Badge>
            </div>
            <ul className="mt-4 space-y-3">
              {todayDeliveries.length === 0 && (
                <li className="rounded-[10px] bg-paper/70 px-3 py-6 text-center text-[12px] text-muted">
                  Sin entregas agendadas para hoy.
                </li>
              )}
              {todayDeliveries.map((o) => (
                <li key={o.id} className="flex gap-3">
                  <div className="w-12 shrink-0 pt-0.5 text-right">
                    <p className="tnum text-[11px] font-bold text-ink">{timeShort(o.promesa)}</p>
                  </div>
                  <span className="mt-1 h-full w-px bg-line" />
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="truncate text-[13px] font-bold text-ink">{patient(o.patientId)?.nombre}</p>
                    <p className="text-[11px] text-muted">Retiro · {o.cristal.tipo}</p>
                  </div>
                </li>
              ))}
              <li className="flex gap-3">
                <div className="w-12 shrink-0 pt-0.5 text-right">
                  <p className="tnum text-[11px] font-bold text-ink">16:30</p>
                </div>
                <span className="mt-1 h-full w-px bg-line" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ink">Cierre de caja</p>
                  <p className="text-[11px] text-muted">Cuadre con POS Klap</p>
                </div>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Actividad reciente</h2>
              <Link to="/cumplimiento" className="text-[11px] font-bold text-copper hover:underline">
                Auditoría
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {recentAudit.map((a) => (
                <li key={a.id} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-copper" />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-ink">{a.accion}</p>
                    <p className="truncate text-[11px] text-muted">
                      {a.detalle} · {timeShort(a.fecha)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted">
        Demo con datos de ejemplo · {patients.length} pacientes · {orders.length} órdenes ·{' '}
        {prescription(orders[0]?.prescriptionId ?? '')?.profesional ?? 'Julio Barrera'} en consulta
      </p>
    </div>
  )
}

function AlertRow({
  to,
  icon,
  tone,
  title,
  detail,
  count,
}: {
  to: string
  icon: React.ReactNode
  tone: 'danger' | 'amber' | 'pine' | 'info'
  title: string
  detail: string
  count: number
}) {
  const toneClass = {
    danger: 'bg-danger-soft text-danger',
    amber: 'bg-amber-soft text-amber',
    pine: 'bg-pine-soft text-pine',
    info: 'bg-info-soft text-info',
  }[tone]
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors hover:bg-paper/70"
      >
        <span className={cx('grid size-9 shrink-0 place-items-center rounded-[9px]', toneClass)}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-ink">{title}</span>
          <span className="block truncate text-[11px] text-muted">{detail}</span>
        </span>
        <span className="tnum font-display text-xl text-ink">{count}</span>
      </Link>
    </li>
  )
}

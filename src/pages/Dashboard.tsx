import { motion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  Armchair,
  CheckCircle,
  ClipboardText,
  Clock,
  CurrencyCircleDollar,
  Eyeglasses,
  Eye,
  Flask,
  Package,
  UsersThree,
  WarningCircle,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { clp, elapsed, isToday, timeShort } from '../lib/format'
import { ROLE_PERSON, STATUS_LABEL, type Order } from '../lib/types'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeader,
  cx,
} from '../components/UI'

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

const statusTone = (o: Order) =>
  o.estado === 'entregada'
    ? 'pine'
    : o.estado === 'lista'
      ? 'brand'
      : o.estado === 'laboratorio'
        ? 'info'
        : o.estado === 'montaje'
          ? 'amber'
          : 'neutral'

function ActionCard({
  to,
  icon,
  title,
  description,
  count,
}: {
  to: string
  icon: React.ReactNode
  title: string
  description: string
  count?: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-[16px] border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lift sm:p-5"
    >
      <div className="flex items-center gap-3 sm:hidden">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] text-ink">{title}</p>
          <p className="mt-0.5 line-clamp-1 text-[12px] leading-relaxed text-muted">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {count && <Badge tone="neutral">{count}</Badge>}
          <ArrowRight size={15} className="text-muted/60" />
        </div>
      </div>

      <div className="hidden sm:flex sm:h-full sm:flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
            {icon}
          </span>
          {count && <Badge tone="neutral">{count}</Badge>}
        </div>
        <p className="mt-4 font-display text-[16px] text-ink">{title}</p>
        <p className="mt-1 flex-1 text-[12.5px] leading-relaxed text-muted">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand">
          Empezar
          <ArrowRight
            size={14}
            weight="bold"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  )
}

function JourneyStep({
  label,
  value,
  tone,
  last,
}: {
  label: string
  value: number
  tone: string
  last?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
        <span
          className={cx(
            'tnum grid size-8 place-items-center rounded-[10px] text-[13px] font-bold',
            value > 0 ? tone : 'bg-ink/[0.05] text-muted',
          )}
        >
          {value}
        </span>
        <span className="truncate text-[10.5px] font-semibold text-muted">{label}</span>
      </div>
      {!last && <span className="mb-4 h-px min-w-3 flex-1 bg-line" />}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { role, patients, orders, waiting, inventory, payments, audit, setWaitingStatus } = useStore()

  const waitingNow = waiting.filter((w) => w.estado === 'esperando')
  const inConsult = waiting.filter((w) => w.estado === 'en_consulta')
  const inLab = orders.filter((o) => o.estado === 'laboratorio' || o.estado === 'montaje')
  const ready = orders.filter((o) => o.estado === 'lista')
  const lowStock = inventory.filter((i) => i.stock <= i.minimo)
  const overdue = orders.filter(
    (o) => o.estado !== 'entregada' && new Date(o.promesa).getTime() < Date.now(),
  )
  const deliveredToday = orders.filter((o) => {
    const last = o.historial[o.historial.length - 1]
    return o.estado === 'entregada' && last?.estado === 'entregada' && isToday(last.fecha)
  })
  const salesToday = payments.filter((p) => isToday(p.fecha)).reduce((a, p) => a + p.monto, 0)
  const pendingBalance = orders
    .filter((o) => o.estado !== 'entregada')
    .reduce((a, o) => a + Math.max(0, o.total - o.abono), 0)
  const activeOrders = orders.filter((o) => o.estado !== 'entregada')
  const recentAudit = [...audit].reverse().slice(0, 4)

  const canAttend = role === 'tecnologo' || role === 'admin'
  const canSeeMoney = role === 'vendedora' || role === 'admin'
  const person = ROLE_PERSON[role]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  const attend = (waitingId: string, patientId: string) => {
    setWaitingStatus(waitingId, 'en_consulta')
    navigate(`/consulta/${patientId}`)
  }

  const actions =
    role === 'tecnologo'
      ? [
          {
            to: '/sala?nuevo=1',
            icon: <Armchair size={20} weight="duotone" />,
            title: 'Registrar llegada',
            description: 'Anota quién llegó. La sala se actualiza al instante en el mostrador.',
            count: waitingNow.length > 0 ? `${waitingNow.length} esperando` : undefined,
          },
          {
            to: '/sala',
            icon: <Eye size={20} weight="duotone" />,
            title: 'Atender la sala',
            description: 'Revisa quién está esperando y comienza el examen visual.',
            count: waitingNow.length > 0 ? `${waitingNow.length} por atender` : undefined,
          },
          {
            to: '/pacientes',
            icon: <ClipboardText size={20} weight="duotone" />,
            title: 'Ver fichas clínicas',
            description: 'Recetas, exámenes anteriores y antecedentes de cada paciente.',
            count: `${patients.length} pacientes`,
          },
        ]
      : role === 'montajista'
        ? [
            {
              to: '/ordenes',
              icon: <Package size={20} weight="duotone" />,
              title: 'Ver el taller',
              description: 'Pedidos en laboratorio, en montaje o listos para retirar.',
              count: activeOrders.length > 0 ? `${activeOrders.length} en curso` : undefined,
            },
            {
              to: '/inventario',
              icon: <Flask size={20} weight="duotone" />,
              title: 'Revisar cristales',
              description: 'Stock disponible y combinaciones que hay que reponer.',
              count: lowStock.length > 0 ? `${lowStock.length} bajo mínimo` : undefined,
            },
            {
              to: '/ordenes',
              icon: <CheckCircle size={20} weight="duotone" />,
              title: 'Marcar avances',
              description: 'Actualiza el estado del trabajo para avisar al paciente.',
              count: ready.length > 0 ? `${ready.length} listos` : undefined,
            },
          ]
        : [
            {
              to: '/sala?nuevo=1',
              icon: <Armchair size={20} weight="duotone" />,
              title: 'Registrar llegada',
              description: 'Anota quién llegó y cuánto lleva esperando. El tecnólogo lo ve al instante.',
              count: waitingNow.length > 0 ? `${waitingNow.length} esperando` : undefined,
            },
            {
              to: '/pacientes',
              icon: <Eyeglasses size={20} weight="duotone" />,
              title: 'Vender lentes',
              description:
                'Busca al paciente, elige cristales y armazón, y deja el pedido listo para el taller.',
              count: activeOrders.length > 0 ? `${activeOrders.length} en curso` : undefined,
            },
            {
              to: '/ordenes',
              icon: <Package size={20} weight="duotone" />,
              title: 'Entregar pedidos',
              description:
                'Revisa los lentes listos, avisa al paciente por WhatsApp y registra la entrega.',
              count: ready.length > 0 ? `${ready.length} listos` : undefined,
            },
          ]

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.header variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.13em] text-brand">
            Mostrador
          </p>
          <h1 className="mt-1.5 font-display text-[30px] leading-[1.05] text-ink sm:text-[40px]">
            {greeting}, {person.split(' ')[0]}
          </h1>
          <p className="mt-1.5 text-[14px] text-muted">
            Esto es lo que está pasando en la óptica ahora mismo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role === 'montajista' ? (
            <Link to="/ordenes">
              <Button size="md">
                <Package size={17} weight="bold" />
                Ver el taller
              </Button>
            </Link>
          ) : (
            <Link to="/sala?nuevo=1">
              <Button size="md">
                <UsersThree size={17} weight="bold" />
                Llegó un paciente
              </Button>
            </Link>
          )}
          <Link to={role === 'montajista' ? '/inventario' : '/pacientes'}>
            <Button variant="outline" size="md">
              {role === 'montajista' ? 'Ver inventario' : 'Buscar ficha'}
            </Button>
          </Link>
        </div>
      </motion.header>

      <motion.div variants={item} className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <ActionCard key={action.title} {...action} />
        ))}
      </motion.div>

      <motion.div variants={item}>
        <Card className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <p className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted lg:block">
              Recorrido de hoy
            </p>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-thin lg:gap-2">
              <JourneyStep
                label="En sala"
                value={waitingNow.length}
                tone="bg-brand-soft text-brand-deep"
              />
              <JourneyStep
                label="En examen"
                value={inConsult.length}
                tone="bg-info-soft text-info"
              />
              <JourneyStep
                label="En taller"
                value={inLab.length}
                tone="bg-amber-soft text-amber"
              />
              <JourneyStep
                label="Listos"
                value={ready.length}
                tone="bg-pine-soft text-pine"
              />
              <JourneyStep
                label="Entregados"
                value={deliveredToday.length}
                tone="bg-ink/[0.07] text-ink"
                last
              />
            </div>
            {canSeeMoney && (
              <div className="hidden shrink-0 items-center gap-1.5 border-l border-line pl-3 sm:flex">
                <CurrencyCircleDollar size={15} className="text-pine" />
                <span className="tnum text-[12.5px] font-semibold text-ink">
                  {clp(salesToday)}
                </span>
                <span className="text-[11px] text-muted">hoy</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {role !== 'montajista' && (
          <motion.section variants={item}>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
                <SectionHeader
                  title="Sala de espera"
                  description={
                    waitingNow.length > 0
                      ? 'Estas personas están esperando ser atendidas.'
                      : 'No hay nadie esperando en este momento.'
                  }
                />
                <Link
                  to="/sala"
                  className="shrink-0 text-[12.5px] font-semibold text-brand hover:text-brand-deep"
                >
                  Ver sala
                </Link>
              </div>

              {waitingNow.length === 0 ? (
                <div className="px-5 pb-5">
                  <EmptyState
                    icon={<Armchair size={20} weight="duotone" />}
                    title="La sala está vacía"
                    description="Cuando llegue un paciente, regístralo y aparecerá aquí con su tiempo de espera."
                    action={
                      <Link to="/sala?nuevo=1">
                        <Button size="sm">Registrar llegada</Button>
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {waitingNow.slice(0, 4).map((w) => {
                    const p = patients.find((x) => x.id === w.patientId)
                    if (!p) return null
                    return (
                      <li
                        key={w.id}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                      >
                        <Avatar name={p.nombre} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold text-ink">{p.nombre}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted">
                            <Clock size={12} />
                            Esperando hace {elapsed(w.hora)}
                          </p>
                        </div>
                        {canAttend ? (
                          <Button
                            size="sm"
                            variant="soft"
                            onClick={() => attend(w.id, p.id)}
                            className="shrink-0"
                          >
                            Atender
                            <ArrowRight size={13} weight="bold" />
                          </Button>
                        ) : (
                          <Link to={`/pacientes/${p.id}`} className="shrink-0">
                            <Button size="sm" variant="ghost">
                              Ver ficha
                            </Button>
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </motion.section>
          )}

          {role !== 'tecnologo' && (
          <motion.section variants={item}>
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
                <SectionHeader
                  title="Pedidos en curso"
                  description="Lentes que todavía no llegan a manos del paciente."
                />
                <Link
                  to="/ordenes"
                  className="shrink-0 text-[12.5px] font-semibold text-brand hover:text-brand-deep"
                >
                  Ver todos
                </Link>
              </div>

              {activeOrders.length === 0 ? (
                <div className="px-5 pb-5">
                  <EmptyState
                    icon={<CheckCircle size={20} weight="duotone" />}
                    title="No hay pedidos pendientes"
                    description="Todo lo que se vendió ya fue entregado."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead>
                      <tr className="border-y border-line bg-surface-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                        <th className="px-5 py-2 font-semibold">Pedido</th>
                        <th className="px-3 py-2 font-semibold">Paciente</th>
                        <th className="px-3 py-2 font-semibold">Estado</th>
                        <th className="px-3 py-2 font-semibold">Entrega</th>
                        {role !== 'montajista' && (
                          <th className="px-5 py-2 text-right font-semibold">Saldo</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {activeOrders.slice(0, 5).map((o) => {
                        const p = patients.find((x) => x.id === o.patientId)
                        const saldo = Math.max(0, o.total - o.abono)
                        const late = new Date(o.promesa).getTime() < Date.now()
                        return (
                          <tr key={o.id} className="group transition-colors hover:bg-surface-2">
                            <td className="whitespace-nowrap px-5 py-3">
                              <Link
                                to={`/ordenes/${o.id}`}
                                className="tnum text-[12px] font-semibold text-ink group-hover:text-brand"
                              >
                                {o.folio}
                              </Link>
                            </td>
                            <td className="px-3 py-3">
                              <Link
                                to={`/ordenes/${o.id}`}
                                className="block max-w-[180px] truncate text-[13px] font-medium text-ink"
                              >
                                {p?.nombre ?? '—'}
                              </Link>
                            </td>
                            <td className="px-3 py-3">
                              <Badge tone={statusTone(o)}>{STATUS_LABEL[o.estado]}</Badge>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-[12px] font-medium text-muted">
                              {late ? (
                                <span className="font-semibold text-danger">Atrasado</span>
                              ) : (
                                timeShort(o.promesa)
                              )}
                            </td>
                            {role !== 'montajista' && (
                              <td className="whitespace-nowrap px-5 py-3 text-right">
                                <span
                                  className={cx(
                                    'tnum text-[12.5px] font-semibold',
                                    saldo > 0 ? 'text-danger' : 'text-pine',
                                  )}
                                >
                                  {saldo > 0 ? clp(saldo) : 'Pagado'}
                                </span>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.section>
          )}
        </div>

        <div className="space-y-5">
          <motion.section variants={item}>
            <Card className="overflow-hidden">
              <div className="px-5 pb-1 pt-5">
                <SectionHeader title="Necesita tu atención" />
              </div>
              <ul className="divide-y divide-line">
                {[
                  {
                    to: '/inventario',
                    icon: <Flask size={17} weight="duotone" />,
                    title: 'Cristales bajo el mínimo',
                    detail: `${lowStock.length} combinaciones por reponer`,
                    count: lowStock.length,
                    tone: 'amber',
                  },
                  {
                    to: '/ordenes',
                    icon: <WarningCircle size={17} weight="duotone" />,
                    title: 'Pedidos atrasados',
                    detail: 'Pasaron la fecha de entrega prometida',
                    count: overdue.length,
                    tone: 'danger',
                  },
                  {
                    to: '/ordenes',
                    icon: <Package size={17} weight="duotone" />,
                    title: 'Listos para avisar',
                    detail: 'Hay que contactar al paciente',
                    count: ready.length,
                    tone: 'brand',
                  },
                  {
                    to: '/caja',
                    icon: <CurrencyCircleDollar size={17} weight="duotone" />,
                    title: 'Saldos por cobrar',
                    detail: clp(pendingBalance) + ' en pedidos abiertos',
                    count: orders.filter((o) => o.total - o.abono > 0 && o.estado !== 'entregada')
                      .length,
                    tone: 'pine',
                  },
                ]
                  .filter(
                    (row) =>
                      !(role === 'tecnologo' || role === 'montajista') || row.to !== '/caja',
                  )
                  .map((row) => (
                  <li key={row.title}>
                    <Link
                      to={row.to}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
                    >
                      <span
                        className={cx(
                          'grid size-8 shrink-0 place-items-center rounded-[9px]',
                          row.tone === 'danger'
                            ? 'bg-danger-soft text-danger'
                            : row.tone === 'amber'
                              ? 'bg-amber-soft text-amber'
                              : row.tone === 'brand'
                                ? 'bg-brand-soft text-brand'
                                : 'bg-pine-soft text-pine',
                        )}
                      >
                        {row.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{row.title}</p>
                        <p className="truncate text-[11.5px] text-muted">{row.detail}</p>
                      </div>
                      <span
                        className={cx(
                          'tnum grid min-w-6 shrink-0 place-items-center rounded-[7px] px-1.5 py-0.5 text-[11px] font-bold',
                          row.count > 0 ? 'bg-ink/[0.06] text-ink' : 'text-muted/60',
                        )}
                      >
                        {row.count}
                      </span>
                      <ArrowRight
                        size={14}
                        className="shrink-0 text-muted/50 transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.section>

          <motion.section variants={item}>
            <Card className="overflow-hidden">
              <div className="px-5 pb-1 pt-5">
                <SectionHeader title="Últimos movimientos" />
              </div>
              <ul className="divide-y divide-line">
                {recentAudit.map((a) => (
                  <li key={a.id} className="flex gap-3 px-5 py-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-medium leading-snug text-ink">{a.accion}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted">
                        {a.detalle} · {timeShort(a.fecha)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line px-5 py-3">
                <Link
                  to="/cumplimiento"
                  className="text-[12px] font-semibold text-brand hover:text-brand-deep"
                >
                  Ver registro completo
                </Link>
              </div>
            </Card>
          </motion.section>

          <motion.div variants={item}>
            <Card className="flex items-start gap-3 bg-surface-2 p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-pine-soft text-pine">
                <WhatsappLogo size={19} weight="fill" />
              </span>
              <div>
                <p className="text-[12.5px] font-semibold text-ink">Aviso de lentes listos</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                  En la ficha del pedido puedes enviar el aviso por WhatsApp con el folio y el
                  horario de retiro.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.p variants={item} className="pt-1 text-[11px] text-muted">
        {patients.length} pacientes en la ficha · {orders.length} pedidos históricos · demo con
        datos de ejemplo
      </motion.p>
    </motion.div>
  )
}

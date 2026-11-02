import { AnimatePresence, motion } from 'framer-motion'
import {
  Armchair,
  ArrowCounterClockwise,
  Bell,
  CalendarCheck,
  CashRegister,
  ChartBar,
  ClipboardText,
  DotsThreeOutline,
  FirstAid,
  List,
  MagnifyingGlass,
  Plus,
  Receipt,
  ShieldCheck,
  SquaresFour,
  Stack,
  UsersThree,
  Wrench,
  X,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { ROLE_LABEL, type Role } from '../lib/types'
import { dateLong } from '../lib/format'
import { Avatar, buttonClass, cx } from './UI'

type NavItem = {
  to: string
  label: string
  icon: typeof SquaresFour
  roles: Role[]
  badge?: number
}

export function useNav(): Array<{ section: string; items: NavItem[] }> {
  const { role, waiting, inventory, orders, appointments } = useStore()
  const lowStock = inventory.filter((i) => i.stock <= i.minimo).length
  const overdue = orders.filter(
    (o) => o.estado !== 'entregada' && new Date(o.promesa).getTime() < Date.now(),
  ).length
  const waitingCount = waiting.filter((w) => w.estado === 'esperando').length

  const all: Array<{ section: string; items: NavItem[] }> = [
    {
      section: 'Día a día',
      items: [
        {
          to: '/',
          label: 'Inicio',
          icon: SquaresFour,
          roles: ['admin', 'tecnologo', 'vendedora', 'montajista'],
        },
        {
          to: '/sala',
          label: 'Sala de espera',
          icon: Armchair,
          roles: ['admin', 'tecnologo', 'vendedora'],
          badge: waitingCount,
        },
        {
          to: '/agenda',
          label: 'Agenda',
          icon: CalendarCheck,
          roles: ['admin', 'tecnologo', 'vendedora'],
          badge: appointments.filter((a) => a.estado === 'agendada' || a.estado === 'confirmada')
            .length,
        },
        {
          to: '/pacientes',
          label: 'Pacientes',
          icon: UsersThree,
          roles: ['admin', 'tecnologo', 'vendedora'],
        },
      ],
    },
    {
      section: 'Ventas y taller',
      items: [
        {
          to: '/ordenes',
          label: 'Pedidos',
          icon: ClipboardText,
          roles: ['admin', 'vendedora', 'montajista'],
          badge: overdue,
        },
        {
          to: '/inventario',
          label: 'Inventario',
          icon: Stack,
          roles: ['admin', 'vendedora', 'montajista'],
          badge: lowStock,
        },
        { to: '/caja', label: 'Caja', icon: CashRegister, roles: ['admin', 'vendedora'] },
        { to: '/compras', label: 'Compras', icon: Receipt, roles: ['admin'] },
      ],
    },
    {
      section: 'Control',
      items: [
        { to: '/reportes', label: 'Reportes', icon: ChartBar, roles: ['admin'] },
        { to: '/postventa', label: 'Postventa', icon: FirstAid, roles: ['admin', 'vendedora'] },
        { to: '/cumplimiento', label: 'Cumplimiento', icon: ShieldCheck, roles: ['admin'] },
      ],
    },
  ]

  return all
    .map((group) => ({ ...group, items: group.items.filter((i) => i.roles.includes(role)) }))
    .filter((group) => group.items.length > 0)
}

function usePrimaryAction() {
  const { role } = useStore()
  if (role === 'tecnologo') return { to: '/sala', label: 'Atender sala', icon: Armchair }
  if (role === 'montajista') return { to: '/ordenes', label: 'Ver taller', icon: Wrench }
  return { to: '/pacientes?nuevo=1', label: 'Nueva venta', icon: Plus }
}

function PrimaryAction({ onNavigate }: { onNavigate?: () => void }) {
  const action = usePrimaryAction()
  const Icon = action.icon
  return (
    <Link
      to={action.to}
      onClick={onNavigate}
      className={buttonClass('primary', 'md', 'w-full justify-start')}
    >
      <Icon size={17} weight="bold" />
      {action.label}
    </Link>
  )
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Heaven Vision, ir al inicio">
      <span className="grid size-9 place-items-center rounded-[11px] bg-brand text-white shadow-[0_6px_16px_-8px_rgba(47,95,224,0.8)]">
        <svg viewBox="0 0 32 32" className="size-6" fill="none" aria-hidden="true">
          <circle cx="11.5" cy="16" r="6.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="20.5" cy="16" r="6.2" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M14.5 11.2c1 1.4 1 8.2 0 9.6M17.5 11.2c-1 1.4-1 8.2 0 9.6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </span>
      <span className="min-w-0 leading-none">
        <span className="block whitespace-nowrap font-display text-[18px] text-ink">
          Heaven Vision
        </span>
        <span className="mt-1 hidden whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted sm:block">
          Óptica · Santiago
        </span>
      </span>
    </Link>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const groups = useNav()
  const location = useLocation()

  return (
    <nav className="flex flex-col gap-6" aria-label="Navegación principal">
      {groups.map((group) => (
        <div key={group.section}>
          <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.13em] text-muted/75">
            {group.section}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to)
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'group relative flex h-10 items-center gap-2.5 rounded-[10px] px-3 text-[13.5px] transition-colors',
                      active
                        ? 'font-semibold text-brand-deep'
                        : 'font-medium text-ink-soft hover:bg-ink/[0.04] hover:text-ink',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-[10px] bg-brand-soft"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon
                      size={18}
                      weight={active ? 'fill' : 'regular'}
                      className="relative shrink-0"
                    />
                    <span className="relative flex-1">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={cx(
                          'relative grid min-w-5 place-items-center rounded-[6px] px-1.5 py-0.5 text-[10px] font-bold',
                          active ? 'bg-brand text-white' : 'bg-ink/[0.06] text-ink-soft',
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function RoleSwitcher({
  compact = false,
  iconOnly = false,
}: {
  compact?: boolean
  iconOnly?: boolean
}) {
  const { role, setRole, resetDemo } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const roles: Role[] = ['admin', 'tecnologo', 'vendedora', 'montajista']

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={iconOnly ? `Vista de rol: ${ROLE_LABEL[role]}. Cambiar` : undefined}
        className={cx(
          'flex items-center gap-2 rounded-[11px] border border-line bg-surface p-1.5 text-left transition-colors hover:border-line-strong',
          compact && 'w-full',
          !iconOnly && 'px-2.5 py-1.5',
        )}
      >
        <Avatar name={ROLE_LABEL[role]} size="sm" />
        {!iconOnly && (
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[12.5px] font-semibold text-ink">
              {ROLE_LABEL[role]}
            </span>
            <span className="block text-[10px] font-medium text-muted">Vista de rol · demo</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-[14px] border border-line bg-surface p-1.5 shadow-lift"
          >
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">
              Cambiar vista
            </p>
            {roles.map((r) => (
              <button
                key={r}
                role="menuitemradio"
                aria-checked={role === r}
                type="button"
                onClick={() => {
                  setRole(r)
                  setOpen(false)
                }}
                className={cx(
                  'flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] transition-colors',
                  role === r
                    ? 'bg-brand-soft font-semibold text-brand-deep'
                    : 'text-ink-soft hover:bg-ink/[0.04]',
                )}
              >
                <span
                  className={cx(
                    'size-1.5 rounded-full',
                    role === r ? 'bg-brand' : 'bg-line-strong',
                  )}
                />
                {ROLE_LABEL[r]}
              </button>
            ))}
            <div className="my-1 h-px bg-line" />
            <button
              type="button"
              onClick={() => {
                resetDemo()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-[9px] px-2.5 py-2 text-left text-[12px] font-medium text-muted transition-colors hover:bg-ink/[0.04] hover:text-ink"
            >
              <ArrowCounterClockwise size={14} />
              Reiniciar datos de ejemplo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate()
  const { inventory, orders, waiting } = useStore()
  const [query, setQuery] = useState('')
  const alerts =
    inventory.filter((i) => i.stock <= i.minimo).length +
    orders.filter((o) => o.estado === 'lista').length +
    waiting.filter((w) => w.estado === 'esperando').length

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menú"
          className="grid size-10 place-items-center rounded-[10px] text-ink-soft transition-colors hover:bg-ink/5 lg:hidden"
        >
          <List size={22} />
        </button>

        <div className="lg:hidden">
          <Logo />
        </div>

        <div className="hidden flex-1 items-center gap-4 lg:flex">
          <p className="text-[12.5px] font-medium capitalize text-muted">
            {dateLong(new Date().toISOString())}
          </p>
          <span className="h-4 w-px bg-line" />
          <form
            className="relative w-full max-w-sm"
            onSubmit={(e) => {
              e.preventDefault()
              if (query.trim()) navigate(`/pacientes?q=${encodeURIComponent(query.trim())}`)
            }}
          >
            <MagnifyingGlass
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar paciente, RUT o teléfono…"
              aria-label="Buscar paciente"
              className="h-9 w-full rounded-[10px] border border-line bg-surface-2 pl-9 pr-3 text-[12.5px] text-ink placeholder:text-muted/70 transition-colors focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
          </form>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/sala"
            className="relative grid size-10 place-items-center rounded-[10px] text-ink-soft transition-colors hover:bg-ink/5"
            aria-label={`${alerts} alertas pendientes`}
          >
            <Bell size={20} />
            {alerts > 0 && (
              <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-[5px] bg-danger px-1 text-[9px] font-bold leading-4 text-white">
                {alerts > 9 ? '9+' : alerts}
              </span>
            )}
          </Link>
          <div className="hidden sm:block">
            <RoleSwitcher />
          </div>
          <div className="sm:hidden">
            <RoleSwitcher iconOnly />
          </div>
        </div>
      </div>
    </header>
  )
}

const shortLabel: Record<string, string> = {
  'Sala de espera': 'Sala',
  Pedidos: 'Pedidos',
  Inventario: 'Stock',
  Cumplimiento: 'Control',
}

function BottomNav({ onMenu }: { onMenu: () => void }) {
  const groups = useNav()
  const location = useLocation()
  const items = groups.flatMap((g) => g.items).slice(0, 4)
  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active =
            item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
          const Icon = item.icon
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={cx(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold',
                  active ? 'text-brand' : 'text-muted',
                )}
              >
                <Icon size={21} weight={active ? 'fill' : 'regular'} />
                <span className="max-w-full truncate px-1">{shortLabel[item.label] ?? item.label}</span>
              </NavLink>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={onMenu}
            className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[10.5px] font-semibold text-muted transition-colors active:text-ink"
          >
            <DotsThreeOutline size={21} />
            <span>Más</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className="relative z-10 flex h-full w-[286px] flex-col border-r border-line bg-surface p-5"
          >
            <div className="mb-7 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú"
                className="grid size-9 place-items-center rounded-[10px] text-muted hover:bg-ink/5"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <PrimaryAction onNavigate={onClose} />
            <div className="mt-6 flex-1 overflow-y-auto scrollbar-thin">
              <NavList onNavigate={onClose} />
            </div>
            <div className="mt-4 space-y-3 border-t border-line pt-4">
              <RoleSwitcher compact />
              <p className="px-1 text-[10.5px] leading-relaxed text-muted">
                Demo con datos de ejemplo. Los cambios se guardan en este navegador.
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenu(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[10px] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <div className="mt-6">
          <PrimaryAction />
        </div>
        <div className="mt-7 flex-1 overflow-y-auto scrollbar-thin">
          <NavList />
        </div>
        <div className="mt-6 space-y-3 border-t border-line pt-4">
          <RoleSwitcher compact />
          <p className="px-1 text-[10px] leading-relaxed text-muted">
            Demo con datos de ejemplo.
            <br />
            Los cambios se guardan en este navegador.
          </p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <Topbar onMenu={() => setMenu(true)} />
        <main id="contenido" className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-12">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
      </div>

      <BottomNav onMenu={() => setMenu(true)} />
      <MobileDrawer open={menu} onClose={() => setMenu(false)} />
    </div>
  )
}

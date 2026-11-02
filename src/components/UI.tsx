import { AnimatePresence, motion } from 'framer-motion'
import { X } from '@phosphor-icons/react'
import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')

type Variant = 'primary' | 'brand' | 'outline' | 'ghost' | 'danger' | 'soft'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white shadow-[0_1px_2px_rgba(12,23,40,0.12),0_8px_20px_-12px_rgba(47,95,224,0.65)] hover:bg-brand-deep',
  brand:
    'bg-brand text-white shadow-[0_1px_2px_rgba(12,23,40,0.12),0_8px_20px_-12px_rgba(47,95,224,0.65)] hover:bg-brand-deep',
  outline:
    'border border-line-strong bg-surface text-ink hover:border-ink/25 hover:bg-surface-2',
  ghost: 'text-ink-soft hover:bg-ink/[0.05] hover:text-ink',
  danger: 'bg-danger text-white hover:bg-[#a92f2a]',
  soft: 'bg-brand-soft text-brand-deep hover:bg-[#dbe6ff]',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  cx(
    'inline-flex items-center justify-center rounded-[11px] font-semibold transition-[background-color,box-shadow,transform,border-color] duration-200',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
    variants[variant],
    sizes[size],
    extra,
  )

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  )
}

type Tone = 'neutral' | 'brand' | 'pine' | 'amber' | 'danger' | 'info' | 'outline'

const tones: Record<Tone, string> = {
  neutral: 'bg-ink/[0.055] text-ink-soft',
  brand: 'bg-brand-soft text-brand-deep',
  pine: 'bg-pine-soft text-pine',
  amber: 'bg-amber-soft text-amber',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  outline: 'border border-line-strong text-muted',
}

export function Badge({
  tone = 'neutral',
  dot = false,
  children,
  className,
}: {
  tone?: Tone
  dot?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-[7px] px-2 py-[3px] text-[11.5px] font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function Card({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string
  children: ReactNode
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <Tag className={cx('rounded-[16px] border border-line bg-surface shadow-card', className)}>
      {children}
    </Tag>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-[22px] leading-tight text-ink">{title}</h2>
        {description && (
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[30px] leading-[1.04] text-ink sm:text-[42px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
  tone = 'ink',
  icon,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'ink' | 'brand' | 'pine' | 'danger' | 'amber'
  icon?: ReactNode
  className?: string
}) {
  const toneClass = {
    ink: 'text-ink',
    brand: 'text-brand',
    pine: 'text-pine',
    danger: 'text-danger',
    amber: 'text-amber',
  }[tone]
  return (
    <Card className={cx('p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold text-muted sm:text-[13px]">{label}</p>
        {icon && (
          <span className="hidden size-8 shrink-0 place-items-center rounded-[9px] bg-surface-2 text-muted sm:grid">
            {icon}
          </span>
        )}
      </div>
      <p
        className={cx(
          'tnum mt-3 font-display text-[26px] leading-none sm:text-[34px]',
          toneClass,
        )}
      >
        {value}
      </p>
      {hint && (
        <div className="mt-2 text-[11.5px] leading-snug text-muted sm:text-[12px]">{hint}</div>
      )}
    </Card>
  )
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] font-semibold text-ink-soft">
          {label}
          {required && <span className="ml-0.5 text-brand">*</span>}
        </span>
        {hint && <span className="text-[11px] font-medium text-muted">{hint}</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-[11px] font-semibold text-danger">
          {error}
        </span>
      )}
    </label>
  )
}

const inputBase =
  'w-full rounded-[11px] border border-line-strong bg-surface px-3.5 text-sm text-ink placeholder:text-muted/55 transition-[border-color,box-shadow] duration-200 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:opacity-50'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputBase, 'h-11', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputBase, 'h-11 cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputBase, 'min-h-24 py-2.5', className)} {...props} />
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  width?: string
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cx(
              'relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-[24px] border border-line bg-surface p-6 shadow-lift sm:rounded-[20px]',
              width,
            )}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="font-display text-[22px] leading-tight text-ink">
                  {title}
                </h2>
                {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Cerrar ventana"
                className="grid size-9 shrink-0 place-items-center rounded-[10px] text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const avatarTones = [
  'bg-pine-soft text-pine',
  'bg-brand-soft text-brand-deep',
  'bg-amber-soft text-amber',
  'bg-info-soft text-info',
  'bg-danger-soft text-danger',
]

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  const index = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarTones.length
  const dims =
    size === 'sm' ? 'size-8 text-[11px]' : size === 'lg' ? 'size-14 text-lg' : 'size-10 text-[13px]'
  return (
    <span
      aria-hidden="true"
      className={cx(
        'grid shrink-0 place-items-center rounded-[12px] font-semibold tracking-wide',
        avatarTones[index],
        dims,
      )}
    >
      {initials}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
      {icon && (
        <div className="mb-3 grid size-11 place-items-center rounded-[12px] bg-brand-soft text-brand">
          {icon}
        </div>
      )}
      <p className="font-display text-lg text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Meter({
  value,
  max,
  tone = 'pine',
  label,
}: {
  value: number
  max: number
  tone?: 'pine' | 'brand' | 'danger' | 'amber'
  label?: string
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  const bar = {
    pine: 'bg-pine',
    brand: 'bg-brand',
    danger: 'bg-danger',
    amber: 'bg-amber',
  }[tone]
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted">
          <span>{label}</span>
          <span className="tnum">{pct}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/8">
        <motion.div
          className={cx('h-full rounded-full', bar)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

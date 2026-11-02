import { LockKey } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { ROLE_LABEL, type Role } from '../lib/types'
import { Button, Card } from './UI'

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const { role } = useStore()
  if (roles.includes(role)) return <>{children}</>

  return (
    <Card className="mx-auto mt-10 max-w-md p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-[14px] bg-brand-soft text-brand">
        <LockKey size={22} weight="duotone" />
      </span>
      <h1 className="mt-4 font-display text-xl text-ink">Sin acceso a esta sección</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Estás viendo la demo como <strong className="text-ink">{ROLE_LABEL[role]}</strong>. Este
        módulo está reservado para otro rol, igual que en el sistema real.
      </p>
      <Link to="/" className="mt-5 inline-block">
        <Button variant="outline">Volver al inicio</Button>
      </Link>
    </Card>
  )
}

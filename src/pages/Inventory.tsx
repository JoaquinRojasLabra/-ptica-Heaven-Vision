import { useMemo, useState } from 'react'
import {
  ArrowsClockwise,
  MagnifyingGlass,
  Package,
  Plus,
  Stack,
  WarningCircle,
} from '@phosphor-icons/react'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageTitle, Select, Stat, cx } from '../components/UI'
import { clp } from '../lib/format'
import { useStore } from '../lib/store'
import type { InventoryItem } from '../lib/types'

const statusLabel = { rojo: 'Crítico', amarillo: 'Bajo', verde: 'OK' }
const statusTone = { rojo: 'danger', amarillo: 'amber', verde: 'pine' } as const

export default function Inventory() {
  const { inventory, adjustStock, stockStatus } = useStore()
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('Todos')
  const [onlyLow, setOnlyLow] = useState(false)
  const [target, setTarget] = useState<InventoryItem | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inventory.filter((item) => {
      if (tipo !== 'Todos' && item.tipo !== tipo) return false
      if (onlyLow && item.stock > item.minimo) return false
      if (!q) return true
      return (
        item.sku.toLowerCase().includes(q) ||
        item.tipo.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        `${item.esfera} ${item.cilindro}`.includes(q)
      )
    })
  }, [inventory, query, tipo, onlyLow])

  const low = inventory.filter((i) => i.stock <= i.minimo)
  const critical = inventory.filter((i) => i.stock <= 1)
  const value = inventory.reduce((a, i) => a + i.stock * i.costo, 0)
  const units = inventory.reduce((a, i) => a + i.stock, 0)

  return (
    <div>
      <PageTitle
        title="Inventario"
        subtitle="Cristales del laboratorio, con stock mínimo y descuento automático al usar un pedido."
        action={
          <Badge tone={low.length > 0 ? 'amber' : 'pine'} dot>
            {low.length} bajo mínimo
          </Badge>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Combinaciones" value={inventory.length} hint={`${units} unidades en total`} icon={<Stack size={18} />} />
        <Stat
          label="Bajo mínimo"
          value={low.length}
          tone={low.length > 0 ? 'amber' : 'ink'}
          hint={`${critical.length} en nivel crítico`}
          icon={<WarningCircle size={18} />}
        />
        <Stat label="Valor del stock" value={clp(value)} hint="Valorizado a costo" tone="pine" />
        <Stat label="Sin stock" value={inventory.filter((i) => i.stock === 0).length} tone="danger" hint="Requieren pedido externo" />
      </div>

      {critical.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 rounded-[12px] border border-danger/25 bg-danger-soft/50 px-4 py-3 sm:flex-row sm:items-center">
          <WarningCircle size={18} className="shrink-0 text-danger" />
          <p className="text-[12px] leading-relaxed text-ink-soft">
            <strong className="font-bold text-danger">Reponer ahora:</strong>{' '}
            {critical.map((i) => `${i.tipo} ${i.esfera}/${i.cilindro}`).join(' · ')}
          </p>
          <Button size="sm" variant="danger" className="sm:ml-auto" onClick={() => setOnlyLow(true)}>
            Ver críticos
          </Button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlass
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SKU, graduación o material…"
            aria-label="Buscar en inventario"
            className="pl-9"
          />
        </div>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value)} className="sm:w-44" aria-label="Filtrar por tipo">
          <option>Todos</option>
          <option>Monofocal</option>
          <option>Bifocal</option>
          <option>Multifocal</option>
        </Select>
        <button
          type="button"
          onClick={() => setOnlyLow((v) => !v)}
          className={cx(
            'flex h-9 w-fit items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors',
            onlyLow ? 'border-amber bg-amber-soft text-amber' : 'border-line bg-surface text-muted hover:text-ink',
          )}
        >
          <WarningCircle size={13} />
          Solo bajo mínimo
        </button>
        <div className="flex items-center gap-3 text-[10px] font-semibold text-muted sm:ml-auto">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-pine" />OK</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber" />Bajo</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-danger" />Crítico</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Package size={28} />}
            title="Sin resultados"
            description="Ajusta la búsqueda o el filtro de tipo de cristal."
          />
        </div>
      ) : (
        <>
          <Card className="mt-4 hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    <th className="px-5 py-3">Cristal</th>
                    <th className="px-3 py-3">Graduación</th>
                    <th className="px-3 py-3 text-center">Stock</th>
                    <th className="px-3 py-3 text-center">Mínimo</th>
                    <th className="px-3 py-3">Laboratorio</th>
                    <th className="px-3 py-3 text-right">Costo</th>
                    <th className="px-3 py-3 text-right">Venta</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((item) => {
                    const status = stockStatus(item)
                    return (
                      <tr
                        key={item.id}
                        className={cx(
                          'transition-colors hover:bg-paper/60',
                          status === 'rojo' && 'bg-danger-soft/25',
                        )}
                      >
                        <td className="px-5 py-3">
                          <p className="text-[12px] font-bold text-ink">
                            {item.tipo} · {item.material}
                          </p>
                          <p className="text-[10px] text-muted">
                            {item.tratamientos.join(', ') || 'Sin tratamiento'} · {item.sku}
                          </p>
                        </td>
                        <td className="tnum px-3 py-3 text-[12px] font-semibold text-ink">
                          {item.esfera} / {item.cilindro}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={cx(
                              'tnum inline-flex min-w-9 items-center justify-center rounded-full px-2 py-1 text-[12px] font-bold',
                              status === 'rojo'
                                ? 'bg-danger text-white'
                                : status === 'amarillo'
                                  ? 'bg-amber-soft text-amber'
                                  : 'bg-pine-soft text-pine',
                            )}
                          >
                            {item.stock}
                          </span>
                        </td>
                        <td className="tnum px-3 py-3 text-center text-[12px] text-muted">{item.minimo}</td>
                        <td className="px-3 py-3 text-[11px] text-muted">{item.laboratorio}</td>
                        <td className="tnum px-3 py-3 text-right text-[12px] text-muted">{clp(item.costo)}</td>
                        <td className="tnum px-3 py-3 text-right text-[12px] font-bold text-ink">{clp(item.precio)}</td>
                        <td className="px-5 py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setTarget(item)}>
                            <ArrowsClockwise size={14} />
                            Ajustar
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-4 grid gap-2.5 md:hidden">
            {rows.map((item) => {
              const status = stockStatus(item)
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-bold text-ink">
                        {item.tipo} · {item.material}
                      </p>
                      <p className="tnum mt-0.5 text-[11px] text-muted">
                        {item.esfera} / {item.cilindro} · {item.tratamientos.join(', ') || 'Sin tratamiento'}
                      </p>
                    </div>
                    <Badge tone={statusTone[status]} dot>
                      {statusLabel[status]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted">Stock / mínimo</p>
                      <p className="tnum text-lg font-bold text-ink">
                        {item.stock} <span className="text-[12px] font-medium text-muted">/ {item.minimo}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-muted">Venta</p>
                      <p className="tnum text-[13px] font-bold text-ink">{clp(item.precio)}</p>
                    </div>
                    <Button size="sm" variant="soft" onClick={() => setTarget(item)}>
                      <Plus size={13} />
                      Ajustar
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <AdjustModal
        item={target}
        onClose={() => setTarget(null)}
        onAdjust={(delta, motivo) => {
          if (target) adjustStock(target.id, delta, motivo)
          setTarget(null)
        }}
      />
    </div>
  )
}

function AdjustModal({
  item,
  onClose,
  onAdjust,
}: {
  item: InventoryItem | null
  onClose: () => void
  onAdjust: (delta: number, motivo: string) => void
}) {
  const [delta, setDelta] = useState(0)
  const [motivo, setMotivo] = useState('Recepción de mercadería')
  const [error, setError] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (delta === 0) {
      setError('Indica cuántas unidades ingresar o descontar.')
      return
    }
    if (item && item.stock + delta < 0) {
      setError('No puedes dejar el stock en negativo.')
      return
    }
    setError('')
    onAdjust(delta, motivo)
    setDelta(0)
  }

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title="Ajustar stock"
      description={item ? `${item.tipo} ${item.esfera} / ${item.cilindro} · stock actual ${item.stock}` : ''}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[-5, -1, 1, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDelta((d) => d + n)}
              className="rounded-full border border-line px-3 py-1.5 text-[12px] font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand"
            >
              {n > 0 ? `+${n}` : n}
            </button>
          ))}
        </div>
        <Field label="Movimiento" hint="positivo ingresa, negativo descuenta">
          <Input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
        </Field>
        <Field label="Motivo">
          <Select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option>Recepción de mercadería</option>
            <option>Uso en un pedido</option>
            <option>Devolución</option>
            <option>Merma</option>
            <option>Ajuste de inventario</option>
          </Select>
        </Field>
        <div className="rounded-[10px] bg-paper/80 px-3 py-2 text-[11px] text-muted">
          Stock resultante:{' '}
          <strong className="tnum text-ink">{Math.max(0, (item?.stock ?? 0) + delta)}</strong> unidades.
          El movimiento queda en auditoría.
        </div>
        {error && (
          <p role="alert" className="text-[11px] font-bold text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand">
            <ArrowsClockwise size={16} />
            Aplicar ajuste
          </Button>
        </div>
      </form>
    </Modal>
  )
}

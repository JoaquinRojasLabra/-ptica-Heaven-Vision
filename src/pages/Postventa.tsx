import { useState } from 'react'
import { CheckCircle, Plus, ShieldCheck } from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageTitle,
  Select,
  Stat,
  Textarea,
} from '../components/UI'
import { dateShort } from '../lib/format'
import { useStore } from '../lib/store'

export default function Postventa() {
  const { warranty, orders, patient, addWarranty, resolveWarranty, role } = useStore()
  const [open, setOpen] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  const delivered = orders.filter((o) => o.estado === 'entregada')
  const openCases = warranty.filter((w) => w.estado === 'Abierto')
  const canEdit = role === 'admin' || role === 'vendedora'

  return (
    <div>
      <PageTitle
        title="Postventa y garantía"
        subtitle="Los 6 meses de garantía legal, con el motivo de cada reclamo y cómo se resolvió."
        action={
          canEdit ? (
            <Button onClick={() => setOpen(true)}>
              <Plus size={17} weight="bold" />
              Registrar caso
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Casos abiertos" value={openCases.length} tone={openCases.length ? 'amber' : 'pine'} />
        <Stat label="Resueltos" value={warranty.filter((w) => w.estado === 'Resuelto').length} tone="pine" />
        <Stat label="Pedidos entregados" value={delivered.length} hint="Con garantía vigente" />
        <Stat label="Cobertura" value="6 meses" hint="Garantía legal desde la entrega" />
      </div>

      {warranty.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<ShieldCheck size={22} weight="duotone" />}
            title="Sin casos de postventa"
            description="Cuando un paciente vuelva por un ajuste o una garantía, regístralo aquí."
          />
        </div>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <ul className="divide-y divide-line">
            {[...warranty].reverse().map((w) => {
              const o = orders.find((x) => x.id === w.orderId)
              const p = o ? patient(o.patientId) : undefined
              return (
                <li key={w.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold text-ink">
                      {o?.folio ?? 'Pedido'} · {p?.nombre ?? 'Paciente'}
                    </p>
                    <Badge tone={w.estado === 'Abierto' ? 'amber' : 'pine'} dot>
                      {w.estado}
                    </Badge>
                    <span className="ml-auto text-[11.5px] text-muted">{dateShort(w.fecha)}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-ink-soft">{w.motivo}</p>
                  {w.resolucion ? (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[12px] text-pine">
                      <CheckCircle size={14} weight="fill" className="mt-0.5 shrink-0" />
                      {w.resolucion}
                    </p>
                  ) : canEdit ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => {
                          setResolving(w.id)
                          setResolution('')
                        }}
                      >
                        Resolver caso
                      </Button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <NewCase
        open={open}
        onClose={() => setOpen(false)}
        orders={delivered.map((o) => ({
          id: o.id,
          label: `${o.folio} · ${patient(o.patientId)?.nombre ?? ''}`,
        }))}
        onSave={(orderId, motivo) => {
          addWarranty(orderId, motivo, '')
          setOpen(false)
        }}
      />

      <Modal
        open={!!resolving}
        onClose={() => setResolving(null)}
        title="Resolver caso de postventa"
        description="Queda registrado en la ficha y en la auditoría."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (resolving) resolveWarranty(resolving, resolution)
            setResolving(null)
          }}
          className="space-y-4"
        >
          <Field label="Qué se hizo" required>
            <Textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Ej: se cambió el cristal sin costo"
              required
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setResolving(null)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar resolución</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function NewCase({
  open,
  onClose,
  orders,
  onSave,
}: {
  open: boolean
  onClose: () => void
  orders: Array<{ id: string; label: string }>
  onSave: (orderId: string, motivo: string) => void
}) {
  const [orderId, setOrderId] = useState('')
  const [motivo, setMotivo] = useState('')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar caso de postventa"
      description="Puede ser un ajuste, un cambio de tornillo o un reclamo por la visión."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!orderId || !motivo.trim()) return
          onSave(orderId, motivo.trim())
          setOrderId('')
          setMotivo('')
        }}
        className="space-y-4"
      >
        <Field label="Pedido entregado" required>
          <Select value={orderId} onChange={(e) => setOrderId(e.target.value)} required>
            <option value="">Selecciona un pedido…</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Motivo del reclamo" required>
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: molestia con la altura del multifocal"
            required
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Registrar caso</Button>
        </div>
      </form>
    </Modal>
  )
}

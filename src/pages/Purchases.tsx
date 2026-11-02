import { useState } from 'react'
import { Buildings, Plus, Receipt } from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageTitle,
  SectionHeader,
  Select,
  Stat,
  Textarea,
  cx,
} from '../components/UI'
import { clp, dateShort } from '../lib/format'
import { useStore } from '../lib/store'
import type { Purchase, Supplier } from '../lib/types'

export default function Purchases() {
  const { purchases, suppliers, addPurchase, addSupplier, togglePurchasePaid } = useStore()
  const [buyOpen, setBuyOpen] = useState(false)
  const [supOpen, setSupOpen] = useState(false)

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
  const monthPurchases = purchases.filter((p) => new Date(p.fecha).getTime() >= monthStart)
  const monthTotal = monthPurchases.reduce((a, p) => a + p.monto, 0)
  const pending = purchases.filter((p) => p.estado === 'Pendiente')
  const pendingTotal = pending.reduce((a, p) => a + p.monto, 0)

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.nombre ?? '—'

  return (
    <div>
      <PageTitle
        title="Compras y proveedores"
        subtitle="Lo que se compra a laboratorios e insumos, para saber el costo real antes de vender."
        action={
          <>
            <Button variant="outline" onClick={() => setSupOpen(true)}>
              <Buildings size={17} />
              Nuevo proveedor
            </Button>
            <Button onClick={() => setBuyOpen(true)}>
              <Plus size={17} weight="bold" />
              Registrar compra
            </Button>
          </>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Compras del mes" value={clp(monthTotal)} hint={`${monthPurchases.length} ${monthPurchases.length === 1 ? 'documento' : 'documentos'}`} />
        <Stat
          label="Por pagar"
          value={clp(pendingTotal)}
          tone={pendingTotal > 0 ? 'danger' : 'pine'}
          hint={`${pending.length} facturas pendientes`}
        />
        <Stat label="Proveedores" value={suppliers.length} tone="brand" />
        <Stat
          label="Promedio por compra"
          value={clp(monthPurchases.length ? Math.round(monthTotal / monthPurchases.length) : 0)}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="px-5 pb-3 pt-5">
            <SectionHeader
              title="Facturas y compras"
              description="Solo la administradora puede registrar y pagar compras."
            />
          </div>
          {purchases.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={<Receipt size={22} weight="duotone" />}
                title="Sin compras registradas"
                description="Registra la primera factura de laboratorio."
              />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[480px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-line bg-surface-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-2 font-semibold">Documento</th>
                    <th className="px-3 py-2 font-semibold">Detalle</th>
                    <th className="px-3 py-2 text-right font-semibold">Monto</th>
                    <th className="px-5 py-2 text-right font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...purchases].reverse().map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-surface-2">
                      <td className="whitespace-nowrap px-5 py-3">
                        <p className="text-[12px] font-semibold text-ink">{p.folio}</p>
                        <p className="text-[10.5px] text-muted">{dateShort(p.fecha)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-[240px] truncate text-[12.5px] text-ink">{p.descripcion}</p>
                        <p className="text-[10.5px] text-muted">
                          {supplierName(p.supplierId)} · {p.categoria}
                        </p>
                      </td>
                      <td className="tnum whitespace-nowrap px-3 py-3 text-right text-[12.5px] font-semibold text-ink">
                        {clp(p.monto)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => togglePurchasePaid(p.id)}
                          className={cx(
                            'rounded-[7px] px-2 py-1 text-[11px] font-semibold transition-colors',
                            p.estado === 'Pagada'
                              ? 'bg-pine-soft text-pine hover:bg-pine/15'
                              : 'bg-amber-soft text-amber hover:bg-amber/15',
                          )}
                          title="Cambiar estado de pago"
                        >
                          {p.estado}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 pb-1 pt-5">
            <SectionHeader title="Proveedores" />
          </div>
          <ul className="divide-y divide-line">
            {suppliers.map((s) => (
              <li key={s.id} className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-ink">{s.nombre}</p>
                  <Badge tone="neutral">{s.tipo}</Badge>
                </div>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {s.contacto} · {s.telefono}
                </p>
                <p className="text-[11.5px] text-muted">{s.email}</p>
                {s.notas && <p className="mt-1 text-[11px] leading-relaxed text-muted/90">{s.notas}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <NewPurchase
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        suppliers={suppliers}
        onSave={(data) => {
          addPurchase(data)
          setBuyOpen(false)
        }}
      />
      <NewSupplier
        open={supOpen}
        onClose={() => setSupOpen(false)}
        onSave={(data) => {
          addSupplier(data)
          setSupOpen(false)
        }}
      />
    </div>
  )
}

function NewPurchase({
  open,
  onClose,
  suppliers,
  onSave,
}: {
  open: boolean
  onClose: () => void
  suppliers: Supplier[]
  onSave: (data: {
    supplierId: string
    descripcion: string
    categoria: Purchase['categoria']
    monto: number
    estado: Purchase['estado']
  }) => void
}) {
  const [supplierId, setSupplierId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState<Purchase['categoria']>('Cristales')
  const [monto, setMonto] = useState('')
  const [estado, setEstado] = useState<Purchase['estado']>('Pendiente')
  const [error, setError] = useState('')

  return (
    <Modal open={open} onClose={onClose} title="Registrar compra" description="Queda en el costo del mes y en la auditoría.">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!supplierId || !descripcion.trim() || Number(monto) <= 0) {
            setError('Completa proveedor, detalle y un monto mayor a cero.')
            return
          }
          setError('')
          onSave({
            supplierId,
            descripcion: descripcion.trim(),
            categoria,
            monto: Number(monto),
            estado,
          })
          setSupplierId('')
          setDescripcion('')
          setMonto('')
        }}
        className="space-y-4"
      >
        <Field label="Proveedor" required>
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Selecciona…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Detalle" required>
          <Input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: 20 pares monofocales con antirreflejo"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría">
            <Select value={categoria} onChange={(e) => setCategoria(e.target.value as Purchase['categoria'])}>
              <option>Cristales</option>
              <option>Armazones</option>
              <option>Insumos</option>
              <option>Otros</option>
            </Select>
          </Field>
          <Field label="Monto" required hint="CLP">
            <Input
              type="number"
              min={0}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
        <Field label="Estado del pago">
          <Select value={estado} onChange={(e) => setEstado(e.target.value as Purchase['estado'])}>
            <option>Pendiente</option>
            <option>Pagada</option>
          </Select>
        </Field>
        {error && (
          <p role="alert" className="text-[12px] font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Guardar compra</Button>
        </div>
      </form>
    </Modal>
  )
}

function NewSupplier({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Supplier, 'id'>) => void
}) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<Supplier['tipo']>('Laboratorio')
  const [contacto, setContacto] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [notas, setNotas] = useState('')

  return (
    <Modal open={open} onClose={onClose} title="Nuevo proveedor">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!nombre.trim()) return
          onSave({ nombre: nombre.trim(), tipo, contacto, telefono, email, notas })
          setNombre('')
          setContacto('')
          setTelefono('')
          setEmail('')
          setNotas('')
        }}
        className="space-y-4"
      >
        <Field label="Nombre" required>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </Field>
        <Field label="Tipo">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as Supplier['tipo'])}>
            <option>Laboratorio</option>
            <option>Armazones</option>
            <option>Insumos</option>
          </Select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contacto">
            <Input value={contacto} onChange={(e) => setContacto(e.target.value)} />
          </Field>
          <Field label="Teléfono">
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </Field>
        </div>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Notas">
          <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Guardar proveedor</Button>
        </div>
      </form>
    </Modal>
  )
}

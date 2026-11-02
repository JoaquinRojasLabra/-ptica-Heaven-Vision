import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { hashText, isoDay } from './format'
import { buildSeed } from './seed'
import {
  ROLE_PERSON,
  STATUS_LABEL,
  STATUS_ORDER,
  type DemoState,
  type Eye,
  type Frame,
  type InventoryItem,
  type Lens,
  type Order,
  type OrderStatus,
  type Patient,
  type Payment,
  type Prescription,
  type Role,
  type WaitingStatus,
} from './types'

const KEY = 'hv-demo-v2'

type NewPatient = Omit<Patient, 'id' | 'createdAt'>
type NewPrescription = {
  od: Eye
  oi: Eye
  agudezaOD: string
  agudezaOI: string
  observaciones: string
}
type NewOrder = {
  patientId: string
  prescriptionId: string
  cristal: Lens
  armazon: Frame
  descuento: number
  abono: number
  promesa: string
  recetaComprada: boolean
  inventoryId?: string
}

type Store = DemoState & {
  setRole: (role: Role) => void
  addPatient: (data: NewPatient) => string
  addPrescription: (patientId: string, data: NewPrescription) => string
  createOrder: (data: NewOrder) => string
  advanceOrder: (orderId: string) => void
  addPayment: (orderId: string, monto: number, medio: Payment['medio']) => void
  adjustStock: (itemId: string, delta: number, motivo: string) => void
  addWaiting: (patientId: string, motivo: string) => void
  setWaitingStatus: (id: string, estado: WaitingStatus) => void
  closeAttention: (patientId: string, motivo: string) => void
  logAccess: (patientId: string) => void
  resetDemo: () => void
  patient: (id: string) => Patient | undefined
  prescription: (id: string) => Prescription | undefined
  order: (id: string) => Order | undefined
  stockStatus: (item: InventoryItem) => 'rojo' | 'amarillo' | 'verde'
}

const StoreContext = createContext<Store | null>(null)

const load = (): DemoState | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoState
    if (parsed.demoDay !== isoDay()) return null
    return parsed
  } catch {
    return null
  }
}

const audit = (
  state: DemoState,
  accion: string,
  entidad: string,
  detalle: string,
  rol: Role = state.role,
): DemoState => {
  const prevHash = state.audit[state.audit.length - 1]?.hash ?? 'GENESIS'
  const fecha = new Date().toISOString()
  const entry = {
    id: `a${Date.now()}${Math.floor(Math.random() * 1000)}`,
    fecha,
    usuario: ROLE_PERSON[rol],
    rol,
    accion,
    entidad,
    detalle,
    prevHash,
    hash: hashText(prevHash + fecha + accion + entidad + detalle),
  }
  return { ...state, audit: [...state.audit, entry] }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => load() ?? buildSeed())

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* demo: sin persistencia disponible */
    }
  }, [state])

  const value = useMemo<Store>(() => {
    const setRole = (role: Role) =>
      setState((s) => audit({ ...s, role }, 'Cambió de rol', 'Sesión', `Ingresó como ${role}`, role))

    const addPatient = (data: NewPatient) => {
      const id = `p${Date.now()}`
      setState((s) =>
        audit(
          {
            ...s,
            patients: [
              ...s.patients,
              { ...data, id, createdAt: new Date().toISOString() },
            ],
          },
          'Creó ficha de paciente',
          `Paciente ${id}`,
          `${data.nombre} · ${data.rut}`,
        ),
      )
      return id
    }

    const addPrescription = (patientId: string, data: NewPrescription) => {
      const id = `pr${Date.now()}`
      const p = state.patients.find((x) => x.id === patientId)
      setState((s) =>
        audit(
          {
            ...s,
            prescriptions: [
              ...s.prescriptions,
              {
                ...data,
                id,
                patientId,
                fecha: new Date().toISOString(),
                profesional: ROLE_PERSON.tecnologo,
              },
            ],
          },
          'Emitió receta',
          `Receta ${id}`,
          `${p?.nombre ?? patientId} · OD ${data.od.esfera} / OI ${data.oi.esfera}`,
          'tecnologo',
        ),
      )
      return id
    }

    const createOrder = (data: NewOrder) => {
      const id = `o${Date.now()}`
      const lastFolio = state.orders.reduce((max, item) => {
        const n = Number(item.folio.split('-').at(-1))
        return Number.isFinite(n) ? Math.max(max, n) : max
      }, 148)
      const folio = `OT-2026-${String(lastFolio + 1).padStart(4, '0')}`
      const p = state.patients.find((x) => x.id === data.patientId)
      const total = data.cristal.precio + data.armazon.precio - data.descuento
      setState((s) => {
        const inventory = data.inventoryId
          ? s.inventory.map((item) =>
              item.id === data.inventoryId
                ? { ...item, stock: Math.max(0, item.stock - 1) }
                : item,
            )
          : s.inventory
        const withOrder = audit(
          {
            ...s,
            inventory,
            orders: [
              ...s.orders,
              {
                id,
                folio,
                patientId: data.patientId,
                prescriptionId: data.prescriptionId,
                estado: 'recepcion',
                cristal: data.cristal,
                armazon: data.armazon,
                descuento: data.descuento,
                total,
                abono: data.abono,
                createdAt: new Date().toISOString(),
                promesa: data.promesa,
                historial: [
                  {
                    estado: 'recepcion',
                    fecha: new Date().toISOString(),
                    usuario: ROLE_PERSON[s.role],
                  },
                ],
                recetaComprada: data.recetaComprada,
              },
            ],
          },
          'Creó orden de trabajo',
          folio,
          `${p?.nombre ?? data.patientId} · ${data.cristal.tipo}`,
        )
        return withOrder
      })
      return id
    }

    const advanceOrder = (orderId: string) =>
      setState((s) => {
        const target = s.orders.find((o) => o.id === orderId)
        if (!target) return s
        const index = STATUS_ORDER.indexOf(target.estado)
        const next = STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)]
        if (next === target.estado) return s
        const orders = s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                estado: next,
                historial: [
                  ...o.historial,
                  {
                    estado: next,
                    fecha: new Date().toISOString(),
                    usuario: ROLE_PERSON[s.role],
                  },
                ],
              }
            : o,
        )
        return audit(
          { ...s, orders },
          'Actualizó estado',
          target.folio,
          `${STATUS_LABEL[target.estado]} → ${STATUS_LABEL[next]}`,
        )
      })

    const addPayment = (orderId: string, monto: number, medio: Payment['medio']) =>
      setState((s) => {
        const target = s.orders.find((o) => o.id === orderId)
        if (!target) return s
        const payment: Payment = {
          id: `pay${Date.now()}`,
          orderId,
          fecha: new Date().toISOString(),
          monto,
          medio,
          usuario: ROLE_PERSON[s.role],
        }
        return audit(
          {
            ...s,
            payments: [...s.payments, payment],
            orders: s.orders.map((o) =>
              o.id === orderId ? { ...o, abono: Math.min(o.total, o.abono + monto) } : o,
            ),
          },
          'Registró pago',
          target.folio,
          `$${monto.toLocaleString('es-CL')} · ${medio}`,
        )
      })

    const adjustStock = (itemId: string, delta: number, motivo: string) =>
      setState((s) => {
        const item = s.inventory.find((i) => i.id === itemId)
        if (!item) return s
        return audit(
          {
            ...s,
            inventory: s.inventory.map((i) =>
              i.id === itemId ? { ...i, stock: Math.max(0, i.stock + delta) } : i,
            ),
          },
          delta >= 0 ? 'Ingresó stock' : 'Descontó stock',
          item.sku,
          `${delta >= 0 ? '+' : ''}${delta} unidades · ${motivo}`,
        )
      })

    const addWaiting = (patientId: string, motivo: string) =>
      setState((s) => {
        if (s.waiting.some((w) => w.patientId === patientId && w.estado !== 'atendido')) return s
        const p = s.patients.find((x) => x.id === patientId)
        return audit(
          {
            ...s,
            waiting: [
              ...s.waiting,
              {
                id: `w${Date.now()}`,
                patientId,
                motivo,
                hora: new Date().toISOString(),
                estado: 'esperando',
              },
            ],
          },
          'Agregó a sala de espera',
          `Paciente ${patientId}`,
          `${p?.nombre ?? patientId} · ${motivo}`,
        )
      })

    const setWaitingStatus = (id: string, estado: WaitingStatus) =>
      setState((s) => {
        const entry = s.waiting.find((w) => w.id === id)
        const p = entry ? s.patients.find((x) => x.id === entry.patientId) : undefined
        return audit(
          {
            ...s,
            waiting: s.waiting.map((w) => (w.id === id ? { ...w, estado } : w)),
          },
          estado === 'en_consulta'
            ? 'Inició consulta'
            : estado === 'atendido'
              ? 'Finalizó atención'
              : 'Devolvió a espera',
          `Paciente ${entry?.patientId ?? id}`,
          p?.nombre ?? id,
        )
      })

    const closeAttention = (patientId: string, motivo: string) =>
      setState((s) => {
        const p = s.patients.find((x) => x.id === patientId)
        return audit(
          {
            ...s,
            patients: s.patients.map((x) =>
              x.id === patientId
                ? { ...x, atencionCerrada: { fecha: new Date().toISOString(), motivo } }
                : x,
            ),
          },
          'Cerró atención sin venta',
          `Paciente ${patientId}`,
          `${p?.nombre ?? patientId} · ${motivo}`,
        )
      })

    const logAccess = (patientId: string) =>
      setState((s) => {
        const p = s.patients.find((x) => x.id === patientId)
        return audit(s, 'Consultó ficha clínica', `Paciente ${patientId}`, p?.nombre ?? patientId)
      })

    const resetDemo = () => setState((s) => ({ ...buildSeed(), role: s.role }))

    return {
      ...state,
      setRole,
      addPatient,
      addPrescription,
      createOrder,
      advanceOrder,
      addPayment,
      adjustStock,
      addWaiting,
      setWaitingStatus,
      closeAttention,
      logAccess,
      resetDemo,
      patient: (id) => state.patients.find((p) => p.id === id),
      prescription: (id) => state.prescriptions.find((p) => p.id === id),
      order: (id) => state.orders.find((o) => o.id === id),
      stockStatus: (item) => {
        if (item.stock <= 1) return 'rojo'
        if (item.stock <= item.minimo) return 'amarillo'
        return 'verde'
      },
    }
  }, [state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}

export type { OrderStatus }

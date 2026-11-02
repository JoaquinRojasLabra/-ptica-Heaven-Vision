export type Role = 'admin' | 'tecnologo' | 'vendedora' | 'montajista'

export type OrderStatus =
  | 'recepcion'
  | 'laboratorio'
  | 'montaje'
  | 'lista'
  | 'entregada'

export type Eye = {
  esfera: string
  cilindro: string
  eje: string
  adicion: string
  dp: string
}

export type Prescription = {
  id: string
  patientId: string
  fecha: string
  profesional: string
  od: Eye
  oi: Eye
  agudezaOD: string
  agudezaOI: string
  observaciones: string
}

export type Patient = {
  id: string
  nombre: string
  rut: string
  telefono: string
  email: string
  nacimiento: string
  direccion: string
  convenio: string | null
  createdAt: string
  consentimiento: boolean
  notas: string
  atencionCerrada?: { fecha: string; motivo: string }
}

export type Lens = {
  tipo: string
  material: string
  tratamientos: string[]
  laboratorio: string
  precio: number
}

export type Frame = {
  nombre: string
  precio: number
}

export type OrderEvent = {
  estado: OrderStatus
  fecha: string
  usuario: string
}

export type Order = {
  id: string
  folio: string
  patientId: string
  prescriptionId: string
  estado: OrderStatus
  cristal: Lens
  armazon: Frame
  descuento: number
  total: number
  abono: number
  createdAt: string
  promesa: string
  historial: OrderEvent[]
  recetaComprada: boolean
}

export type InventoryItem = {
  id: string
  sku: string
  tipo: string
  material: string
  tratamientos: string[]
  esfera: string
  cilindro: string
  stock: number
  minimo: number
  costo: number
  precio: number
  laboratorio: string
}

export type Payment = {
  id: string
  orderId: string
  fecha: string
  monto: number
  medio: 'Efectivo' | 'Débito' | 'Crédito' | 'Transferencia'
  usuario: string
}

export type WaitingStatus = 'esperando' | 'en_consulta' | 'atendido'

export type WaitingEntry = {
  id: string
  patientId: string
  motivo: string
  hora: string
  estado: WaitingStatus
}

export type AuditEntry = {
  id: string
  fecha: string
  usuario: string
  rol: Role
  accion: string
  entidad: string
  detalle: string
  hash: string
  prevHash: string
}

export type AppointmentStatus = 'agendada' | 'confirmada' | 'atendida' | 'cancelada'

export type Appointment = {
  id: string
  patientId: string
  fecha: string
  motivo: string
  profesional: string
  estado: AppointmentStatus
  notas: string
}

export type Supplier = {
  id: string
  nombre: string
  tipo: 'Laboratorio' | 'Insumos' | 'Armazones'
  contacto: string
  telefono: string
  email: string
  notas: string
}

export type Purchase = {
  id: string
  supplierId: string
  folio: string
  fecha: string
  descripcion: string
  categoria: 'Cristales' | 'Armazones' | 'Insumos' | 'Otros'
  monto: number
  estado: 'Pendiente' | 'Pagada'
}

export type WarrantyCase = {
  id: string
  orderId: string
  fecha: string
  motivo: string
  resolucion: string
  estado: 'Abierto' | 'Resuelto'
}

export type DemoState = {
  demoDay: string
  role: Role
  patients: Patient[]
  prescriptions: Prescription[]
  orders: Order[]
  inventory: InventoryItem[]
  payments: Payment[]
  waiting: WaitingEntry[]
  audit: AuditEntry[]
  appointments: Appointment[]
  suppliers: Supplier[]
  purchases: Purchase[]
  warranty: WarrantyCase[]
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administradora',
  tecnologo: 'Tecnólogo',
  vendedora: 'Vendedora',
  montajista: 'Montajista',
}

export const ROLE_PERSON: Record<Role, string> = {
  admin: 'Aileen Sazo',
  tecnologo: 'Julio Barrera',
  vendedora: 'Paula Rivas',
  montajista: 'Marcos León',
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  recepcion: 'Recién recibido',
  laboratorio: 'En laboratorio',
  montaje: 'Armando lentes',
  lista: 'Listo para retirar',
  entregada: 'Entregado',
}

export const STATUS_ORDER: OrderStatus[] = [
  'recepcion',
  'laboratorio',
  'montaje',
  'lista',
  'entregada',
]

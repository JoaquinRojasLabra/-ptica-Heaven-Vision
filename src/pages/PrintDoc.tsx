import { ArrowLeft, Printer } from '@phosphor-icons/react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Button } from '../components/UI'
import { age, clp, dateFull } from '../lib/format'
import { useStore } from '../lib/store'
import type { Eye, Order } from '../lib/types'

export default function PrintDoc() {
  const { docId = '', doc = 'ot' } = useParams()
  const { order, prescription, patient } = useStore()

  const isReceta = doc === 'receta'
  const byPrescription = docId.startsWith('pr')
  const o = byPrescription ? undefined : order(docId)
  const r = byPrescription ? prescription(docId) : o ? prescription(o.prescriptionId) : undefined
  const patientId = o?.patientId ?? r?.patientId
  const p = patientId ? patient(patientId) : undefined

  if (!p || !r) return <Navigate to="/ordenes" replace />
  if (!isReceta && !o) return <Navigate to="/ordenes" replace />

  return (
    <div className="min-h-dvh bg-paper pb-16">
      <div className="no-print sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[860px] flex-wrap items-center gap-2 px-4 py-3">
          <Link to={o ? `/ordenes/${o.id}` : `/pacientes/${p.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={15} />
              Volver
            </Button>
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <Link to={`/imprimir/${o?.id ?? r.id}/receta`}>
              <Button variant={isReceta ? 'primary' : 'outline'} size="sm">
                Receta
              </Button>
            </Link>
            {o && (
              <Link to={`/imprimir/${o.id}/ot`}>
                <Button variant={!isReceta ? 'primary' : 'outline'} size="sm">
                  Orden de trabajo
                </Button>
              </Link>
            )}
            <Button variant="copper" size="sm" onClick={() => window.print()}>
              <Printer size={15} />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      <div className="print-sheet mx-auto mt-6 max-w-[820px] bg-white p-8 shadow-[0_2px_20px_rgba(20,24,26,0.08)] sm:p-12">
        <SheetHeader />

        <div className="mt-8 flex items-start justify-between gap-4 border-b border-black/15 pb-4">
          <div>
            <h1 className="font-display text-[30px] leading-none text-black">
              {isReceta ? 'Receta óptica' : 'Orden de trabajo'}
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-black/50">
              {isReceta ? 'Documento clínico' : 'Documento comercial y de garantía'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-black/50">Folio</p>
            <p className="font-mono text-[15px] font-bold text-black">
              {isReceta ? `REC-2026-${r.id.slice(-4).toUpperCase()}` : o?.folio}
            </p>
            <p className="mt-1 text-[10px] text-black/60">
              {dateFull(isReceta ? r.fecha : (o?.createdAt ?? r.fecha))}
            </p>
          </div>
        </div>

        <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
          <Field label="Paciente" value={p.nombre} />
          <Field label="RUT" value={p.rut} />
          <Field label="Edad" value={`${age(p.nacimiento)} años`} />
          <Field label="Teléfono" value={p.telefono} />
          <Field label="Profesional" value={r.profesional} />
          <Field label="Agudeza visual" value={`OD ${r.agudezaOD} · OI ${r.agudezaOI}`} />
        </section>

        <section className="mt-6">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-black/50">
            Refracción
          </p>
          <table className="w-full border-collapse text-center text-[11px]">
            <thead>
              <tr className="border-y border-black/20 bg-black/[0.03] text-[9px] uppercase tracking-wide text-black/60">
                <th className="px-2 py-2 text-left">Ojo</th>
                <th className="px-2 py-2">Esfera</th>
                <th className="px-2 py-2">Cilindro</th>
                <th className="px-2 py-2">Eje</th>
                <th className="px-2 py-2">Adición</th>
                <th className="px-2 py-2">DP</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['OD', r.od],
                ['OI', r.oi],
              ].map(([label, eye]) => {
                const e = eye as Eye
                return (
                  <tr key={label as string} className="border-b border-black/10">
                    <td className="px-2 py-2.5 text-left font-bold">{label as string}</td>
                    <td className="px-2 py-2.5 font-mono">{e.esfera}</td>
                    <td className="px-2 py-2.5 font-mono">{e.cilindro || '—'}</td>
                    <td className="px-2 py-2.5 font-mono">{e.eje || '—'}</td>
                    <td className="px-2 py-2.5 font-mono">{e.adicion}</td>
                    <td className="px-2 py-2.5 font-mono">{e.dp || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {r.observaciones && (
          <section className="mt-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/50">
              Observaciones
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-black/80">{r.observaciones}</p>
          </section>
        )}

        {!isReceta && o && <OrderBody order={o} />}

        <section className="mt-10 grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-full max-w-[220px] border-b border-black/40" />
            <p className="mt-2 text-[10px] font-bold text-black">{r.profesional}</p>
            <p className="text-[9px] text-black/60">Tecnólogo médico · Director técnico</p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-16 w-full max-w-[220px] border-b border-black/40" />
            <p className="mt-2 text-[10px] font-bold text-black">{p.nombre}</p>
            <p className="text-[9px] text-black/60">Firma del paciente</p>
          </div>
        </section>

        {isReceta && (
          <section className="mt-6 flex items-start gap-3 rounded border border-black/20 p-3">
            <div className="grid size-14 shrink-0 place-items-center rounded border border-dashed border-black/30 text-center text-[7px] uppercase leading-tight text-black/40">
              Timbre
              <br />
              establecimiento
            </div>
            <div className="text-[9px] leading-relaxed text-black/70">
              <p className="font-bold text-black">Receta despachada en Óptica Heaven Vision</p>
              <p>Av. Providencia 1234, Ñuñoa, Santiago · +56 2 2345 6789</p>
              <p>
                Registro correlativo N° {r.id.slice(-4).toUpperCase()} · Timbre y lugar en el sistema de
                registro conforme al Decreto 4/1985.
              </p>
            </div>
          </section>
        )}

        <footer className="mt-8 flex items-center justify-between border-t border-black/15 pt-3 text-[8px] text-black/40">
          <span>Óptica Heaven Vision · RUT 76.543.210-8 · Santiago de Chile</span>
          <span>Documento generado el {dateFull(new Date().toISOString())}</span>
        </footer>
      </div>

      {!isReceta && o && (
        <div className="print-sheet mx-auto mt-6 max-w-[820px] break-before-page bg-white p-8 shadow-[0_2px_20px_rgba(20,24,26,0.08)] sm:p-12">
          <h2 className="font-display text-[24px] text-black">Garantía legal y consentimiento informado</h2>
          <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-black/50">
            Reverso de la orden {o.folio}
          </p>

          <div className="mt-5 space-y-4 text-[10px] leading-relaxed text-black/80">
            <Clause n="1" title="Garantía legal de 6 meses">
              La Ley 19.496 establece una garantía legal de seis meses desde la entrega. Cubre fallas de
              fabricación, defectos del cristal o del armazón y errores de montaje imputables al
              establecimiento. No cubre rayaduras por mal uso, golpes, pérdida ni intervenciones de
              terceros.
            </Clause>
            <Clause n="2" title="Bien a medida">
              Los lentes con graduación son bienes confeccionados a medida del paciente. Por ello no
              aplica el derecho a retracto, conforme al artículo 3 bis de la Ley 19.496. El paciente
              declara haber sido informado antes de la compra.
            </Clause>
            <Clause n="3" title="Cuidados y controles">
              Se recomienda limpiar con paño de microfibra, guardar en estuche, no exponer a calor
              directo y realizar un control visual anual. Los controles y ajustes se registran en la
              ficha del paciente.
            </Clause>
            <Clause n="4" title="Datos personales y clínicos">
              El paciente autoriza el tratamiento de sus datos clínicos para la atención, el despacho y
              el seguimiento. La ficha se conserva 15 años desde el último ingreso, conforme a la Ley
              20.584. Puede ejercer sus derechos de acceso, rectificación y portabilidad en el
              establecimiento.
            </Clause>
            <Clause n="5" title="Aviso de retiro">
              El paciente autoriza el uso de su teléfono para recibir el aviso cuando los lentes estén
              listos. No se envían datos clínicos por mensajería.
            </Clause>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="mx-auto h-14 w-full max-w-[240px] border-b border-black/40" />
              <p className="mt-2 text-[10px] font-bold text-black">{p.nombre}</p>
              <p className="text-[9px] text-black/60">Firma de conformidad · {dateFull(new Date().toISOString())}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-14 w-full max-w-[240px] border-b border-black/40" />
              <p className="mt-2 text-[10px] font-bold text-black">Óptica Heaven Vision</p>
              <p className="text-[9px] text-black/60">Timbre y firma del establecimiento</p>
            </div>
          </div>

          <p className="mt-8 text-[8px] leading-relaxed text-black/40">
            Texto v1.0 · Este documento forma parte de la ficha clínica y se conserva por 15 años. La
            versión firmada se archiva con hash de integridad y fecha de firma.
          </p>
        </div>
      )}
    </div>
  )
}

function SheetHeader() {
  return (
    <header className="flex items-start justify-between gap-6">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full border border-black/20">
          <svg viewBox="0 0 32 32" className="size-8" fill="none" aria-hidden="true">
            <circle cx="11.5" cy="16" r="6.2" stroke="#14181A" strokeWidth="1.2" />
            <circle cx="20.5" cy="16" r="6.2" stroke="#14181A" strokeWidth="1.2" />
            <path d="M14.5 11.2c1 1.4 1 8.2 0 9.6M17.5 11.2c-1 1.4-1 8.2 0 9.6" stroke="#B4471F" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="font-display text-[20px] leading-none text-black">Heaven Vision</p>
          <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-black/50">Óptica · Santiago</p>
        </div>
      </div>
      <div className="text-right text-[9px] leading-relaxed text-black/60">
        <p className="font-bold text-black">Av. Providencia 1234, Ñuñoa</p>
        <p>Santiago de Chile</p>
        <p>+56 2 2345 6789</p>
        <p>optica.heaven.vission@gmail.com</p>
      </div>
    </header>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 border-b border-black/10 pb-1">
      <span className="w-20 shrink-0 text-[9px] uppercase tracking-wide text-black/45">{label}</span>
      <span className="font-semibold text-black">{value}</span>
    </div>
  )
}

function OrderBody({ order }: { order: Order }) {
  const saldo = Math.max(0, order.total - order.abono)
  return (
    <>
      <section className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/50">Cristales</p>
          <p className="mt-1 text-[11px] font-bold text-black">
            {order.cristal.tipo} · {order.cristal.material}
          </p>
          <p className="text-[10px] text-black/70">
            {order.cristal.tratamientos.join(', ') || 'Sin tratamientos'}
          </p>
          <p className="text-[10px] text-black/70">{order.cristal.laboratorio}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/50">Armazón</p>
          <p className="mt-1 text-[11px] font-bold text-black">{order.armazon.nombre}</p>
          <p className="text-[10px] text-black/70">Entrega prometida: {dateFull(order.promesa)}</p>
        </div>
      </section>

      <section className="mt-5 ml-auto w-full max-w-[300px] text-[10px]">
        <div className="flex justify-between border-b border-black/10 py-1">
          <span className="text-black/60">Cristales</span>
          <span className="font-mono">{clp(order.cristal.precio)}</span>
        </div>
        <div className="flex justify-between border-b border-black/10 py-1">
          <span className="text-black/60">Armazón</span>
          <span className="font-mono">{clp(order.armazon.precio)}</span>
        </div>
        {order.descuento > 0 && (
          <div className="flex justify-between border-b border-black/10 py-1">
            <span className="text-black/60">Descuentos</span>
            <span className="font-mono">− {clp(order.descuento)}</span>
          </div>
        )}
        <div className="flex justify-between border-b border-black/30 py-1.5 font-bold">
          <span>Total</span>
          <span className="font-mono">{clp(order.total)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-black/60">Abono</span>
          <span className="font-mono">{clp(order.abono)}</span>
        </div>
        <div className="flex justify-between py-1 font-bold">
          <span>Saldo</span>
          <span className="font-mono">{clp(saldo)}</span>
        </div>
      </section>
    </>
  )
}

function Clause({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-5 shrink-0 place-items-center rounded-full border border-black/30 text-[8px] font-bold text-black/70">
        {n}
      </span>
      <p>
        <strong className="font-bold text-black">{title}. </strong>
        {children}
      </p>
    </div>
  )
}

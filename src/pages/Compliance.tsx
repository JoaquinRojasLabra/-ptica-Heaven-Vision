import { useState } from 'react'
import {
  CheckCircle,
  ClockCounterClockwise,
  CloudArrowUp,
  Eye,
  FileArrowDown,
  Fingerprint,
  LockKey,
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react'
import { Badge, Button, Card, PageTitle, cx } from '../components/UI'
import { dateFull, dateTime, hashText } from '../lib/format'
import { useStore } from '../lib/store'
import { ROLE_LABEL, type Role } from '../lib/types'

export default function Compliance() {
  const { audit, patients, prescriptions, orders, payments } = useStore()
  const [check, setCheck] = useState<null | { ok: boolean; count: number; broken: string | null }>(null)

  const verify = () => {
    let prev = 'GENESIS'
    for (const entry of audit) {
      const expected = hashText(prev + entry.fecha + entry.accion + entry.entidad + entry.detalle)
      if (entry.prevHash !== prev || entry.hash !== expected) {
        setCheck({ ok: false, count: audit.length, broken: entry.id })
        return
      }
      prev = entry.hash
    }
    setCheck({ ok: true, count: audit.length, broken: null })
  }

  const exportAll = () => {
    const payload = {
      sistema: 'Heaven Vision',
      generado: new Date().toISOString(),
      tipo: 'Exportación para fiscalización (demo)',
      resumen: {
        pacientes: patients.length,
        recetas: prescriptions.length,
        ordenes: orders.length,
        pagos: payments.length,
        registros_auditoria: audit.length,
      },
      manifest: {
        hash_raiz: audit.at(-1)?.hash ?? 'GENESIS',
        algoritmo: 'SHA-256 (simulado en demo)',
        retencion: '15 años desde el último ingreso',
      },
      pacientes: patients,
      recetas: prescriptions,
      ordenes: orders,
      pagos: payments,
      auditoria: audit,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `heaven-vision-fiscalizacion-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const consents = patients.filter((p) => p.consentimiento).length
  const last = audit.at(-1)

  return (
    <div>
      <PageTitle
        title="Cumplimiento"
        subtitle="Lo que la óptica puede demostrar cuando llegue la fiscalización."
        action={
          <Button variant="primary" onClick={exportAll}>
            <FileArrowDown size={17} />
            Exportar para fiscalización
          </Button>
        }
      />

      <section className="relative mt-6 overflow-hidden rounded-[20px] bg-ink p-6 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-brand/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative grid gap-6 sm:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Retención legal
            </p>
            <p className="mt-2 font-display text-[58px] leading-[0.9] text-white sm:text-[68px]">
              15 <span className="text-[24px] font-semibold tracking-normal text-white/65">años</span>
            </p>
            <p className="mt-4 max-w-md text-[12.5px] leading-relaxed text-white/70">
              Fichas clínicas, recetas y órdenes se conservan desde el último ingreso de información,
              según la Ley 20.584 y el Decreto 41/2012. Nada se borra: se enmienda con autor, motivo y
              fecha.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 self-end">
            <MiniStat label="Pacientes" value={patients.length} />
            <MiniStat label="Recetas" value={prescriptions.length} />
            <MiniStat label="Órdenes" value={orders.length} />
            <MiniStat label="Consentimientos" value={`${consents}/${patients.length}`} />
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Feature
          icon={<LockKey size={19} />}
          title="Ficha inmutable"
          text="Sin borrado. Cada cambio queda versionado con usuario y fecha."
        />
        <Feature
          icon={<Fingerprint size={19} />}
          title="Auditoría encadenada"
          text="Cada registro incluye el hash del anterior. Alterar uno rompe la cadena."
        />
        <Feature
          icon={<CloudArrowUp size={19} />}
          title="Respaldo externo"
          text="Copia diaria cifrada en almacenamiento independiente, con retención de 15 años."
        />
        <Feature
          icon={<Eye size={19} />}
          title="Accesos registrados"
          text="Quién entró, qué ficha vio y cuándo. La contadora no tiene acceso."
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-xl text-ink">Registro de auditoría</h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Solo se agrega · {audit.length} registros · último {last ? dateTime(last.fecha) : '—'}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={verify}>
              <ShieldCheck size={15} />
              Verificar integridad
            </Button>
          </div>

          {check && (
            <div
              className={cx(
                'flex items-start gap-2 border-b px-5 py-3 text-[12px] font-semibold',
                check.ok
                  ? 'border-pine/20 bg-pine-soft text-pine'
                  : 'border-danger/20 bg-danger-soft text-danger',
              )}
            >
              {check.ok ? <CheckCircle size={16} className="mt-0.5" /> : <WarningCircle size={16} className="mt-0.5" />}
              {check.ok
                ? `Cadena íntegra: ${check.count} registros verificados. Ningún hash fue alterado.`
                : `Se detectó una alteración en el registro ${check.broken}. La cadena no es válida.`}
            </div>
          )}

          <div className="max-h-[440px] overflow-auto scrollbar-thin">
            <table className="w-full min-w-[640px] text-left">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-line text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                  <th className="px-5 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Usuario</th>
                  <th className="px-3 py-2.5">Acción</th>
                  <th className="px-3 py-2.5">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...audit].reverse().map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-paper/60">
                    <td className="tnum whitespace-nowrap px-5 py-2.5 text-[10px] text-muted">
                      {dateTime(entry.fecha)}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-[11px] font-bold text-ink">{entry.usuario}</p>
                      <p className="text-[9px] text-muted">{ROLE_LABEL[entry.rol]}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-ink">{entry.accion}</p>
                      <p className="max-w-[220px] truncate text-[9px] text-muted">{entry.detalle}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-[9px] text-ink-soft">
                        {entry.hash.slice(0, 10)}…
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line bg-white/50 px-5 py-2.5 text-[10px] leading-relaxed text-muted">
            En producción, la raíz de la cadena se ancla a diario fuera de la base de datos (WORM), de
            modo que ni el administrador puede reescribir el historial.
          </p>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-xl text-ink">
              <ClockCounterClockwise size={19} className="text-brand" />
              Retención y respaldo
            </h2>
            <ul className="mt-3 space-y-2.5">
              {[
                ['Fichas, recetas y órdenes', '15 años'],
                ['Registro de auditoría', 'Permanente'],
                ['Respaldo diario', 'Cifrado, externo'],
                ['Restauración probada', 'Mensual'],
                ['Exportación', 'PDF · CSV · JSON'],
              ].map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-muted">{k}</span>
                  <span className="font-bold text-ink">{v}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-[8px] bg-paper/80 px-3 py-2 text-[10px] leading-relaxed text-muted">
              El respaldo no reemplaza la ficha: es una copia. La fuente de verdad sigue siendo la base
              de datos con control de acceso.
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-xl text-ink">Quién puede hacer qué</h2>
            <div className="mt-3 overflow-hidden rounded-[10px] border border-line">
              <table className="w-full text-[10px]">
                <thead className="bg-paper/70 text-[8px] font-bold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-2 py-2 text-left">Rol</th>
                    <th className="px-1 py-2">Clínico</th>
                    <th className="px-1 py-2">Comercial</th>
                    <th className="px-1 py-2">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(
                    [
                      ['admin', 'Ver', 'Total', 'Total'],
                      ['tecnologo', 'Editar', '—', 'Ver'],
                      ['vendedora', '—', 'Ventas', 'Ver'],
                      ['montajista', '—', '—', 'Estados'],
                    ] as Array<[Role, string, string, string]>
                  ).map(([r, a, b, c]) => (
                    <tr key={r}>
                      <td className="px-2 py-2 font-bold text-ink">{ROLE_LABEL[r]}</td>
                      <td className={cx('px-1 py-2 text-center', a === '—' ? 'text-muted/50' : 'text-ink-soft')}>{a}</td>
                      <td className={cx('px-1 py-2 text-center', b === '—' ? 'text-muted/50' : 'text-ink-soft')}>{b}</td>
                      <td className={cx('px-1 py-2 text-center', c === '—' ? 'text-muted/50' : 'text-ink-soft')}>{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              La administradora no modifica la sección clínica. El tecnólogo no accede a caja ni
              contabilidad. La contadora trabaja fuera del sistema, con reportes exportables.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-xl text-ink">Consentimientos</h2>
            <ul className="mt-3 divide-y divide-line">
              {patients.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center gap-2 py-2">
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-ink">{p.nombre}</span>
                  <Badge tone={p.consentimiento ? 'pine' : 'danger'} dot>
                    {p.consentimiento ? 'Firmado' : 'Pendiente'}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-muted">
              Firmado en la OT · {dateFull(new Date().toISOString())} · versión del texto v1.0
            </p>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Legal title="SEREMI de Salud" text="Ficha clínica, recetas timbradas y registro correlativo bajo custodia del director técnico." />
        <Legal title="SII" text="Boletas y facturas en Klap. El sistema conserva el respaldo de ventas y pagos." />
        <Legal title="Ley 21.719" text="Datos de salud sensibles: consentimiento, acceso restringido, brechas y derechos del titular." />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">{label}</p>
      <p className="tnum mt-1 font-display text-2xl text-white">{value}</p>
    </div>
  )
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="p-4">
      <span className="grid size-9 place-items-center rounded-[9px] bg-brand-soft text-brand">{icon}</span>
      <p className="mt-3 text-[13px] font-bold text-ink">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">{text}</p>
    </Card>
  )
}

function Legal({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand">{title}</p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{text}</p>
    </div>
  )
}

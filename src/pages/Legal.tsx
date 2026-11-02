import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from '@phosphor-icons/react'
import { Card, PageTitle } from '../components/UI'

function LegalShell({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} /> Volver al inicio
      </Link>
      <div className="mt-3">
        <PageTitle title={title} subtitle={`Última actualización: ${updated}`} />
      </div>
      <Card className="mt-5 p-6 sm:p-8">
        <div className="legal space-y-5 text-[13.5px] leading-relaxed text-ink-soft">{children}</div>
      </Card>
    </div>
  )
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-[18px] text-ink">{children}</h2>
)

const List = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-1.5 pl-5">
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
)

export function Privacidad() {
  return (
    <LegalShell title="Política de privacidad" updated="2 de noviembre de 2026">
      <div className="flex items-start gap-3 rounded-[12px] bg-brand-soft p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-[12.5px] text-brand-deep">
          Heaven Vision trata datos personales y datos sensibles de salud. Esta política explica qué
          se guarda, para qué, cuánto tiempo y cómo se ejerce el derecho a acceder, rectificar y
          eliminar la información que la ley permita eliminar.
        </p>
      </div>

      <H>1. Quién es el responsable</H>
      <p>
        Heaven Vision, óptica con domicilio en Santiago de Chile, es responsable de los datos que se
        registran en este sistema. Contacto del responsable:{' '}
        <strong className="text-ink">privacidad@heavenvision.cl</strong>.
      </p>

      <H>2. Qué datos se tratan</H>
      <List
        items={[
          'Identificación: nombre, RUT, fecha de nacimiento, teléfono, correo y dirección.',
          'Datos de salud (sensibles): agudeza visual, refracción, observaciones clínicas y recetas.',
          'Datos comerciales: cotizaciones, pedidos, pagos y convenios.',
          'Datos de uso: accesos a fichas clínicas y acciones realizadas en el sistema, con usuario y fecha.',
        ]}
      />

      <H>3. Para qué se usan</H>
      <List
        items={[
          'Prestar la atención visual, emitir recetas y fabricar los lentes.',
          'Gestionar pedidos, pagos, garantías y postventa.',
          'Cumplir obligaciones legales de registro clínico y tributarias.',
          'Enviar avisos relacionados con el pedido (por ejemplo, lentes listos).',
        ]}
      />
      <p>
        No se usan para publicidad ajena al pedido ni se venden a terceros. Los datos se comparten
        solo con el laboratorio que fabrica los cristales, cuando es necesario para el pedido, y con
        los organismos que la ley obligue.
      </p>

      <H>4. Base legal</H>
      <List
        items={[
          'Ley 19.628 y Ley 21.719 sobre protección de datos personales: consentimiento, finalidad, proporcionalidad y seguridad.',
          'Ley 20.584 sobre derechos y deberes de los pacientes: confidencialidad de la ficha clínica y acceso a ella.',
          'Decreto 41/2012 del Ministerio de Salud: contenido y conservación de la ficha clínica.',
          'Ley 19.496 sobre protección de los derechos del consumidor: garantía legal de 6 meses.',
        ]}
      />

      <H>5. Plazos de conservación</H>
      <p>
        La ficha clínica, las recetas y los registros de atención se conservan por <strong>15 años</strong>{' '}
        desde el último ingreso de información, conforme al Decreto 41/2012. Los documentos
        comerciales se conservan por el plazo tributario aplicable. Cumplido el plazo, se eliminan de
        forma segura, salvo que exista un deber legal de conservarlos por más tiempo.
      </p>
      <p>
        La información no se borra: se enmienda. Cada cambio queda en el registro de auditoría con
        usuario, fecha, motivo y el hash del registro anterior.
      </p>

      <H>6. Seguridad</H>
      <p>
        El acceso se restringe por rol: la administradora no puede editar la ficha clínica, la
        vendedora no accede a datos clínicos y el montajista solo ve el estado del taller. Cada
        consulta a una ficha queda registrada. El registro de auditoría es encadenado con SHA-256, de
        modo que cualquier alteración rompe la cadena y puede detectarse.
      </p>
      <p className="rounded-[10px] bg-amber-soft px-3 py-2 text-[12px] text-amber">
        Versión de demostración: los datos se guardan solo en este navegador y no se comparten entre
        equipos. En producción se almacenan en un servidor con acceso autenticado, cifrado en
        tránsito y respaldo diario.
      </p>

      <H>7. Derechos de la persona titular</H>
      <List
        items={[
          'Acceder a los datos que tenemos sobre usted y solicitar una copia.',
          'Rectificar datos incorrectos o incompletos.',
          'Solicitar la eliminación cuando la ley lo permita (la ficha clínica no se elimina antes de 15 años).',
          'Oponerse al tratamiento para fines distintos de la atención.',
          'Revocar el consentimiento para comunicaciones comerciales.',
        ]}
      />
      <p>
        Para ejercerlos, escriba a <strong className="text-ink">privacidad@heavenvision.cl</strong> o
        solicítelo en el mesón. Responderemos dentro de los plazos legales. También puede reclamar
        ante la Agencia de Protección de Datos Personales.
      </p>

      <H>8. Consentimiento</H>
      <p>
        Antes de la primera atención se solicita el consentimiento informado para tratar los datos
        necesarios. Se registra la fecha, la versión del texto aceptado y quién lo tomó. El
        consentimiento puede revocarse, sin afectar la atención ni los registros ya generados.
      </p>

      <H>9. Cookies y almacenamiento local</H>
      <p>
        Este sistema no usa cookies publicitarias. En la demo se utiliza almacenamiento local del
        navegador para mantener los datos de ejemplo entre pantallas.
      </p>
    </LegalShell>
  )
}

export function Terminos() {
  return (
    <LegalShell title="Términos de uso" updated="2 de noviembre de 2026">
      <H>1. Qué es este sistema</H>
      <p>
        Heaven Vision es un software de gestión para ópticas: ficha clínica, recetas, cotizaciones,
        pedidos, inventario, caja, compras y reportes. <strong>No es un dispositivo médico</strong> y
        no reemplaza el juicio del profesional que realiza el examen visual.
      </p>

      <H>2. Recetas y documentos</H>
      <p>
        Las recetas que emite el sistema son documentos de apoyo a la atención y se firman por el
        profesional habilitado. El timbre y los datos del establecimiento deben corresponder a la
        óptica. La receta no constituye por sí sola una autorización para conducir ni un certificado
        médico.
      </p>

      <H>3. Documentos tributarios</H>
      <p>
        El sistema <strong>no emite boletas ni facturas electrónicas (DTE)</strong>. Registra pagos y
        cuadra la caja contra el POS Klap, que es el emisor de los documentos tributarios. El cierre
        diario debe coincidir con el reporte del POS antes de cerrarse.
      </p>

      <H>4. Garantía legal</H>
      <p>
        Los lentes y armazones tienen la garantía legal de 6 meses de la Ley 19.496. La garantía
        cubre fallas de fabricación y no el mal uso, los golpes ni los cambios de graduación. Los
        lentes fabricados a medida no tienen derecho a retracto, lo que se informa por escrito en el
        reverso de la orden de trabajo.
      </p>

      <H>5. Uso correcto</H>
      <List
        items={[
          'Cada persona usa su propio usuario; no se comparten claves.',
          'Los roles se asignan según la función real: administración, tecnólogo, venta y taller.',
          'No se deben registrar datos de terceros sin su consentimiento.',
          'Los datos clínicos no se modifican fuera de una atención ni se eliminan.',
        ]}
      />

      <H>6. Disponibilidad y respaldo</H>
      <p>
        El sistema se entrega con respaldo diario y registro de auditoría. Ante una caída, la óptica
        puede seguir atendiendo con el formulario en papel y luego digitalizar la atención, dejando
        registro del motivo.
      </p>

      <H>7. Límites de responsabilidad</H>
      <p>
        El software no reemplaza la evaluación clínica, la verificación de la graduación ni el
        cumplimiento de las normas sanitarias por parte del establecimiento. La óptica es responsable
        de la veracidad de los datos que ingresa y de la custodia de sus credenciales.
      </p>

      <H>8. Contacto</H>
      <p>
        Consultas sobre estos términos:{' '}
        <strong className="text-ink">contacto@heavenvision.cl</strong>.
      </p>
    </LegalShell>
  )
}

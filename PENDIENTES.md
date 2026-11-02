# Pendientes · Heaven Vision

Estado al 2 de noviembre de 2026. La demo (localStorage) cubre el ciclo completo y los módulos
esenciales del levantamiento. Lo de abajo es lo que falta para pasar a producción o cerrar del todo
el cumplimiento.

## 1. Producción (bloqueante antes de usar con pacientes reales)

- [ ] **Base de datos real**: Supabase (Postgres) + Row Level Security por rol y sucursal.
      Hoy los datos viven en `localStorage` de cada navegador: no se comparten entre el PC de
      mostrador y el del tecnólogo.
- [ ] **Autenticación real**: login con usuario y contraseña, sesión persistente y cierre por
      inactividad. Hoy el cambio de rol es un selector de demo sin contraseña.
- [ ] **Migración** de los 500 pacientes y sus recetas desde los Excel actuales, con validación de
      RUT y revisión manual de duplicados.
- [ ] **Respaldo externo cifrado** diario, con prueba de restauración mensual.
- [ ] **Anclaje diario de la auditoría**: publicar el hash raíz del día en un almacenamiento externo
      (o enviarlo por correo a la administradora) para que la cadena no pueda reescribirse completa.
- [ ] **Variables de entorno y secretos** fuera del repositorio; rotar los tokens de demo.
- [ ] **Conectar la GitHub App de Vercel** para que cada push publique solo (hoy el deploy es manual).

## 2. Legal / cumplimiento

- [ ] **Contrato de encargado de tratamiento** con el proveedor de nube (Ley 21.719).
- [ ] **Consentimiento firmado**: hoy se marca un check y se registra la fecha; falta la versión
      firmada (papel o firma electrónica) y su archivo adjunto.
- [ ] **Procedimiento de derechos del titular** (acceso, rectificación, eliminación, oposición):
      existe la vía de contacto, falta el flujo formal con plazo de respuesta.
- [ ] **Revisión por abogado** de la política de privacidad, los términos y el texto de
      consentimiento antes de publicarlos como definitivos.
- [ ] **Registro de incidentes** de seguridad y protocolo de notificación.
- [ ] **Política de retención y borrado** documentada para datos que no son ficha clínica.
- [ ] **Verificar el timbre Decreto 4/1985** en la impresión de recetas con la Seremi correspondiente.
- [ ] **Confirmar con el contador** que el respaldo del POS Klap cumple como documento tributario.

## 3. Funcionalidad pendiente (no bloqueante para el demo)

- [ ] **Inventario de armazones y accesorios** con stock, mínimo y descuento automático al vender.
      Hoy la lista de armazones es fija en la cotización.
- [ ] **Alerta de insumo faltante por pedido** antes de crear la orden de trabajo.
- [ ] **Reporte mensual en PDF** además del CSV (hoy se exporta CSV para la contadora).
- [ ] **Borrado de duplicados de pacientes** por el tecnólogo, con aviso y registro en auditoría
      (hoy solo se pueden cerrar atenciones, no borrar).
- [ ] **Aviso automático por WhatsApp** al quedar los lentes listos (hoy se abre `wa.me` con el
      mensaje escrito, pero el envío es manual).
- [ ] **Firma del paciente en la entrega** capturada en pantalla y guardada en el pedido.
- [ ] **Adjuntar la receta externa** escaneada cuando el paciente llega con una receta de otro
      profesional.
- [ ] **Historial de cambios por campo** en la ficha clínica (hoy se registra la acción, no el diff).
- [ ] **Multi-sucursal**, cuando corresponda.

## 4. Experiencia de uso (a revisar con usuarios reales)

- [ ] Probar el recorrido completo con Aileen y Julio en el PC del mostrador y en el celular.
- [ ] Medir cuántos clics toma registrar una llegada y crear un pedido; objetivo: 3 y 6 clics.
- [ ] Revisar los textos con ellos: "pedido" vs "orden", "cierre de caja", "postventa".
- [ ] Definir qué pasa cuando se cae internet a mitad de una venta.
- [ ] Capacitación corta (30 min) y guía impresa de una página por rol.

## 5. Deuda técnica

- [ ] Código dividido por rutas (hoy el bundle pasa de 700 kB y Vercel avisa).
- [ ] Tests automatizados del flujo crítico y de la cadena de auditoría.
- [ ] Monitoreo de errores (Sentry o similar) y métricas de uso.
- [ ] Revisar accesibilidad con lector de pantalla (NVDA o VoiceOver) y navegación solo con teclado.

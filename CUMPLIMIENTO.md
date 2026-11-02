# Cumplimiento de requisitos — Heaven Vision

Auditoría del sistema contra el `Levantamiento de Requisitos` firmado por Aileen Sazo el 30/10/2026.
Estados: **Cumple** · **Parcial** · **Falta** · **Fuera de la demo**.

---

## 1. Los tres problemas que el cliente declaró (sección 2.2)

| Problema | Cómo lo resuelve el sistema | Estado |
|---|---|---|
| Planillas de Excel desconectadas; los datos se repiten en cada etapa | Una sola ficha de paciente alimenta recepción, examen, receta, cotización, pedido, pago y entrega. Ningún paso vuelve a pedir nombre, RUT ni receta. | Cumple |
| La atención no se cruza con el stock ni con la contabilidad | Al cotizar se descuenta el cristal del stock; el pedido guarda cristal, armazón, descuento, abono y saldo; la caja cuadra por medio de pago contra Klap. | Cumple |
| Seguimiento manual de pedidos, sin alertas | Tablero de 5 estados, avance por rol, alertas de pedidos atrasados, lentes listos, stock bajo y pacientes esperando. | Cumple |

## 2. Lo que funciona hoy y no se debe perder (2.3)

| Requisito | Implementación | Estado |
|---|---|---|
| Flujo presencial mesón → consulta → mesón | Sala de espera compartida, atención desde el mesón y retorno automático a la ficha. | Cumple |
| 1 hora con stock monofocal / 3–4 días / 10–15 días externos | La cotización calcula el plazo según el cristal elegido y la fecha prometida se guarda en el pedido. | Cumple |
| El paciente puede no comprar, llevarse cotización, chequeo o comprar la receta | La receta queda en la ficha; la cotización se regenera; existe descuento por receta ya comprada y botón **Cerrar sin venta** con motivo. | Cumple |

## 3. Ciclo completo (sección 3)

| Paso | Estado | Dónde |
|---|---|---|
| Llegada y registro | Cumple | Sala → Registrar llegada |
| Aviso al tecnólogo / espera | Cumple | Sala en vivo (refresco cada 30 s) |
| Examen visual | Cumple | Consulta |
| Emisión de receta | Cumple | Consulta → Emitir receta |
| Cotización | Cumple | Cotización |
| Decisión de compra | Cumple | Cotización o **Cerrar sin venta** |
| Orden de trabajo | Cumple | Cotización → Crear pedido |
| Envío a laboratorio | Cumple | Estado del pedido |
| Recepción de lentes del laboratorio | Cumple | Estado "En laboratorio" → "Armando lentes" |
| Aviso de lentes listos | Parcial | Botón **Avisar** abre WhatsApp con mensaje; no hay envío automático |
| Entrega y pago con firma | Cumple | Pedido → Entregar + impresión con firmas |
| Postventa / garantía 6 meses | Falta | Solo está el reverso impreso; no hay registro de casos |

## 4. Módulos (sección 4)

| Módulo | Prioridad | Estado | Nota |
|---|---|---|---|
| Ficha de paciente | E | Cumple | Ingreso único, historial, consentimiento |
| Recetas | E | Cumple | Registro, historial e impresión con firmas |
| Órdenes de trabajo | E | Cumple | Creación automática, estados, impresión frente/reverso |
| Inventario de cristales | E | Cumple | Graduación, tipo, material, tratamientos, laboratorio, stock y descuento |
| Inventario de armazones y accesorios | D | Falta | Los armazones están en una lista fija dentro de la cotización, no en inventario |
| Stock mínimo y alertas | E | Cumple | Amarillo en mínimo, rojo en crítico, alerta de reposición |
| Sala de espera visible | E | Cumple | Tiempo real por refresco |
| Agenda de citas | E | **Falta** | No existe módulo de agenda |
| Ventas, cobros y medios de pago | E | Cumple | Abonos, saldo, efectivo/débito/crédito/transferencia |
| Contabilidad básica | E | Parcial | Caja y cuadre Klap sí; no hay egresos, compras ni margen por pedido |
| Reportes y estadísticas | E | **Falta** | Solo indicadores del inicio, sin reportes exportables |
| Aviso al paciente | D | Parcial | WhatsApp manual con mensaje prellenado |
| Proveedores y laboratorios | E | **Falta** | El laboratorio es un texto en el cristal |
| Resguardo 15 años / fiscalización | E | Cumple (demo) | Auditoría encadenada, verificación y export completo |

## 5. Inventario (sección 5)

| Requisito | Estado |
|---|---|
| Cristales por graduación/tipo/material/tratamiento/laboratorio | Cumple |
| Mínimo 2 amarillo / 1 rojo | Cumple |
| Descuento automático al usar en un pedido | Cumple |
| Armazones y accesorios (líquidos, paños, estuches) por caja/lote | Falta |
| Lotes o series individuales | No aplica (el cliente no los controla) |

## 6. Alertas (sección 6)

| Alerta | Estado |
|---|---|
| Poco stock (pantalla, administrador) | Cumple |
| Falta un insumo para un pedido | Parcial: se ve el stock del cristal, no una reserva por pedido |
| Lentes listos (WhatsApp al paciente) | Parcial: enlace manual |
| Pedido atrasado > 10 días | Cumple: se marca al pasar la fecha prometida |
| Paciente esperando (tecnólogo, tiempo real) | Cumple |

## 7. Roles (sección 7)

| Rol | Requisito | Estado |
|---|---|---|
| Administradora | Todo, sin modificar lo clínico | Cumple: ve la consulta en solo lectura |
| Tecnólogo | Solo consulta e historial; sin acceso comercial | Cumple: menú y tablero sin pedidos, saldos ni caja |
| Vendedora | Fichas, pagos, stock y su propio cierre | Cumple |
| Montajista | Solo trabajos y estados | Cumple: sin pacientes, sala, precios ni caja |
| Eliminar paciente duplicado (tecnólogo, avisa al admin) | **Falta**: no hay borrado; se decidió no exponerlo en la demo |

## 8. Impresión (sección 8)

| Requisito | Estado |
|---|---|
| Orden con firma de recepción y garantía al reverso | Cumple (5 cláusulas, 6 meses, exclusión de retracto) |
| Receta con formato y firmas | Cumple |
| Impresora multifuncional | Cumple: impresión del navegador |

## 9. Cumplimiento normativo (sección 9)

| Requisito | Estado |
|---|---|
| Ficha/receta/pedido inmutables | Cumple en la lógica: no hay edición ni borrado; se agrega historial |
| Retención 15 años | Declarada y visible; en demo no hay respaldo real |
| Auditoría append-only con cadena de hashes | Cumple: SHA-256 real, encadenado con `prevHash` y verificable en la pantalla de Cumplimiento |
| Registro de accesos | Cumple: cada apertura de ficha se audita |
| Consentimiento | Cumple: campo firmado y visible |
| Export para fiscalización | Cumple: JSON con pacientes, recetas, pedidos, pagos, auditoría y hash raíz |
| Respaldo externo cifrado y restauración probada | **Falta**: es infraestructura, no demo |
| Servidores en Chile | **Fuera de la demo**: Vercel (EE. UU.) con datos locales del navegador |

## 10. Contabilidad (sección 10)

| Requisito | Estado |
|---|---|
| Registrar ventas y abonos | Cumple |
| Cierre diario que cuadre con Klap | Cumple, con bloqueo si no cuadra |
| Compras y facturas solo administradora | Falta el módulo de compras |
| Costo y margen por pedido | Falta: el costo del cristal existe en inventario, pero no se guarda en el pedido |
| Reporte mensual para la contadora | Falta exportación de compras/ventas en Excel o PDF |
| No emitir documentos tributarios | Cumple: se declara que los emite Klap |

## 11. Reportes (sección 12)

| Reporte | Estado |
|---|---|
| Cierre de caja diario | Cumple |
| Compras y facturas | Falta |
| Stock y rotación | Parcial: valor y alertas, sin rotación |
| Costos y márgenes por pedido | Falta |

## 12. Cosas de más (limpieza)

- Se eliminó la promesa de "aviso por WhatsApp" que no hacía nada: ahora el botón abre WhatsApp con el mensaje y el folio.
- El montajista ya no ve montos ni saldos en el tablero ni en pedidos.
- Se mantienen las tarjetas de SEREMI/SII/Ley 21.719 porque son evidencia para fiscalización, no decoración.
- El 15 % de convenio y los $15.000 de receta comprada son **supuestos de demo**: deben confirmarse con la clienta.

## 13. Pendientes antes de producción (no son demo)

1. **Agenda de citas** (esencial).
2. **Reportes exportables** y **margen por pedido** (esencial).
3. **Compras, facturas y proveedores** (esencial).
4. **Postventa y garantía** con casos y resolución (pedido explícito).
5. **Inventario de armazones y accesorios** (deseable).
6. **Supabase + RLS + respaldo** y anclaje diario del hash raíz.
7. **Migración de los ~500 pacientes** desde Excel.
8. **Eliminación controlada de duplicados** con aviso a la administradora.

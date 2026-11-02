# Traspaso del proyecto — Heaven Vision

Documento para que otra persona pueda retomar el trabajo sin contexto previo.
Estado: **demo funcional publicada**, no un sistema en producción.

- Demo: https://heaven-vision.vercel.app
- Repo: https://github.com/JoaquinRojasLabra/-ptica-Heaven-Vision
- Pendientes reales: [`PENDIENTES.md`](./PENDIENTES.md)
- Cumplimiento normativo: [`CUMPLIMIENTO.md`](./CUMPLIMIENTO.md)

---

## 1. Qué es esto

Sistema de gestión para una óptica en Santiago. Cubre el ciclo completo:

```
llegada → sala de espera → examen visual → receta → cotización → pedido
→ laboratorio → montaje → lentes listos → aviso → entrega → postventa
```

Además: inventario de cristales con stock mínimo, caja diaria cuadrada contra el POS Klap,
compras y proveedores, reportes con margen por pedido, agenda de citas, auditoría
encadenada con SHA-256 y exportación para fiscalización.

La demo usa datos de ejemplo y guarda todo en el navegador. **No hay backend ni base de datos
todavía**; la capa de estado está aislada para reemplazarla por Supabase sin tocar las pantallas.

## 2. Stack

| Pieza | Versión / decisión |
| --- | --- |
| Build | Vite 8 |
| UI | React 19 + TypeScript |
| Estilos | Tailwind CSS v4 (tokens en `src/index.css`, bloque `@theme`) |
| Animación | Framer Motion (`MotionConfig reducedMotion="user"` en `main.tsx`) |
| Iconos | `@phosphor-icons/react` |
| Router | React Router 7 (`BrowserRouter`) |
| Persistencia demo | `localStorage`, clave `hv-demo-v4` |
| Deploy | Vercel (build remoto, SPA con rewrites en `vercel.json`) |

Requisitos: Node 20+ y npm.

## 3. Cómo correr

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción
npx tsc -b       # chequeo de tipos (debe pasar sin errores)
```

En Windows/PowerShell, si `npm run build` imprime un warning de `NativeCommandError`, es solo
cómo PowerShell interpreta la salida de Vite; el build igual termina con `✓ built in`.

## 4. Cómo desplegar

El proyecto está enlazado a Vercel en `.vercel/project.json` (proyecto `heaven-vision`).

```bash
npx -y vercel@latest deploy --prod --yes
```

La primera vez pide login (`npx vercel login`). **El auto-deploy desde GitHub no está conectado**:
falta instalar la GitHub App de Vercel en el repo. Mientras no se haga, cada publicación es manual.

## 5. Mapa del código

```
src/
  App.tsx                 rutas + guardas por rol + transición entre páginas
  main.tsx                providers (Router, Store, MotionConfig)
  index.css               design tokens (@theme), base, utilities, print
  components/
    Layout.tsx            sidebar, topbar, nav por rol, bottom nav, drawer móvil
    UI.tsx                Button, Badge, Card, PageTitle, Stat, Modal, Field, Input, Select…
    Guard.tsx             RequireRole: bloquea rutas por rol
  lib/
    types.ts              modelo de datos y etiquetas (roles, estados)
    seed.ts               datos de ejemplo (10 pacientes, 7 pedidos, citas, compras…)
    store.tsx             estado global, acciones, auditoría encadenada, persistencia
    sha256.ts             SHA-256 síncrono (FIPS 180-4)
    format.ts             CLP, fechas es-CL, edades, hashText, helpers
  pages/                  una página por módulo (ver tabla de rutas)
```

### Rutas y quién entra

| Ruta | Página | admin | tecnólogo | vendedora | montajista |
| --- | --- | :---: | :---: | :---: | :---: |
| `/` | Inicio / mostrador | ✓ | ✓ | ✓ | ✓ |
| `/sala` | Sala de espera | ✓ | ✓ | ✓ | — |
| `/agenda` | Agenda de citas | ✓ | ✓ | ✓ | — |
| `/pacientes`, `/pacientes/:id` | Fichas | ✓ | ✓ | ✓ | — |
| `/consulta/:id` | Examen visual y receta | ✓ (solo lectura) | ✓ | — | — |
| `/cotizacion/:id` | Cotización / nueva venta | ✓ | — | ✓ | — |
| `/ordenes`, `/ordenes/:id` | Pedidos y taller | ✓ | — | ✓ | ✓ |
| `/inventario` | Cristales | ✓ | — | ✓ | ✓ |
| `/caja` | Caja del día | ✓ | — | ✓ | — |
| `/compras` | Compras y proveedores | ✓ | — | — | — |
| `/reportes` | Reportes y margen | ✓ | — | — | — |
| `/postventa` | Garantías | ✓ | — | ✓ | — |
| `/cumplimiento` | Auditoría y fiscalización | ✓ | — | — | — |
| `/privacidad`, `/terminos` | Legales (públicas) | ✓ | ✓ | ✓ | ✓ |
| `/imprimir/:id/:doc` | Receta / pedido imprimible | ✓ | ✓ | ✓ | ✓ |

Las guardas están en `App.tsx` con `RequireRole`. Ocultar un ítem del menú **no** es suficiente:
si se agrega una ruta nueva, hay que envolverla igual.

## 6. Modelo de datos (demo)

Todo vive en `DemoState` (`src/lib/types.ts`):

- `patients` — ficha, RUT, contacto, convenio, consentimiento, `atencionCerrada`.
- `prescriptions` — OD/OI (esfera, cilindro, eje, adición, DP), agudeza, observaciones.
- `orders` — folio `OT-2026-XXXX`, estado, cristal, armazón, total, abono, promesa, historial.
- `inventory` — cristales con SKU, graduación, stock, mínimo, costo y precio.
- `payments` — pagos por pedido con medio (Efectivo, Débito, Crédito, Transferencia).
- `waiting` — sala de espera (`esperando` → `en_consulta` → `atendido`).
- `appointments` — citas con estado (`agendada`, `confirmada`, `atendida`, `cancelada`).
- `suppliers` — laboratorios, armazones e insumos.
- `purchases` — facturas de compra con estado de pago.
- `warranty` — casos de postventa ligados a un pedido entregado.
- `audit` — registro inmutable encadenado (`prevHash` → `hash` SHA-256).

Estados de un pedido (`STATUS_ORDER`): `recepcion` → `laboratorio` → `montaje` → `lista` → `entregada`.
Las etiquetas visibles están en `STATUS_LABEL` (lenguaje llano: "Recién recibido", "Armando lentes"…).

## 7. Reglas de negocio que no se deben romper

1. **Consentimiento**: sin `patient.consentimiento` no se puede crear un pedido (`Quote.tsx`).
2. **Roles**: el tecnólogo escribe lo clínico y no ve lo comercial; la vendedora no ve la consulta;
   el montajista solo ve estados de taller; el admin ve todo pero **no edita** lo clínico.
3. **Folios**: el siguiente se calcula desde el máximo existente, no desde el largo del array.
4. **Auditoría**: cada acción pasa por `audit()` en `store.tsx`. No hay borrado: se enmienda.
   La cadena se verifica en `/cumplimiento` recomputando SHA-256.
5. **Inventario**: al vender con stock se descuenta una unidad; si no hay stock se pide al laboratorio.
6. **Caja**: el sistema registra pagos; **no emite DTE**. La boleta la emite Klap y el cierre se
   cuadra contra el POS.
7. **Margen**: en la demo es estimado (45% del cristal + 55% del armazón). En producción debe salir
   del costo real de las compras.
8. **Retención**: 15 años desde el último ingreso (Ley 20.584 / Decreto 41/2012).

## 8. Qué es real y qué es demo

Real y reutilizable: flujo completo, reglas de roles, auditoría SHA-256, exportación JSON,
impresión de receta/pedido con reverso de garantía, reportes CSV.

Simulado a propósito para la demo:

- Persistencia en `localStorage` (un navegador = una base de datos). No se comparte entre PC.
- No hay login: el cambio de rol es un selector para mostrar permisos.
- Sin respaldo externo, sin cifrado en reposo, sin anclaje del hash fuera del sistema.
- Sin envío automático de WhatsApp: el botón abre `wa.me` con el mensaje armado.
- El seed se regenera si cambia el día (`demoDay`) o si se usa "Reiniciar datos de ejemplo".

Todo esto está detallado, con su riesgo, en `PENDIENTES.md`.

## 9. Convenciones de diseño

- Canvas `#f2f5fa`, superficie blanca, tinta `#0c1728`, acento `#2f5fe0`, verde `#0e7a6b`.
- Tipografías Sora (títulos) y DM Sans (texto).
- Radios 6/10/14/20/28, sombras `shadow-card` y `shadow-lift` definidas en `@theme`.
- No pasar `bg-*` a `Card`: el orden de Tailwind hace que `bg-surface` gane. Usar un `div` propio.
- Mantener la API de `UI.tsx`: las 17 páginas dependen de esas firmas.
- Textos en español de Chile, lenguaje llano, sentence case.

## 10. Por dónde seguir

1. Leer `PENDIENTES.md` y partir por la sección **Producción (bloqueante)**.
2. Migrar el store a Supabase con RLS por rol; reemplazar `localStorage`.
3. Login real (Supabase Auth) y eliminar el selector de rol demo.
4. Respaldo cifrado + anclaje diario del hash de auditoría.
5. Recién después: inventario de armazones, PDF de reportes, alertas de insumos.

Para probar cambios sin romper la demo: `npm run dev`, recorrer el flujo completo con cada rol,
`npx tsc -b` y `npm run build` antes de publicar.

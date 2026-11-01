# Heaven Vision · Sistema de óptica

Demo funcional del sistema para Óptica Heaven Vision. Cubre el ciclo completo, sin reingreso de datos:

**paciente → sala de espera → consulta → receta → cotización → orden de trabajo → laboratorio → montaje → aviso → entrega → caja**

## Cómo verla

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

Build de producción:

```bash
npm run build
npm run preview
```

## Qué probar

1. **Sala de espera** — registra una llegada y usa *Atender*. La sala se actualiza en vivo.
2. **Consulta** — con el rol **Tecnólogo**, completa la refracción y emite la receta. El tecnólogo no ve precios ni caja.
3. **Cotización** — con el rol **Vendedora**, elige cristal (descuenta stock) y armazón, aplica abono y genera la OT.
4. **Órdenes** — avanza los estados: recepción → laboratorio → montaje → lista → entregada. Si queda saldo, el sistema pide el pago antes de entregar.
5. **Inventario** — ajusta stock y observa las alertas de mínimo.
6. **Caja** — revisa los movimientos del día y el cuadre contra el POS Klap.
7. **Cumplimiento** (rol **Administradora**) — verifica la cadena de auditoría y exporta el respaldo para fiscalización.
8. **Impresión** — desde una receta u OT, botón *Imprimir*. La OT incluye el reverso de garantía legal.

El selector de rol del topbar permite ver la app como Administradora, Tecnólogo, Vendedora o Montajista. *Reiniciar datos de ejemplo* vuelve al estado inicial.

## Alcance de esta demo

- Los datos viven en `localStorage` (clave `hv-demo-v1`) con datos de ejemplo. Se reinician solos al cambiar el día para que las esperas sean realistas.
- La capa de estado (`src/lib/store.tsx`) está aislada para reemplazar la persistencia por Supabase sin tocar la UI.
- **No emite DTE.** El sistema registra pagos y cuadra contra el POS Klap, que es quien emite la boleta.
- La auditoría usa una cadena de hashes (`prevHash` + hash del registro) para demostrar que nada se alteró. En producción se reemplaza por SHA-256 con respaldo externo.

## Estructura

```
src/
  lib/        tipos, formato, datos de ejemplo, store con auditoría
  components/ UI, layout y navegación por rol
  pages/      las 13 vistas del sistema
docs/         marco legal, reglas de oro y precios (fuera del repo)
```

## Roles

| Rol | Ve | No ve |
| --- | --- | --- |
| Administradora | Todo, clínica en solo lectura | — |
| Tecnólogo | Sala, pacientes, consulta, recetas | Precios, caja, cumplimiento |
| Vendedora | Pacientes, cotización, órdenes, inventario, caja | Ficha clínica y recetas |
| Montajista | Estados de taller | Clínica y comercial |

## Legal

Retención de 15 años (Ley 20.584 y Decreto 41/2012), ficha inmutable con autor, motivo y fecha, consentimiento informado, acceso restringido por rol y registro de cada acceso. Ver `MARCO-LEGAL.md` en la carpeta de documentos del proyecto.

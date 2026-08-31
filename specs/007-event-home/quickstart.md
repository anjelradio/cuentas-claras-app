# Quickstart de validación: Home de evento

**Feature**: [007-event-home](spec.md)

Esta guía valida únicamente la interfaz del frontend. No requiere migraciones,
bucket, API de eventos ni cambios en `app/server`.

## Prerrequisitos

- Node.js y pnpm disponibles.
- Dependencias del cliente instaladas en `app/client`.
- Una sesión válida para atravesar el layout protegido existente, o el entorno
  de desarrollo configurado para la autenticación local.

## Levantar el cliente

```bash
cd app/client
pnpm install
pnpm dev
```

Abrir `http://localhost:3000` y acceder a la ruta dinámica con un identificador,
por ejemplo `http://localhost:3000/samaipata-2026`.

## Validación funcional

1. Confirmar que aparecen `Samaipata 2026`, su fecha y descripción, las acciones
   del evento, el total de gastos, la distribución por categorías, gastos
   recientes y actividad reciente.
2. Activar `Invitar personas`, `Registrar gasto` y `Mis deudas`. Confirmar que
   cada flujo abre el `Dialog` o `Sheet` correspondiente, que se puede cerrar
   mediante botón, fondo y Escape, y que el foco vuelve al control de origen.
3. Recorrer `Crear evento`, `Unirme a un evento` y `Seleccionar evento` cuando
   estén disponibles desde la experiencia. Confirmar que solo muestran el
   estado visual previsto y no persisten datos.
4. Actualizar la página y probar otro `event-id` no vacío. Confirmar que la
   fixture sigue siendo consistente y que no se realizan solicitudes de datos.

## Validación responsive y accesible

- Probar viewport móvil y escritorio; no debe existir scroll horizontal ni
  contenido cortado.
- Navegar todos los botones con Tab y Shift+Tab; verificar foco visible y orden
  lógico.
- Verificar que los botones de solo icono tienen nombre accesible y que el donut
  incluye total y leyenda textual, no solo información por color.

## Comprobaciones automatizadas

```bash
cd app/client
pnpm lint
pnpm typecheck
pnpm test
```

El resultado esperado es que lint, tipado y pruebas existentes pasen, junto con
pruebas de renderizado de la ruta y de apertura/cierre de sus overlays añadidas
como parte de la implementación.

# Guía de validación: Interfaces de gastos

## Requisitos previos

- Instalar dependencias desde `app/client/` con `pnpm install`.
- La feature no requiere API propia: todos los gastos son datos locales.

## Ejecutar

```bash
cd app/client
pnpm dev
```

## Escenarios

1. Abre `/expenses/event/[eventId]` y alterna “Mis gastos”, “Gastos de otros” y “Todos”.
2. Abre `/expenses/event/[eventId]/create`, completa campos, cambia participantes y confirma el toast demostrativo.
3. Abre un detalle, verifica resumen, comprobante, participantes, estado y enlace de edición.
4. Recorre “Saldar mi parte” y anular; ambos deben indicar que son demostrativos.
5. Usa un gasto inexistente y verifica la página de no encontrado.
6. Repite con teclado y en anchos móvil/escritorio, verificando foco y ausencia de scroll horizontal.

## Validación automatizada

```bash
cd app/client
pnpm lint
pnpm typecheck
pnpm test
```

Los comandos deben finalizar correctamente; las pruebas cubrirán filtros, formulario, Sheets y navegación por identificadores inválidos.

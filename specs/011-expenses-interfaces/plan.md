# Implementation Plan: Interfaces de gastos

**Branch**: `[011-expenses-interfaces]` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Interfaces estáticas de Expenses y diseños Stitch: `design/event/expenses.html`, `design/event/expenses/register-expense.html` y `design/event/expenses/expense-detail.html`.

## Summary

Implementar exclusivamente en `app/client/` las pantallas estáticas de gastos dentro de un evento: listado filtrable, formulario reutilizable para registrar y editar, y detalle de gasto. Los HTML de Stitch se convertirán a componentes React accesibles y responsive, reutilizando App Header, shadcn/ui, componentes públicos y tokens existentes. No habrá API, backend, persistencia, cálculos financieros ni carga real de archivos.

## Technical Context

**Language/Version**: TypeScript 5, React 19 y Next.js 16.3.3.

**Primary Dependencies**: Next.js App Router, Tailwind CSS 4, shadcn/ui, Zod 4, Sonner, lucide-react, Vitest y Testing Library.

**Storage**: N/A; constantes tipadas locales a la funcionalidad.

**Testing**: Vitest, Testing Library, ESLint y `tsc --noEmit`.

**Target Platform**: Cliente web responsive, mobile-first y escritorio.

**Project Type**: Aplicación web; ámbito exclusivo del frontend `app/client/`.

**Performance Goals**: Sin llamadas de red; los cambios de filtro deben percibirse de inmediato en condiciones normales de cliente.

**Constraints**: No modificar `app/server/`, `docs/` ni contratos API. No añadir dependencias. Usar lucide-react, tokens y componentes existentes. Registrar, editar, anular y saldar serán acciones demostrativas comunicadas claramente.

**Scale/Scope**: Cuatro rutas event-scoped, un formulario compartido, componentes privados de detalle y datos demo de Stitch.

## Constitution Check

**Ámbito declarado**: Frontend: `app/client/`.

| Gate | Resultado | Aplicación |
|---|---|---|
| Separación y simplicidad | Cumple | Solo archivos de cliente; sin librerías o infraestructura nueva. |
| Calidad y pruebas | Cumple | Se planifican pruebas de interacción, lint y typecheck. |
| Arquitectura frontend | Cumple | Rutas bajo la frontera `(event)` y componentes privados junto a su ruta. |
| Cliente/servidor | Cumple | No hay services ni llamadas remotas; la interfaz no declara reglas financieras reales. |
| Diseño y Stitch | Cumple | Adaptación con React, Tailwind, shadcn/ui, tokens y lucide-react; no se copia HTML o scripts. |
| Accesibilidad y estados | Cumple | Foco, teclado, labels, responsive y Sonner para feedback demostrativo. |
| Nombres y documentación | Cumple | kebab-case y documentación breve en español. |

**Resultado previo a diseño**: PASS. No hay violaciones ni complejidad adicional que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/011-expenses-interfaces/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── expense-ui-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
app/client/src/app/expenses/
├── layout.tsx
├── _components/
│   └── expense-form.tsx
├── _types/
│   └── expense-demo.ts
├── event/[eventId]/
│   ├── page.tsx
│   └── create/page.tsx
└── [expenseId]/
    ├── page.tsx
    ├── edit/page.tsx
    └── _components/
        ├── expense-summary.tsx
        ├── expense-participants.tsx
        └── settle-expense-sheet.tsx
```

**Structure Decision**: Todas las rutas de Expenses se concentran en `app/expenses/`, fuera de `(event)`. El prefijo fijo `event` separa el identificador del evento del identificador del gasto: conserva contexto para listado y alta sin crear segmentos dinámicos hermanos ambiguos. `layout.tsx` reutiliza el marco autenticado global; `expense-form.tsx` se comparte entre registro y edición; los componentes del detalle quedan privados a `[expenseId]/`.

## Route and Component Plan

| Ruta | Responsabilidad | Comportamiento estático |
|---|---|---|
| `/expenses/event/[eventId]` | Listar gastos | Replica `expenses.html`, con navegación “Mis gastos”, “Gastos de otros” y “Todos”, y tarjetas demo que enlazan al detalle. |
| `/expenses/event/[eventId]/create` | Registrar gasto | Usa `ExpenseForm` en modo create y replica `register-expense.html`; abre un Sheet para excluir participantes antes del toast demostrativo. |
| `/expenses/[expenseId]/edit` | Editar gasto | Reutiliza `ExpenseForm` en modo edit con datos demo del identificador de ruta. |
| `/expenses/[expenseId]` | Consultar detalle | Replica `expense-detail.html`: resumen, comprobante, participantes y acciones; saldar abre un Sheet y anular una confirmación demostrativa. |

## Implementation Sequence

1. Definir tipos y constantes locales de gastos, categorías, participantes y filtros; validar el identificador para usar la página de no encontrado cuando no exista.
2. Crear `ExpenseForm` y las páginas register/edit usando las convenciones de inputs de login y Event Form, pero respetando la composición de Stitch.
3. Añadir el Sheet de exclusión de participantes con checkboxes accesibles y toast que aclare que nada se guarda todavía.
4. Construir el listado filtrable y sus tarjetas privadas con enlaces a detalle.
5. Construir el detalle con resumen, comprobante, participantes, Sheet de “Saldar mi parte” y AlertDialog de anulación; convertir iconos Stitch a lucide-react.
6. Ajustar empty, not-found, mobile-first y revisión visual contra los tres HTML.
7. Añadir pruebas observables y ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test`.

## Complexity Tracking

No se registran violaciones constitucionales ni complejidad que requiera justificación.

## Constitution Check (Post-Design)

**Resultado posterior a diseño**: PASS.

- Datos y contrato son exclusivamente de presentación y no convierten al frontend en fuente de verdad financiera.
- La ruta de evento conserva una frontera funcional coherente.
- Un formulario compartido evita duplicación y los componentes de detalle permanecen privados.
- Stitch se adaptará a componentes y tokens del proyecto, sin copiar scripts ni estilos originales.

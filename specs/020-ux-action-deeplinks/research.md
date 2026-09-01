# Research: Deep-linking de Acciones y Auto-apertura de Modales

## Contexto & Objetivos

Permitir que las interacciones del usuario en el Home ("Revisar" en pagos pendientes) y en "Mis deudas" ("Lo que debes") naveguen al detalle del gasto activando automáticamente los modales/bottom sheets correspondientes de forma reactiva y limpia.

---

## Decisiones Técnicas

### 1. Esquema de Parámetros en URL (Deep-linking)
- **Decisión**: Utilizar query parameters estandarizados en la ruta `/expenses/[expenseId]`:
  - Para verificación de pago por parte del acreedor: `?action=verify&splitId=<UUID>`
  - Para declaración de pago por parte del deudor: `?action=pay`
- **Justificación**: Los query parameters no alteran la jerarquía de rutas de Next.js App Router, permiten enlaces directos y se leen de forma estándar en componentes cliente con `useSearchParams()`.
- **Alternativas consideradas**:
  - Rutas anidadas (`/expenses/[expenseId]/pay` y `/expenses/[expenseId]/verify/[splitId]`): Descartadas porque los modales/sheets son capas interactivas sobre el detalle del gasto, no páginas separadas.
  - Almacenamiento en `sessionStorage` o estado global: Descartado porque no permite navegación por enlaces ni historial.

### 2. Extensión del DTO `PendingVerificationPaymentRead`
- **Decisión**: Incluir el campo `split_id: UUID` en el schema `PendingVerificationPaymentRead` del backend (`app/server/app/modules/payments/schemas/payment_schemas.py`) y en su schema Zod frontend (`pendingVerificationPaymentReadSchema`).
- **Justificación**: Permite al componente `RequireAttentionList` construir el enlace directo `/expenses/${expense_id}?action=verify&splitId=${split_id}` sin necesidad de llamadas adicionales.
- **Alternativas consideradas**:
  - Enviar solo `payment_id`: Descartado porque la vista de participantes agrupa y busca cuotas por `split_id`.

### 3. Orquestación y Ciclo de Vida del Modal en `ExpenseDetailView`
- **Decisión**: En `ExpenseDetailView`, leer los parámetros de búsqueda mediante `useSearchParams()` y propagar la selección al componente hijo correspondiente (`ExpenseParticipants` para verificación o `ExpenseSummary` para saldar deuda).
- **Validación de Seguridad/Permisos**:
  - Si `action=verify`: Solo se activa si `expense.is_payer === true` y el `split_id` corresponde a un split existente con estado `pending_confirmation` o `confirmed`.
  - Si `action=pay`: Solo se activa si `expense.is_payer === false` y el usuario tiene un split con estado `no_payment` o `rejected`.
- **Limpieza de URL**: Al cerrar el modal o completar la acción, limpiar suavemente los parámetros de búsqueda en la URL con `window.history.replaceState(null, "", window.location.pathname)` para evitar reaperturas accidentales en recargas locales.

### 4. Estado de Carga con Spinner en `MyDebtsSheet`
- **Decisión**: En `MyDebtsSheet`, mostrar un spinner animado centrado con el texto "Cargando tus deudas..." mientras `loading === true`, y únicamente renderizar las opciones de "Lo que debes" y "Lo que te deben" una vez completada la llamada a `ExpenseApi.getDebtsSummary(eventId)`.
- **Justificación**: Cumple con la solicitud explícita del usuario y previene que se muestren montos en 0 antes de que termine el fetch.

---

## Conclusiones

Todas las aclaraciones e incógnitas de diseño quedan resueltas. El plan se implementa reutilizando los componentes existentes de backend y frontend con cero dependencias nuevas y total compatibilidad con la constitución del proyecto.

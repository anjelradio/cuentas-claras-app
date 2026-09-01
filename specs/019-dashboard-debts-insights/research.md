# Research & Technical Decisions: Dashboard Principal, Liquidación de Deudas y Resumen Estadístico

**Feature**: `019-dashboard-debts-insights`
**Date**: 2026-09-01

---

## 1. Agregación de Deudas Consolidadas ("Mis Deudas")

### Contexto y Problema
El usuario necesita conocer exactamente cuánto dinero debe en total y cuánto dinero le deben a nivel global (todos sus eventos activos) o contextualizado a un evento específico (`/(event)/[eventId]`).
Actualmente, el botón "Mis deudas" en el Home general y en el Home de evento renderiza datos estáticos.

### Decisión Técnica
- Exponer un servicio de agregación de deudas en el backend accesible mediante:
  `GET /api/expenses/debts/summary?event_id={uuid_opcional}`
- **Cálculo de "Lo que debo" (`total_i_owe`)**:
  - Obtiene todos los eventos activos en los que el usuario es miembro activo (o el evento indicado en `event_id`).
  - Busca todos los `ExpenseSplit` activos (`deleted_at IS NULL`) asignados a `member_id` del usuario en gastos activos donde `expense.paid_by_member_id != member_id`.
  - Cruza con la tabla `Payment`:
    - Si existe un `Payment` con `status == "confirmed"`, la cuota está saldada y **no** se contabiliza.
    - Si no existe pago o está en `pending_confirmation` o `rejected`, la cuota suma a `total_i_owe` y se incluye en la lista `debts_to_pay` con su estado de pago.
- **Cálculo de "Lo que me deben" (`total_i_am_owed`)**:
  - Obtiene los gastos activos donde `expense.paid_by_member_id == member_id` del usuario actual.
  - Para cada gasto, examina los `ExpenseSplit` de terceros:
    - Suma las cuotas de terceros que **no** tienen un pago en estado `confirmed`.
  - Agrupa por gasto en `debts_to_collect`, indicando el total pendiente por cobrar de ese gasto, el número de personas pendientes y si hay pagos en verificación.

### Alternativas Consideradas
- *Cálculo en el cliente*: Traer todos los eventos, todos los gastos y todos los pagos y calcular en React. Rechazado por ineficiencia de red, mayor latencia y violación del principio de no trasladar lógica financiera crítica al cliente.

---

## 2. Sección "Requiere atención" (Pagos Pendientes de Confirmación)

### Contexto y Problema
Cuando un deudor declara un pago (efectivo o QR), el acreedor necesita ver una lista unificada de notificaciones en el Home para revisar y confirmar/rechazar rápidamente.

### Decisión Técnica
- Exponer endpoint `GET /api/payments/pending-verification`:
  - Retorna todos los pagos en `status == "pending_confirmation"` vinculados a cuotas de gastos pagados por el usuario (`expense.paid_by_member_id == user_member_id`).
  - Ordenados descendentemente por fecha de creación (`created_at`).
  - Cada item contiene `payment_id`, `expense_id`, `expense_name`, `event_id`, `event_name`, `debtor_name`, `amount`, `payment_method`, `created_at`.
- En el frontend, `RequireAttentionList` renderiza cada tarjeta con un botón "Revisar" que navega directamente a `/expenses/${item.expense_id}`.
- Si la lista está vacía, muestra un estado vacío amigable ("Todo al día. No tienes pagos pendientes de verificar").

---

## 3. Eventos Recientes con Total Personal Gastado

### Contexto y Problema
En el Home general, la tarjeta de "Eventos recientes" debe mostrar los 2 últimos eventos en los que participa el usuario, junto con el dinero que el usuario ha gastado personalmente en ese evento.

### Decisión Técnica
- Exponer endpoint `GET /api/events/recent?limit=2`:
  - Obtiene los 2 eventos más recientes del usuario.
  - Para cada evento, calcula:
    $$\text{Gasto Personal} = \sum (\text{Aporte del pagador en gastos propios con participación}) + \sum (\text{Cuotas asignadas en gastos de otros con pago confirmado})$$
    - Aporte propio en gasto pagado por el usuario: `expense.amount - expense.refund_amount` (si `payer_participated == True`).
    - Cuotas en gastos de terceros: suma de `assigned_amount` para cuotas del usuario que ya han sido confirmadas como pagadas (`Payment.status == confirmed`).

---

## 4. Actividad Reciente Global del Usuario

### Contexto y Problema
En el Home general, "Actividad reciente" debe mostrar las 3 actividades más recientes a través de todos los eventos en los que participa el usuario.

### Decisión Técnica
- Exponer endpoint `GET /api/activities/user-recent?limit=3`:
  - Obtiene las membresías activas del usuario y consulta `ActivityLog` filtrando por la lista de `event_id` del usuario, ordenadas por `created_at DESC` limitado a 3.

---

## 5. Resumen Estadístico por Categoría en Home de Evento

### Contexto y Problema
En `/(event)/[eventId]`, el "Resumen estadístico" usa datos mockeados. Debe calcular la distribución real por categoría y el monto total gastado en el evento.

### Decisión Técnica
- Exponer endpoint `GET /api/events/{event_id}/statistics`:
  - Suma el total de todos los gastos activos (`deleted_at IS NULL`) del evento.
  - Agrupa por `category` (`food`, `lodging`, `transport`, `shopping`, `entertainment`, `other`).
  - Calcula el monto acumulado, porcentaje sobre el total y cantidad de gastos de cada categoría.
- En el frontend, `EventStatisticsCard` conecta estos datos directamente a su gráfico de rosca SVG nativo existente sin requerir librerías externas pesadas.

---

## Resumen de Decisiones de Arquitectura

| Componente | Decisión | Justificación |
|------------|----------|---------------|
| **Backend Endpoints** | Endpoints REST en módulos existentes (`expenses`, `payments`, `events`, `activity`) | Respeta la arquitectura modular de FastAPI y evita dependencias circulares |
| **Frontend Fetching** | Server Components con cliente tipado Zod | Alto rendimiento de carga inicial, validación en frontera y Server-Side Rendering |
| **Visualización Gráfica** | SVG Nativo (`EventStatisticsCard`) | Cero dependencias adicionales, ligero, responsive y fiel al diseño Stitch |
| **Modal / Bottom Sheet** | `MyDebtsSheet` reutilizable con prop `eventId?: string` | Unifica la experiencia de usuario entre Home global y Event Detail |

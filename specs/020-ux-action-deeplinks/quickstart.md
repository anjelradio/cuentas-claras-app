# Quickstart Guide: Validación de Deep-linking de Acciones

## Escenario 1: Flujo de Revisión Rápida de Pago Declarado

1. Iniciar sesión con el usuario acreedor.
2. Acceder al Home (`/home`):
   - Verificar que en la sección "Requiere tu atención" se listen los pagos pendientes de confirmación.
   - Hacer clic en el botón **"Revisar"** de un pago.
3. Comprobar que:
   - La URL cargada es `/expenses/[expenseId]?action=verify&splitId=[splitId]`.
   - El bottom sheet de verificación de comprobante se abre de manera automática sin necesidad de hacer clic sobre el participante.
   - Al pulsar "Confirmar pago" o "Rechazar", el modal se cierra y el estado del participante se actualiza.

---

## Escenario 2: Flujo de Pago Rápido desde "Mis Deudas"

1. Iniciar sesión con un usuario que posea deudas pendientes.
2. Hacer clic en **"Mis deudas"**:
   - Observar el indicador de carga (spinner) mientras se cargan los saldos.
   - Al finalizar la carga, seleccionar **"Lo que debes"**.
   - Hacer clic en un gasto que adeudas.
3. Comprobar que:
   - La URL cargada es `/expenses/[expenseId]?action=pay`.
   - El bottom sheet de "Saldar mi deuda" se abre automáticamente con las opciones QR y Efectivo.
   - Declarar el pago y comprobar que el modal avanza a confirmación.

---

## Escenario 3: "Mis Deudas" en Home de Evento (`/[eventId]`)

1. Navegar a un evento específico (`/[eventId]`).
2. Abrir **"Mis deudas"**:
   - Verificar que se listen únicamente las deudas de ese evento.
   - Hacer clic en un gasto adeudado y comprobar la auto-apertura del bottom sheet de pago con `?action=pay`.

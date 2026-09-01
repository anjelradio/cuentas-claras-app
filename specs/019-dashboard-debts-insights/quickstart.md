# Quickstart Guide: Dashboard Principal, Liquidación de Deudas y Resumen Estadístico

**Feature**: `019-dashboard-debts-insights`
**Date**: 2026-09-01

---

## 1. Escenarios de Validación Rápida

### Escenario 1: Consulta de Deudas Globales y Filtro por Evento
1. **Setup**:
   - Usuario `user-debtor` con cuotas pendientes en el evento "Viaje Copacabana" (50.00 Bs.) y "Cena Amigos" (25.00 Bs.).
   - Usuario `user-payer` con un gasto creado de 150.00 Bs. (devolución esperada 100.00 Bs., de los cuales 50.00 Bs. ya fueron pagados).
2. **Ejecución**:
   - Petición `GET /api/expenses/debts/summary` con JWT de `user-debtor` $\rightarrow$ `total_i_owe: "75.00"` y lista con los 2 gastos.
   - Petición `GET /api/expenses/debts/summary?event_id={copacabana_id}` $\rightarrow$ `total_i_owe: "50.00"` con 1 gasto.
   - Petición `GET /api/expenses/debts/summary` con JWT de `user-payer` $\rightarrow$ `total_i_am_owed: "50.00"` en `debts_to_collect`.

### Escenario 2: Notificaciones en "Requiere atención"
1. **Setup**:
   - Deudor declara un pago en efectivo o QR para un gasto de `user-payer`.
2. **Ejecución**:
   - Petición `GET /api/payments/pending-verification` con JWT de `user-payer` $\rightarrow$ Retorna array con 1 elemento conteniendo el detalle del pago pendiente.
   - En la UI, el botón "Revisar" navega a `/expenses/{expense_id}`.

### Escenario 3: Estadísticas Reales de Evento
1. **Setup**:
   - Evento con 3 gastos: Comida (300 Bs.), Transporte (100 Bs.), Comida (50 Bs.).
2. **Ejecución**:
   - Petición `GET /api/events/{event_id}/statistics` $\rightarrow$ `total_amount: "450.00"`, categoría `food` con `350.00` (77.78%), categoría `transport` con `100.00` (22.22%).
   - En la UI, el gráfico SVG se dibuja proporcionalmente con estos porcentajes.

---

## 2. Comandos de Verificación Automatizada

### Pruebas de Backend
```bash
cd app/server
./venv/bin/pytest tests/unit/test_debts_summary.py tests/unit/test_event_statistics.py -v
```

### Chequeo de Tipos y Pruebas de Frontend
```bash
cd app/client
pnpm typecheck
pnpm test
```

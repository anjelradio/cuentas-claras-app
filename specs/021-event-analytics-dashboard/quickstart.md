# Quickstart: Validación del Dashboard y Analítica Visual del Evento

**Feature**: `021-event-analytics-dashboard`
**Date**: 2026-09-03

---

## Prerequisitos

1. Monorepo corriendo localmente:
   - Backend FastAPI en `http://localhost:8000`
   - Frontend Next.js en `http://localhost:3000`
2. Base de datos PostgreSQL con migraciones aplicadas.
3. Un usuario autenticado con sesión válida (Better Auth).
4. Al menos un evento con el usuario como miembro activo y varios gastos registrados en distintas categorías.

---

## Escenario 1: Dashboard con datos reales

### Preparación
Tener un evento con:
- 3 gastos activos en distintas categorías (ej.: Comida 300 Bs., Transporte 100 Bs., Hospedaje 100 Bs.).
- 2 pagadores distintos.
- Al menos 1 pago en estado `pending_confirmation`.
- Gastos en al menos 2 fechas distintas.

### Validación Backend

```bash
# Obtener JWT
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@test.com","password":"123456"}' | jq -r '.token')

# Consultar dashboard (reemplazar EVENT_ID)
curl -s http://localhost:8000/api/events/{EVENT_ID}/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Resultado esperado**:
- HTTP 200 con estructura `EventDashboardRead` completa.
- `total_spent` igual a la suma de los gastos configurados (500.00).
- `expense_count` = 3.
- `pending_settlements_count` = 1.
- `sum(categories[*].amount)` = 500.00.
- `sum(payer_contributions[*].total_paid)` = 500.00.
- `expense_timeline[-1].cumulative_total` = 500.00.
- `personal_balance.status` correcto según pagado vs. consumido.

### Validación Frontend

1. Navegar a `http://localhost:3000/(event)/{EVENT_ID}`.
2. Verificar que la tarjeta de balance personal muestra los tres valores (pagado, consumido, diferencia) y el badge de estado.
3. Verificar que el gráfico de categorías muestra los 3 segmentos con porcentajes correctos.
4. Verificar que la sección de aportes por pagador muestra a los 2 pagadores ordenados por monto descendente.
5. Verificar que la cronología muestra los puntos correctos en orden cronológico con `cumulative_total` creciente.

---

## Escenario 2: Evento sin gastos (estado vacío)

### Preparación
Crear un evento nuevo sin gastos registrados.

### Validación Backend
```bash
curl -s http://localhost:8000/api/events/{NUEVO_EVENT_ID}/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq .
```
**Resultado esperado**:
- HTTP 200.
- `total_spent` = "0.00", `expense_count` = 0.
- `categories` = [].
- `payer_contributions` = [].
- `expense_timeline` = [].
- `personal_balance.status` = "neutro".

### Validación Frontend
- La página no debe mostrar errores.
- Cada sección debe mostrar su estado vacío respectivo (ej.: "Sin gastos registrados").
- Los KPIs deben mostrar 0.00 Bs.

---

## Escenario 3: Acceso denegado

### Preparación
Usar credenciales de un usuario que NO pertenece al evento.

### Validación Backend
```bash
curl -s http://localhost:8000/api/events/{EVENT_ID}/dashboard \
  -H "Authorization: Bearer $TOKEN_OTRO_USUARIO" | jq .
```
**Resultado esperado**:
- HTTP 403 con `"code": "AUTHORIZATION_ERROR"`.

### Validación Frontend
- La página del evento devuelve 403 y el componente de error apropiado sin exponer datos del evento.

---

## Escenario 4: Coherencia financiera

### Preparación
Evento con gastos registrados.

### Validación
```bash
# Obtener dashboard y verificar invariantes
DASHBOARD=$(curl -s http://localhost:8000/api/events/{EVENT_ID}/dashboard \
  -H "Authorization: Bearer $TOKEN")

TOTAL=$(echo $DASHBOARD | jq -r '.total_spent')
CAT_SUM=$(echo $DASHBOARD | jq '[.categories[].amount | tonumber] | add')
PAYER_SUM=$(echo $DASHBOARD | jq '[.payer_contributions[].total_paid | tonumber] | add')
TIMELINE_LAST=$(echo $DASHBOARD | jq -r '.expense_timeline[-1].cumulative_total')

echo "total_spent: $TOTAL"
echo "sum categories: $CAT_SUM"
echo "sum payers: $PAYER_SUM"
echo "timeline last: $TIMELINE_LAST"
# Los cuatro valores deben ser iguales
```

---

## Pruebas automatizadas

### Backend (Pytest)
```bash
cd app/server
pytest tests/modules/events/test_analytics_service.py -v
pytest tests/modules/events/test_analytics_repository.py -v
pytest tests/api/test_event_dashboard_endpoint.py -v
```

### Frontend (Vitest)
```bash
cd app/client
npx vitest run src/app/expenses/_schemas/expense-api-schemas.test.ts
npx vitest run src/app/\(event\)/_services/server-event-api.test.ts
```

### Type checking
```bash
cd app/client
npx tsc --noEmit
```

---

## Referencias

- Contrato completo: [`contracts/analytics-api.md`](contracts/analytics-api.md)
- Data model: [`data-model.md`](data-model.md)
- Spec: [`spec.md`](spec.md)

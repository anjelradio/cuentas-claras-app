# Quickstart: Validación de Gastos y Comprobantes

**Feature**: `specs/015-expenses-management/spec.md` | **Date**: 2026-08-31

Guía de verificación de extremo a extremo para probar la funcionalidad de gastos, comprobantes, división, sincronización de participantes y trazabilidad.

---

## 1. Prerrequisitos y Configuración

1. **Backend**: Base de datos PostgreSQL con migraciones de Alembic al día y servidor FastAPI en ejecución (`http://localhost:8000`).
2. **Frontend**: Aplicación Next.js en ejecución (`http://localhost:3000`).
3. **Datos de prueba**: Un evento abierto con al menos 3 miembros activos (Usuario A, Usuario B, Usuario C).

---

## 2. Escenarios de Validación Funcional y de Integración

### Escenario 1: Registro atómico de gasto con comprobante y división equitativa (HU-17, HU-18, HU-20, HU-21)

1. Iniciar sesión como Usuario A dentro del evento.
2. Navegar a `/expenses/event/{eventId}/create`.
3. Ingresar:
   - Concepto: `Almuerzo grupal`
   - Monto: `100.00`
   - Categoría: `Comida` (🍴)
   - Pagador: `Usuario A`
   - Participantes: `Usuario A`, `Usuario B`, `Usuario C` (División equitativa).
   - Adjuntar comprobante: `recibo_almuerzo.jpg` (2 MB).
4. Enviar el formulario.
5. **Resultado esperado**:
   - Gasto creado con su comprobante disponible de inmediato en Cloudinary.
   - Splits asignados exactamente:
     - Participante 1: `Bs. 33.34`
     - Participante 2: `Bs. 33.33`
     - Participante 3: `Bs. 33.33`
     - Suma total: `Bs. 100.00` exacta.
   - En la bitácora del evento se registra la actividad `expense_created`.

---

### Escenario 2: Prueba de fallo de Cloudinary antes de persistencia (Atomicidad FR-010)

1. Simular un fallo de red o credenciales inválidas en Cloudinary.
2. Intentar registrar un gasto con comprobante adjunto.
3. **Resultado esperado**:
   - La petición es rechazada con error explicativo.
   - **Verificación en BD**: No se insertó ninguna fila en `expense`, ninguna en `expensesplit` y ninguna en `activitylog`.

---

### Escenario 3: Prueba de fallo SQL con compensación sobre Cloudinary

1. Simular un fallo en la base de datos después de la subida a Cloudinary (ej. timeout o constraint forzado).
2. **Resultado esperado**:
   - La transacción SQL ejecuta `rollback()`.
   - Se invoca la acción de compensación `ExpenseReceiptStorage.destroy(public_id)` para limpiar el archivo huérfano en Cloudinary.
   - No quedan recursos desvinculados en Cloudinary ni registros parciales en PostgreSQL.

---

### Escenario 4: Prueba de fallo de ActivityLog y rollback total

1. Simular un fallo durante la inserción del log de actividad.
2. **Resultado esperado**:
   - `ExpenseUnitOfWork.rollback()` revierte la creación del gasto y sus participaciones.
   - No se confirma el gasto si la auditoría falla.

---

### Escenario 5: Regresión de ActivityLog en el módulo Events

1. Crear, actualizar y transferir un evento utilizando `EventService`.
2. **Resultado esperado**:
   - Las actividades `event_created`, `event_updated` y `owner_transferred` se registran y persisten correctamente tras la eliminación del `session.commit()` prematuro en `ActivityRepository`.

---

### Escenario 6: Validación estricta de división por montos exactos (HU-19)

1. En el formulario de creación, seleccionar modalidad `División por montos exactos`.
2. Ingresar monto total: `100.00`.
3. Asignar cuotas: `Usuario A: 50.00`, `Usuario B: 49.99` (Total = `99.99`).
4. Intentar guardar.
5. **Resultado esperado**:
   - Bloqueo inmediato: `"La suma de las cuotas asignadas (Bs. 99.99) no coincide con el total del gasto (Bs. 100.00)"`.
6. Corregir `Usuario B` a `50.00` y confirmar: Gasto registrado exitosamente.

---

### Escenario 7: Ciclo de vida y sincronización de splits en edición (HU-27)

1. Crear un gasto con `Usuario A`, `Usuario B` y `Usuario C`.
2. **Edición 1 (Remover participante)**: Editar el gasto para excluir a `Usuario C` (solo A y B).
   - *Verificación*: El split de `Usuario C` pasa a `deleted_at IS NOT NULL`.
3. **Edición 2 (Reincorporar participante)**: Editar nuevamente el gasto para volver a incluir a `Usuario C`.
   - *Verificación*: El split existente de `Usuario C` es reutilizado (`deleted_at = None`), no se produce violación de `UniqueConstraint("expense_id", "member_id")` y no existen filas duplicadas.
4. **Verificación Invariante**: La suma de los splits activos coincide exactamente con el nuevo monto total.

---

### Escenario 8: Anulación lógica (soft-delete) y permisos (HU-28)

1. Como creador del gasto, pulsar **Anular gasto** y confirmar el diálogo.
2. **Resultado esperado**:
   - El gasto desaparece de los listados activos.
   - En base de datos se conserva con `deleted_at` registrado.
   - Se genera la actividad `expense_deleted`.
3. Intentar consultar o editar el gasto con un usuario ajeno al evento o en un evento cerrado.
4. **Resultado esperado**: Bloqueo con `403 Forbidden` o `422 ValidationError`.

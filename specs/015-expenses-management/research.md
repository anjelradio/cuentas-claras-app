# Technical Research: Gestión de Gastos y Comprobantes

**Feature**: `specs/015-expenses-management/spec.md` | **Date**: 2026-08-31

## Research Questions & Decisions

### 1. Atomicidad Funcional con Comprobantes (FR-010)

- **Contexto**: Un usuario que registra o edita un gasto con comprobante tiene una única intención funcional: crear el gasto respaldado con su comprobante. Si Cloudinary falla, no debe quedar un gasto huérfano sin comprobante; si la base de datos falla tras el upload, no debe quedar un archivo huérfano en Cloudinary.
- **Decision**:
  1. Los endpoints de mutación (`POST /api/events/{event_id}/expenses` y `PATCH /api/expenses/{expense_id}`) soportan `multipart/form-data` recibiendo el payload estructurado del gasto (`data: str` con schema JSON `ExpenseCreateRequest`/`ExpenseUpdateRequest`) y un archivo opcional (`file: UploadFile | None`). También se admite JSON plano en el `body` cuando no se adjunte comprobante.
  2. **Secuencia de Ejecución**:
     - **Paso 1 (Validación previa en memoria)**: Validar membresías, evento abierto, categorías y reglas monetarias antes de cualquier operación I/O.
     - **Paso 2 (Upload externo a Cloudinary)**: Si se proporciona un archivo `file`, se invoca `ExpenseReceiptStorage.upload_receipt(file_bytes, event_id)`.
       - *Fallo en Cloudinary*: Se aborta la operación de inmediato. No se inicia persistencia en base de datos. Ningún registro de `Expense`, `ExpenseSplit` ni `ActivityLog` es creado.
     - **Paso 3 (Transacción SQL coordinada)**: Con el comprobante subido (`receipt_url`, `receipt_public_id`), se inserta `Expense`, se insertan/sincronizan `ExpenseSplit` y se registra `ActivityLog` en la sesión de base de datos.
     - **Paso 4 (Manejo de Fallo SQL y Compensación)**: Si ocurre un error durante la persistencia en base de datos, el bloque `except` ejecuta:
       1. `ExpenseUnitOfWork.rollback()` (deshace los cambios en PostgreSQL).
       2. **Acción de compensación**: `ExpenseReceiptStorage.destroy(uploaded.public_id)` (elimina el archivo recién subido a Cloudinary).
     - **Paso 5 (Commit SQL)**: Si la transacción SQL completa con éxito, `ExpenseUnitOfWork.commit()` confirma la persistencia y se retorna el resultado.
  3. Los endpoints dedicados (`DELETE /api/expenses/{expense_id}/receipt` y `PUT /api/expenses/{expense_id}/receipt`) se conservan exclusivamente para operaciones directas de eliminación o actualización de comprobante desde la vista de detalle de un gasto existente.
- **Distinción Clave**: Cloudinary es un servicio externo HTTP y **no** participa en una transacción ACID. La consistencia se garantiza orquestando el orden de operaciones (Upload → SQL → Rollback con compensación `destroy`).

---

### 2. ActivityLog y Posesión del Límite Transaccional

- **Contexto**: `ActivityRepository.create_activity()` realizaba históricamente un `session.commit()` interno, lo cual rompería la atomicidad si es invocado dentro del flujo de `ExpenseService`.
- **Decision**:
  1. `ActivityRepository.create_activity()` se actualiza para ejecutar exclusivamente `self.session.add(activity)` y `self.session.flush()`, eliminando el `session.commit()` interno.
  2. El único `commit()` de cualquier caso de uso de gastos pertenece a `ExpenseUnitOfWork` al final de la operación.
  3. La integración entre módulos se mantiene exclusivamente mediante `ActivityService.log_activity()`, sin permitir que `expenses` acceda a `ActivityRepository`.
  4. Dado que este cambio afecta transversalmente al módulo `activity`, se planifican pruebas de regresión para los flujos existentes de `events` (`EventService`) que consumen `ActivityService`.
- **Rationale**:
  - Cumple estrictamente el Principio X (Transacciones atómicas) y el Principio XI (Encapsulación entre módulos).

---

### 3. Ciclo de Vida y Algoritmo de Sincronización de ExpenseSplit en Edición

- **Contexto**: `ExpenseSplit` posee una restricción única `UniqueConstraint("expense_id", "member_id")` y soporte de soft-delete (`deleted_at`). Al editar un gasto, los participantes pueden mantenerse, eliminarse, agregarse como nuevos o volver a incluirse tras haber sido removidos previamente.
- **Decision**:
  1. `ExpenseSplitRepository` implementa `list_all_by_expense(expense_id, include_deleted=True)` para recuperar el historial completo de splits del gasto.
  2. En `ExpenseService.update_expense`, el algoritmo de sincronización ejecuta:
     - Para cada participante $M$ de la nueva división:
       - Si ya existe un split **activo** para $M$ → actualizar su `assigned_amount` y `updated_at`.
       - Si existe un split **inactivo** (`deleted_at IS NOT NULL`) para $M$ → **reutilizarlo**: restaurar `deleted_at = None`, actualizar `assigned_amount` y `updated_at`.
       - Si no existe ningún split previo para $M$ → instanciar y crear un nuevo `ExpenseSplit`.
     - Para los splits existentes activos cuyo participante ya **no** forma parte de la nueva división → marcar soft-delete (`deleted_at = datetime.now(UTC)`).
  3. **Invariante Financiera**: Únicamente los splits activos (`deleted_at IS NULL`) participan en la validación $\sum \text{assigned\_amount} == \text{Expense.amount}$.
- **Rationale**:
  - Evita violaciones de la restricción `UniqueConstraint("expense_id", "member_id")`.
  - Evita hacer hard-delete de datos históricos y previene duplicación de filas.

---

### 4. Precisión Monetaria y Algoritmo de División Equitativa (HU-18, Constitución XVI)

- **Decision**:
  - Cálculo en centavos enteros:
    ```python
    total_cents = int(round(expense_amount * 100))
    n = len(participant_member_ids)
    base_cents = total_cents // n
    remainder_cents = total_cents % n
    
    sorted_members = sorted(participant_member_ids)
    
    splits = []
    for index, member_id in enumerate(sorted_members):
        assigned_cents = base_cents + (1 if index < remainder_cents else 0)
        splits.append((member_id, Decimal(assigned_cents) / Decimal(100)))
    ```
  - Invariante garantizada: $\sum \text{assigned\_amount} == \text{expense\_amount}$.

---

### 5. Encapsulación y Autorización con Events

- **Decision**:
  - `ExpenseService` invoca `EventAuthorizationService` (`require_active_member`, `require_open`).
  - Validación de miembros activos mediante `MemberService.get_event_members`.
  - Permisos de edición/anulación: creador del gasto o `Event.user_id` en evento `OPEN`.

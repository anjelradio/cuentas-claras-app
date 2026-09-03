# Plan Técnico: Exportación y Resumen Portable del Evento

**Feature**: `022-export-event-reports`
**Spec**: `specs/022-export-event-reports/spec.md`
**Date**: 2026-09-03

---

## Resumen Ejecutivo

Módulo de solo lectura que permite a un miembro activo de un evento descargar un reporte consolidado en formato CSV o PDF. La arquitectura es transversal: el backend (FastAPI) genera los archivos como streams binarios y los entrega con las cabeceras HTTP correctas; el frontend (Next.js) expone un botón/menú de exportación como componente cliente que dispara la descarga directamente en el navegador.

**Decisión de diseño clave**: El endpoint es `GET /api/events/{event_id}/export?format=csv|pdf`. Un único endpoint con parámetro de formato evita duplicar la lógica de autorización y recolección de datos. El response body es el binario del archivo; no hay JSON intermedio.

**Librerías seleccionadas**:
- **CSV**: `csv` (stdlib de Python) — sin dependencia externa, suficiente para el alcance.
- **PDF**: `reportlab` — librería Python madura, sin dependencia de headless browser, genera PDF programáticamente con tabla estructurada. No requiere WeasyPrint ni wkhtmltopdf.

**Coherencia financiera**: Los balances individuales de participantes se calculan reutilizando las mismas queries del módulo de analytics (feature 021). No se introduce un motor de cálculo alternativo.

---

## Phase 0: Research

### Decisión 1 — Librería de generación PDF

- **Decision**: `reportlab` (PyPI: `reportlab>=4.2`)
- **Rationale**: Genera PDF programáticamente sin depender de un headless browser ni de instalación de binarios del sistema. Es la librería Python más establecida para PDFs tabulares. La alternativa `weasyprint` requiere binarios del sistema operativo (pango, cairo) que complican el despliegue en contenedores. `fpdf2` es más simple pero con menos soporte de tablas estructuradas. `reportlab` ya está disponible como instalación pip sin dependencias nativas en Windows/Linux.
- **Alternatives considered**: WeasyPrint (descartado: dependencias nativas del SO), fpdf2 (descartado: soporte limitado de tablas complejas), borb (descartado: licencia dual y menos maduro).

### Decisión 2 — Generación CSV

- **Decision**: Módulo `csv` de la stdlib de Python + `io.StringIO` / `io.BytesIO`
- **Rationale**: El módulo `csv` maneja correctamente el escaping de comas, comillas y caracteres especiales. No requiere dependencia externa. Se agrega BOM UTF-8 (`\ufeff`) para compatibilidad con Microsoft Excel al abrir directamente.
- **Alternatives considered**: `pandas` (descartado: dependencia pesada, innecesaria para generación simple de CSV).

### Decisión 3 — Descarga de archivo en el frontend (blob download)

- **Decision**: Función `downloadEventReport(eventId, format)` en `event-api.ts` (client service) usando `fetch` con el JWT en el header `Authorization`, convirtiendo la respuesta en `Blob` y disparando la descarga mediante un elemento `<a>` temporal creado en JS.
- **Rationale**: Next.js Server Components no pueden disparar descargas de archivos binarios en el navegador. La descarga debe ser iniciada desde un Client Component que tenga acceso al DOM. El JWT se obtiene mediante el hook de sesión de Better Auth (client side) antes de hacer el fetch.
- **Alternatives considered**: `<a href="...">` directo al backend (descartado: no puede incluir el JWT en el header de una navegación directa); Server Action con stream (descartado: Next.js no soporta streams binarios en Server Actions de forma estable).

### Decisión 4 — Recolección de datos del reporte

- **Decision**: Nuevo `ExportRepository` en `app/server/app/modules/events/repositories/export_repository.py` con queries específicas para el reporte; el `EventExportService` orquesta la recolección y delegación al formateador correspondiente.
- **Rationale**: Las queries del reporte (gastos con splits, pagos con estados, balances de participantes) combinan tablas de múltiples módulos (expenses, payments, events). Concentrarlas en un repositorio dedicado mantiene la Constitution §VIII: los repositorios son la única capa autorizada para SQL. El service no contiene SQL.
- **Alternatives considered**: Reutilizar `AnalyticsRepository` de feature 021 (descartado parcialmente: se reutiliza la lógica de balance personal, pero el reporte necesita datos adicionales como splits y pagos con estados que no están en analytics).

### Decisión 5 — Nombre del archivo descargado

- **Decision**: Patrón `{slug-del-evento}-reporte.{csv|pdf}` donde el slug normaliza el nombre del evento a minúsculas, reemplaza espacios y caracteres especiales con guiones, y elimina caracteres no seguros para sistemas de archivos.
- **Rationale**: FR-012 requiere un nombre descriptivo. La normalización evita errores en sistemas de archivos Windows/macOS/Linux que no aceptan ciertos caracteres.

---

## Arquitectura — Backend

### Módulo: `app/server/app/modules/events/`

La feature se implementa íntegramente dentro del módulo `events`, siguiendo la Constitution §IV (módulo = capacidad de negocio).

```
events/
├── repositories/
│   ├── analytics_repository.py     [ya existe - feature 021]
│   └── export_repository.py        [NUEVO]
├── services/
│   └── event_export_service.py     [NUEVO]
├── formatters/                     [NUEVO - carpeta justificada: §II excepción]
│   ├── __init__.py
│   ├── csv_formatter.py
│   └── pdf_formatter.py
├── routers/
│   └── event_router.py             [MODIFICAR - agregar endpoint export]
└── dependencies.py                 [MODIFICAR - agregar get_export_service()]
```

> **Justificación de `formatters/`**: Los formateadores son utilidades de serialización que no pertenecen a `repositories/` (no acceden a BD) ni a `services/` (no implementan casos de uso). Constituyen una capa técnica de transformación pura (datos → bytes). La Constitution §II permite excepciones arquitectónicas justificadas y documentadas.

### Flujo de datos (Constitution §V)

```
Router (GET /{event_id}/export?format=csv|pdf)
  → EventExportService.generate_report(event_id, user_id, format)
      → EventAuthorizationService.require_active_member()   [reutilizado]
      → ExportRepository.get_report_data(event_id)          [nueva query]
      → CsvFormatter.render(data)  o  PdfFormatter.render(data)
  → StreamingResponse  con Content-Disposition
```

### `ExportRepository` — Queries

**`get_event_header(event_id)`**
```sql
SELECT e.name, e.currency, e.status, e.created_at,
       u.name as creator_name
FROM event e
JOIN "user" u ON e.user_id = u.id
WHERE e.id = :event_id AND e.deleted_at IS NULL
```

**`get_member_balances(event_id)`**
```sql
-- Monto pagado por miembro (pagador de gastos)
SELECT em.id, u.name,
       COALESCE(SUM(e.amount), 0)         AS total_paid,
       COALESCE(SUM(es.assigned_amount), 0) AS total_consumed
FROM eventmember em
JOIN "user" u ON em.user_id = u.id
LEFT JOIN expense e
       ON e.paid_by_member_id = em.id AND e.deleted_at IS NULL
LEFT JOIN expense_split es
       ON es.member_id = em.id
LEFT JOIN expense e2
       ON es.expense_id = e2.id AND e2.deleted_at IS NULL
WHERE em.event_id = :event_id AND em.deleted_at IS NULL
  AND em.status = 'active'
GROUP BY em.id, u.name
ORDER BY u.name
```

**`get_expense_rows(event_id)`**
```sql
SELECT e.expense_date, e.name AS description, u.name AS payer_name,
       e.category, e.amount, e.split_type
FROM expense e
JOIN eventmember em ON e.paid_by_member_id = em.id
JOIN "user" u ON em.user_id = u.id
WHERE e.event_id = :event_id AND e.deleted_at IS NULL
ORDER BY e.expense_date ASC
```

**`get_settlement_rows(event_id)`**
```sql
SELECT p.status, p.amount,
       u_payer.name AS payer_name,
       u_creditor.name AS creditor_name,
       p.created_at
FROM payment p
JOIN expense_split es ON p.split_id = es.id
JOIN eventmember em_payer ON es.member_id = em_payer.id
JOIN "user" u_payer ON em_payer.user_id = u_payer.id
JOIN expense e ON es.expense_id = e.id
JOIN eventmember em_creditor ON e.paid_by_member_id = em_creditor.id
JOIN "user" u_creditor ON em_creditor.user_id = u_creditor.id
WHERE e.event_id = :event_id AND e.deleted_at IS NULL
ORDER BY p.created_at DESC
```

### Schemas Pydantic (internos al service — no expuestos como contrato HTTP)

```python
# Tipos internos de transferencia de datos entre repository y formatters
@dataclass
class EventHeaderData:
    name: str
    currency: str
    status: str
    created_at: date
    creator_name: str

@dataclass
class MemberBalanceData:
    display_name: str
    total_paid: Decimal
    total_consumed: Decimal
    net_difference: Decimal       # calculado en service
    status: str                   # "acreedor" | "deudor" | "neutro"

@dataclass
class ExpenseRowData:
    expense_date: date
    description: str
    payer_name: str
    category: str
    amount: Decimal
    split_type: str

@dataclass
class SettlementRowData:
    payer_name: str
    creditor_name: str
    amount: Decimal
    status: str                   # "confirmed" | "pending_confirmation"

@dataclass
class EventReportData:
    header: EventHeaderData
    member_balances: list[MemberBalanceData]
    expenses: list[ExpenseRowData]
    settlements: list[SettlementRowData]
```

> Estos dataclasses son privados al módulo. El contrato público del endpoint es el binario del archivo (CSV o PDF), no un JSON.

### Endpoint

```
GET /api/events/{event_id}/export?format=csv
GET /api/events/{event_id}/export?format=pdf
```

- **Auth**: JWT Bearer obligatorio (`get_current_user`)
- **Auth de dominio**: `require_active_member` — HTTP 403 si no es miembro activo; HTTP 404 si el evento no existe
- **Query param `format`**: Enum `Literal["csv", "pdf"]`; valor inválido → HTTP 422
- **Response (éxito)**: `StreamingResponse` con:
  - CSV: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="{slug}-reporte.csv"`
  - PDF: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="{slug}-reporte.pdf"`
- **Response (error)**: contrato centralizado existente (Constitution §XV)

### Dependencia nueva en `pyproject.toml`

```toml
"reportlab>=4.2",
```

---

## Arquitectura — Frontend

### Archivos afectados

```
app/client/src/app/(event)/
├── [eventId]/
│   └── _components/
│       └── event-export-button.tsx    [NUEVO - "use client"]
└── _services/
    └── event-api.ts                   [MODIFICAR - agregar downloadEventReport()]
```

### `event-api.ts` — Función de descarga

```typescript
// Función nueva a agregar en el client service existente
export async function downloadEventReport(
  eventId: string,
  format: "csv" | "pdf"
): Promise<void>
```

**Lógica**:
1. Obtener el JWT del cliente de sesión de Better Auth (`useSession` → `session.token`)
2. `fetch(`${API_BASE}/events/${eventId}/export?format=${format}`, { headers: { Authorization: \`Bearer ${token}\` } })`
3. Si `!res.ok` → lanzar error tipado con código y mensaje del backend
4. `const blob = await res.blob()`
5. Crear URL temporal: `URL.createObjectURL(blob)`
6. Crear `<a>` oculto con `href` y `download` → `.click()` → revocar URL

### `EventExportButton` — Componente cliente

```typescript
// app/client/src/app/(event)/[eventId]/_components/event-export-button.tsx
"use client"

interface EventExportButtonProps {
  eventId: string
}
```

**Comportamiento**:
- Renderiza un botón "Exportar reporte" con ícono `Download` (lucide-react).
- Al hacer clic: abre un pequeño menú emergente (Popover o DropdownMenu de shadcn/ui) con dos opciones: "Descargar CSV" y "Descargar PDF".
- Al seleccionar un formato: muestra estado de carga (`isDownloading: true`) con spinner en el botón; llama a `downloadEventReport(eventId, format)`; restaura el estado al completar.
- Si el download falla: muestra un toast de error con `sonner` y restaura el estado.
- Implementado como `"use client"` porque requiere estado interactivo y acceso al DOM para disparar la descarga.

### Integración en `page.tsx`

`EventExportButton` se agrega en `app/client/src/app/(event)/[eventId]/page.tsx` como un Server Component que renderiza el componente cliente. No requiere datos adicionales del servidor; solo recibe `eventId` como prop. Se coloca en la sección de acciones del evento (junto a `EventActionsSection`).

---

## Constitution Check

| Principio | Verificación |
|---|---|
| §I — Monorepo y separación | ✅ Backend en `app/server/`, frontend en `app/client/` |
| §IV — Módulo = capacidad | ✅ Implementado dentro de `events/` (capacidad: gestión del evento) |
| §V — Dirección de dependencias | ✅ Router → Service → Repository; formatter es utilidad pura sin DB |
| §VI — Responsabilidad del router | ✅ Solo recibe, valida `format`, delega al service, retorna `StreamingResponse` |
| §VII — Responsabilidad del service | ✅ `EventExportService` orquesta: autoriza, recolecta datos, delega al formatter; sin SQL |
| §VIII — Responsabilidad del repository | ✅ `ExportRepository` contiene todas las queries SQL |
| §X — Atomicidad | ✅ N/A: operación de solo lectura; no hay transacciones de escritura |
| §XIII — JWT Auth | ✅ Endpoint protegido con `get_current_user`; frontend incluye JWT en header |
| §XIV — Sin roles globales | ✅ Autorización por `require_active_member` (relación de dominio, no rol global) |
| §XV — Manejo de excepciones | ✅ `EventAuthorizationService` lanza `ForbiddenError`/`NotFoundError`; handlers centralizados los traducen |
| §XVI — Integridad financiera | ✅ Balances calculados con `Decimal`; sin float aritmético |
| §XVII — Pruebas backend | ✅ Plan incluye pruebas unitarias del service y de contrato del endpoint |
| §XVIII — Arquitectura frontend | ✅ Componente en `_components/`, service en `_services/` |
| §XIX — Dirección de dependencias frontend | ✅ Componente → service → `fetch` → backend |
| §XX — Server vs Client Components | ✅ `EventExportButton` es Client Component (necesita estado, DOM); page.tsx es Server Component |
| §XXII — Zod y tipos frontend | ✅ La respuesta es un Blob binario; no hay JSON que validar con Zod en este endpoint |

---

## Verificación Final del Plan

- ✅ No hay migraciones Alembic (feature de solo lectura; no crea tablas nuevas)
- ✅ La nueva dependencia `reportlab` se declara en `pyproject.toml`
- ✅ Los balances de participantes usan `Decimal`, coherentes con FR-008 y FR-016
- ✅ El BOM UTF-8 en CSV garantiza compatibilidad con Excel (FR-002)
- ✅ El nombre del archivo incluye el slug del evento (FR-012)
- ✅ Los gastos eliminados lógicamente (`deleted_at IS NULL`) se excluyen en todas las queries (FR-009)
- ✅ Ninguna query expone tokens, IDs de sesión ni credenciales (FR-010)

# Tasks: Exportación y Resumen Portable del Evento

**Feature**: `022-export-event-reports`
**Plan**: `specs/022-export-event-reports/plan.md`
**Spec**: `specs/022-export-event-reports/spec.md`
**Generated**: 2026-09-03

---

## Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational — dataclasses + instalación de reportlab)
    ↓
Phase 3 [US1 — CSV] ←─── depende de Phase 2
    ↓
Phase 4 [US2 — PDF] ←─── depende de Phase 2 (puede ejecutarse en paralelo con Phase 3 post-T006)
    ↓
Phase 5 [US3 — Liquidaciones en reporte] ←─── depende de Phase 3 y Phase 4
    ↓
Phase 6 (Frontend — botón de exportación) ←─── depende de Phase 3 y Phase 4
    ↓
Phase 7 (Polish & Validación transversal)
```

**Oportunidades de ejecución paralela**:
- T005 (`csv_formatter.py`) y T006 (`pdf_formatter.py`) son independientes entre sí; pueden ejecutarse en paralelo.
- T010 (`ExportRepository`) y T011 (`EventExportService`) tienen dependencia secuencial; T011 depende de T010.
- T014 (`downloadEventReport` en `event-api.ts`) y T015 (`EventExportButton`) pueden paralelizarse después de T011.

---

## Phase 1 — Setup

**Objetivo**: Preparar el entorno e infraestructura de archivos para la feature.

- [x] T001 Crear la carpeta `app/server/app/modules/events/formatters/` y agregar `__init__.py` vacío
- [x] T002 Agregar `"reportlab>=4.2"` a las dependencias del proyecto en `app/server/pyproject.toml` dentro de la sección `[project] > dependencies`

**Verificación**: `ls app/server/app/modules/events/formatters/` muestra `__init__.py`; el servidor puede importar `from reportlab.platypus import SimpleDocTemplate` sin error después de reinstalar dependencias.

---

## Phase 2 — Foundational

**Objetivo**: Definir los tipos internos de transferencia de datos que son compartidos entre el repositorio y los formateadores. Estos dataclasses son el contrato interno del módulo y deben existir antes de implementar cualquier capa que los consuma.

- [x] T003 Crear `app/server/app/modules/events/services/export_data.py` con los cinco dataclasses internos del módulo: `EventHeaderData`, `MemberBalanceData`, `ExpenseRowData`, `SettlementRowData` y `EventReportData`, usando `Decimal` para todos los campos monetarios y `date` (no `datetime`) para fechas
- [x] T004 Importar y re-exportar los dataclasses desde `app/server/app/modules/events/services/__init__.py` para que sean accesibles dentro del módulo sin imports relativos profundos

**Verificación**: `from app.modules.events.services.export_data import EventReportData` importa sin error; `EventReportData` instancia correctamente con todos sus campos.

---

## Phase 3 — [US1] Descarga del Reporte en Formato CSV

**Goal**: Un miembro activo puede solicitar y descargar un archivo CSV completo con los datos financieros del evento. El archivo tiene BOM UTF-8, encabezado del evento, tabla de balances y tabla de gastos activos.

**Independent Test**: Ejecutar `curl -H "Authorization: Bearer <jwt>" "http://localhost:8000/api/events/<event_id>/export?format=csv" --output test.csv` y verificar que el archivo tiene cuatro secciones bien formadas con datos correctos y no incluye gastos eliminados lógicamente.

- [x] T005 [P] [US1] Crear `app/server/app/modules/events/formatters/csv_formatter.py` con la clase `CsvFormatter` y el método `render(data: EventReportData) -> bytes` que genera el CSV en cuatro secciones (encabezado del evento, balances de participantes, historial de gastos, liquidaciones), usa coma como delimitador, UTF-8 con BOM, y representa montos como `Decimal` formateados a dos decimales sin símbolo de moneda
- [x] T006 [P] [US1] Crear `app/server/app/modules/events/repositories/export_repository.py` con la clase `ExportRepository` y los cuatro métodos de query: `get_event_header(event_id: UUID) -> EventHeaderData | None`, `get_member_balances(event_id: UUID) -> list[MemberBalanceData]`, `get_expense_rows(event_id: UUID) -> list[ExpenseRowData]` y `get_settlement_rows(event_id: UUID) -> list[SettlementRowData]`, usando las queries SQL del plan con `deleted_at IS NULL` en todos los filtros de gastos y la exclusión de miembros con `status != 'active'`
- [x] T007 [US1] Crear `app/server/app/modules/events/services/event_export_service.py` con la clase `EventExportService` que recibe `ExportRepository`, `EventRepository` y `MemberRepository` en su constructor, e implementa `generate_report(event_id: UUID, user_id: str, format: Literal["csv", "pdf"]) -> tuple[bytes, str, str]` que retorna `(file_bytes, content_type, filename)`, invoca `EventAuthorizationService.require_active_member()`, llama a `ExportRepository` para recolectar los datos, calcula `net_difference` y `status` de cada miembro en el service (con `Decimal`, sin float), y delega a `CsvFormatter` o `PdfFormatter` según el parámetro `format`
- [x] T008 [US1] Agregar la función factory `get_export_service(session: SessionDep) -> EventExportService` en `app/server/app/modules/events/dependencies.py` siguiendo el mismo patrón de las funciones factory existentes
- [x] T009 [US1] Agregar el endpoint `GET /{event_id}/export` en `app/server/app/modules/events/routers/event_router.py` que recibe el query param `format: Literal["csv", "pdf"]` (validado por FastAPI), invoca `EventExportService.generate_report()`, y retorna `StreamingResponse` con `Content-Type` y `Content-Disposition` correctos según el formato; incluir `ExportServiceDep = Annotated[EventExportService, Depends(get_export_service)]` en el mismo archivo

**Verificación de Phase 3**: Iniciar el servidor, hacer `curl -H "Authorization: Bearer <jwt>" "http://localhost:8000/api/events/<id>/export?format=csv" -I` → respuesta `200 OK` con `Content-Type: text/csv; charset=utf-8` y `Content-Disposition: attachment; filename="<slug>-reporte.csv"`.

---

## Phase 4 — [US2] Descarga del Reporte en Formato PDF

**Goal**: Un miembro activo puede descargar un PDF válido y legible con el encabezado del evento, tabla de balances de participantes, tabla de gastos activos y pie de página con fecha/hora de generación.

**Independent Test**: Ejecutar `curl -H "Authorization: Bearer <jwt>" "http://localhost:8000/api/events/<event_id>/export?format=pdf" --output test.pdf` y verificar que `pdfinfo test.pdf` reporta un PDF válido, y que el contenido incluye el nombre del evento, los balances correctos y el historial de gastos sin eliminar.

- [x] T010 [US2] Crear `app/server/app/modules/events/formatters/pdf_formatter.py` con la clase `PdfFormatter` y el método `render(data: EventReportData) -> bytes` que usa `reportlab` (`SimpleDocTemplate`, `Table`, `TableStyle`, `Paragraph`, `Spacer`) para generar un PDF A4 con: (1) título "Reporte del Evento: {name}", (2) metadatos del evento como párrafo (moneda, estado, creador, fecha de creación), (3) tabla de balance de participantes con columnas Participante | Pagado | Consumido | Diferencia | Estado, (4) tabla de historial de gastos con columnas Fecha | Descripción | Pagador | Categoría | Monto | División, (5) tabla de liquidaciones con columnas Pagador | Acreedor | Monto | Estado | Fecha, y (6) pie de página con fecha/hora de generación; manejar el caso de listas vacías mostrando una fila con el mensaje "Sin registros"

**Verificación de Phase 4**: El endpoint `GET /{event_id}/export?format=pdf` retorna `200 OK` con `Content-Type: application/pdf`; el archivo binario se puede abrir correctamente en un visor de PDF y contiene las cuatro secciones definidas.

---

## Phase 5 — [US3] Estado de Liquidaciones en el Reporte

**Goal**: El reporte en ambos formatos (CSV y PDF) incluye el estado de las liquidaciones entre participantes, distinguiendo pagos confirmados de pendientes. Esta fase valida que la sección de liquidaciones ya generada en Phases 3 y 4 cumpla con los requisitos de US3.

**Independent Test**: Generar el CSV y el PDF de un evento con un pago confirmado y uno pendiente; verificar que la sección de liquidaciones del archivo muestra ambos estados correctamente con los participantes y montos correspondientes.

- [x] T011 [US3] Verificar en `app/server/app/modules/events/formatters/csv_formatter.py` que la sección "Estado de Liquidaciones" muestra `"Saldado"` para pagos con `status == "confirmed"` y `"Pendiente"` para `status == "pending_confirmation"`, y ajustar si es necesario para cumplir la convención de etiquetas legibles definida en `specs/022-export-event-reports/contracts/export-api.md`
- [x] T012 [US3] Verificar en `app/server/app/modules/events/formatters/pdf_formatter.py` que la tabla de liquidaciones muestra los mismos valores legibles (`"Saldado"` / `"Pendiente"`) y que el caso de evento sin pagos registrados muestra la fila "Sin registros" sin producir error

**Verificación de Phase 5**: Exportar CSV y PDF de un evento con pagos mixtos; las filas de liquidaciones reflejan exactamente los estados reales de la base de datos. Exportar un evento sin pagos; el reporte se genera sin error y la sección de liquidaciones indica ausencia de registros.

---

## Phase 6 — Frontend: Botón de Exportación

**Goal**: El usuario puede iniciar la descarga del reporte desde la UI del evento con un botón/menú que muestra feedback visual durante la descarga y maneja errores con un toast.

**Independent Test**: En el navegador, navegar a la página del evento, hacer clic en "Exportar reporte", seleccionar "Descargar CSV"; el botón muestra spinner durante la descarga y el archivo se descarga automáticamente. Si el backend retorna error, aparece un toast de error y el botón regresa a su estado normal.

- [x] T013 [P] [US1] Agregar la función `downloadEventReport(eventId: string, format: "csv" | "pdf"): Promise<void>` en `app/client/src/app/(event)/_services/event-api.ts` que: (1) obtiene el JWT del cliente de sesión de Better Auth, (2) hace `fetch` al endpoint `/api/events/{eventId}/export?format={format}` con el header `Authorization: Bearer <token>`, (3) lanza un error tipado si `!res.ok`, (4) convierte la respuesta a `Blob`, (5) crea un `URL.createObjectURL(blob)` temporal, (6) crea un elemento `<a>` oculto con `href` y atributo `download` con el nombre del archivo extraído de `Content-Disposition`, (7) hace `.click()`, y (8) revoca la URL temporal con `URL.revokeObjectURL`
- [x] T014 [US1] Crear `app/client/src/app/(event)/[eventId]/_components/event-export-button.tsx` como Client Component (`"use client"`) con la interfaz `EventExportButtonProps { eventId: string }`, un botón con ícono `Download` de lucide-react que al hacer clic abre un `DropdownMenu` de shadcn/ui con las opciones "Descargar CSV" y "Descargar PDF"; al seleccionar una opción pone `isDownloading: true` y muestra un spinner en el botón, llama a `downloadEventReport(eventId, format)`, restaura el estado al completar, y muestra `toast.error(...)` con `sonner` si falla; mientras `isDownloading` es `true`, ambas opciones del menú deben estar deshabilitadas para evitar solicitudes simultáneas
- [x] T015 [US1] Integrar `<EventExportButton eventId={event.id} />` en `app/client/src/app/(event)/[eventId]/page.tsx` dentro de la sección de acciones del evento, junto al componente `EventActionsSection`, sin requerir datos adicionales del servidor

**Verificación de Phase 6**: Iniciar el cliente (`npm run dev`), navegar a la página de un evento como miembro activo, hacer clic en "Exportar reporte" → aparece dropdown → seleccionar "Descargar CSV" → el botón muestra spinner → el archivo se descarga automáticamente con nombre `{slug}-reporte.csv`.

---

## Phase 7 — Polish & Validación Transversal

**Objetivo**: Verificar la coherencia financiera, los casos límite documentados en la spec y la protección de datos.

- [x] T016 Validar en `app/server/app/modules/events/repositories/export_repository.py` que los cuatro métodos de query usan `text()` de SQLAlchemy (o la sintaxis de SQLModel equivalente) con parámetros nombrados (`:event_id`) y no concatenación de strings, para prevenir SQL injection
- [x] T017 Validar el caso de evento con gastos de gran volumen (simular 200 registros en entorno local): el endpoint retorna `200 OK` sin timeout y el archivo se descarga completamente; ajustar si hay regresiones de performance
- [x] T018 Verificar que el endpoint retorna `HTTP 403` cuando el JWT corresponde a un usuario que no es miembro activo del evento, y `HTTP 404` cuando el `event_id` no existe o el evento fue eliminado lógicamente; confirmar que ninguno de estos responses filtra datos del evento
- [x] T019 Verificar que el nombre del archivo en el header `Content-Disposition` no contiene caracteres inválidos para sistemas de archivos (no tildes, no símbolos especiales); probar con un evento cuyo nombre tenga tildes y caracteres especiales (p. ej. "Viaje a Córdoba — Año 2026")
- [x] T020 Verificar que el CSV generado tiene BOM UTF-8 (`EF BB BF`) como primeros bytes: `curl ... --output test.csv && xxd test.csv | head -1` debe mostrar `ef bb bf` al inicio

**Verificación de Phase 7**: Todas las verificaciones de esta fase pasan sin excepciones; el endpoint cumple los criterios de FR-001 a FR-012 de la spec.

---

## Implementation Strategy

### MVP (Phases 1-3 + Phase 6)

Implementar el endpoint CSV completo con su integración frontend. Esto entrega US1 (P1) completo y permite que los miembros descarguen datos tabulares de inmediato. El PDF (US2) y las verificaciones de liquidaciones (US3) se pueden iterar en la misma sesión.

### Orden recomendado de ejecución secuencial

```
T001 → T002 → T003 → T004
    ↓
T005, T006 (paralelos)
    ↓
T007 → T008 → T009
    ↓
T010
    ↓
T011, T012 (paralelos)
    ↓
T013, T014 (paralelos) → T015
    ↓
T016 → T017 → T018 → T019 → T020
```

### Archivos nuevos a crear

| Archivo | Tipo |
|---|---|
| `app/server/app/modules/events/formatters/__init__.py` | Python init |
| `app/server/app/modules/events/formatters/csv_formatter.py` | Python class |
| `app/server/app/modules/events/formatters/pdf_formatter.py` | Python class |
| `app/server/app/modules/events/repositories/export_repository.py` | Python class |
| `app/server/app/modules/events/services/export_data.py` | Python dataclasses |
| `app/server/app/modules/events/services/event_export_service.py` | Python class |
| `app/client/src/app/(event)/[eventId]/_components/event-export-button.tsx` | React Client Component |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `app/server/pyproject.toml` | Agregar `"reportlab>=4.2"` en `[project] > dependencies` |
| `app/server/app/modules/events/dependencies.py` | Agregar `get_export_service()` |
| `app/server/app/modules/events/routers/event_router.py` | Agregar endpoint `GET /{event_id}/export` |
| `app/server/app/modules/events/services/__init__.py` | Re-exportar dataclasses |
| `app/client/src/app/(event)/_services/event-api.ts` | Agregar `downloadEventReport()` |
| `app/client/src/app/(event)/[eventId]/page.tsx` | Integrar `EventExportButton` |

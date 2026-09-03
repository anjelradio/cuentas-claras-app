# Research: Exportación y Resumen Portable del Evento

**Feature**: `022-export-event-reports`
**Date**: 2026-09-03

---

## Decisión 1 — Librería de generación PDF

- **Decision**: `reportlab>=4.2`
- **Rationale**: Genera PDF programáticamente desde Python sin dependencias nativas del sistema operativo (sin headless browser, sin pango/cairo). API estable, madura y ampliamente usada en entornos de producción. Soporta tablas estructuradas (`Table`, `TableStyle`), texto con fuentes built-in y control de layout de página. Instalación limpia vía `pip` / `pyproject.toml`.
- **Alternatives considered**:
  - `WeasyPrint`: requiere binarios del sistema (pango, cairo) → problemático en despliegue Docker/CI sin configuración adicional.
  - `fpdf2`: más simple pero sin soporte nativo de tablas complejas con múltiples secciones.
  - `borb`: licencia dual restrictiva, ecosistema menos maduro.
  - `xhtml2pdf`: requiere renderizar HTML antes → overhead innecesario para un reporte tabular.

---

## Decisión 2 — Generación CSV

- **Decision**: Módulo `csv` de la stdlib de Python + `io.BytesIO` con prefijo BOM UTF-8
- **Rationale**: El módulo `csv` maneja correctamente comillas, comas y caracteres especiales (tildes, símbolos). No introduce dependencias externas. La adición de `\ufeff` (BOM UTF-8) al inicio del stream garantiza que Microsoft Excel reconozca la codificación UTF-8 al abrir el archivo directamente desde el explorador de archivos, sin necesitar pasos de importación manual.
- **Alternatives considered**:
  - `pandas.DataFrame.to_csv()`: introduce una dependencia pesada (NumPy, pandas) para una operación que la stdlib resuelve completamente.

---

## Decisión 3 — Descarga blob en el frontend (Client Component)

- **Decision**: `fetch` con header `Authorization` → `res.blob()` → `URL.createObjectURL` → `<a>.click()` desde un Client Component (`"use client"`)
- **Rationale**: Los Server Components de Next.js no pueden disparar descargas de archivos en el navegador (requieren interacción con el DOM). El JWT necesario para autenticar la solicitud solo está disponible en el cliente (a través del hook de sesión de Better Auth). El patrón `createObjectURL` + `<a>.click()` es el estándar web para descargas programáticas sin redirigir al usuario a una nueva URL visible.
- **Alternatives considered**:
  - `<a href="/api/events/{id}/export">` sin JWT: el endpoint FastAPI requiere Bearer token; una navegación directa sin header Authorization retornaría 401.
  - Server Action con stream: Next.js no garantiza soporte estable de streams binarios en Server Actions en la versión actual.
  - Proxy a través de Next.js route handler: añade latencia y complejidad sin beneficio adicional para esta operación.

---

## Decisión 4 — Repositorio de datos del reporte

- **Decision**: Nuevo `ExportRepository` con cuatro métodos: `get_event_header`, `get_member_balances`, `get_expense_rows`, `get_settlement_rows`
- **Rationale**: Las queries del reporte combinan datos de los módulos `events`, `expenses` y `payments`. Concentrarlas en un repositorio dedicado dentro de `events/` respeta la Constitution §VIII (único punto de acceso a la BD) y §XI (los módulos no acceden directamente a repositorios ajenos). El módulo `events` ya tiene precedente de queries cross-module (p. ej. `EventStatisticsRead` hace joins con `expense`). El repository es de solo lectura; no realiza commits.
- **Alternatives considered**:
  - Reutilizar `AnalyticsRepository` (feature 021): su API es para el dashboard de métricas agregadas; el reporte necesita filas individuales por gasto, split y pago, lo que implicaría sobrecargar ese repositorio con responsabilidades distintas.
  - Llamar a los repositorios de `expenses` y `payments` directamente desde el service de events: viola §XI (un módulo no accede a repositorios ajenos).

---

## Decisión 5 — Nombre del archivo descargado

- **Decision**: `{slug}-reporte.{csv|pdf}` donde `slug` se genera normalizando `event.name`:
  1. Convertir a minúsculas
  2. Reemplazar tildes y diacríticos (`á→a`, `é→e`, etc.) con `unicodedata.normalize('NFKD')`
  3. Eliminar caracteres no ASCII
  4. Reemplazar espacios y caracteres no alfanuméricos con guiones
  5. Truncar a 50 caracteres para evitar nombres excesivamente largos
- **Rationale**: FR-012 exige un nombre descriptivo. La normalización garantiza compatibilidad con sistemas de archivos Windows (que prohíbe caracteres como `<>:"/\|?*`) y macOS/Linux.
- **Alternatives considered**: Usar el `event_id` UUID como nombre del archivo → no cumple FR-012 (no es descriptivo).

---

## Requerimientos de instalación (backend)

```toml
# Agregar en [project] > dependencies en app/server/pyproject.toml
"reportlab>=4.2",
```

No se requieren binarios del sistema ni configuraciones adicionales de Docker.

---

## Patrones de referencia en el proyecto

| Patrón | Referencia en el código |
|---|---|
| Autorización de miembro activo | `EventAuthorizationService.require_active_member()` |
| Repository con joins cross-module | `event_repository.py` (joins con `EventMember`, `User`) |
| Dependency injection del service | `dependencies.py` → `get_event_service()` |
| StreamingResponse en FastAPI | Patrón nuevo; soportado nativamente por FastAPI/Starlette |
| Client Component con fetch + blob | Patrón nuevo para este proyecto; estándar web documentado |
| Toast de error con sonner | `event-actions-section.tsx` (`toast.error(...)`) |

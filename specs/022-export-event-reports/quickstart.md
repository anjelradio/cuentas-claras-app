# Quickstart: Exportación y Resumen Portable del Evento

**Feature**: `022-export-event-reports`
**Date**: 2026-09-03

---

## Prerrequisitos

1. El servidor FastAPI está corriendo en `http://localhost:8000`.
2. El cliente Next.js está corriendo en `http://localhost:3000`.
3. Existe al menos un evento con gastos, miembros activos y pagos registrados.
4. Se dispone de un JWT válido para un miembro activo del evento (`MEMBER_JWT`).
5. `reportlab` está instalado en el entorno del servidor (`pip install reportlab`).

---

## Escenario 1 — Descarga de CSV via curl

```bash
EVENT_ID="<uuid-del-evento>"
MEMBER_JWT="<jwt-válido>"

curl -X GET "http://localhost:8000/api/events/${EVENT_ID}/export?format=csv" \
  -H "Authorization: Bearer ${MEMBER_JWT}" \
  --output "reporte-del-evento.csv"
```

**Resultado esperado**:
- HTTP 200
- Archivo `reporte-del-evento.csv` generado en el directorio actual
- Contiene 4 secciones: encabezado del evento, balances de participantes, historial de gastos, liquidaciones
- `file reporte-del-evento.csv` → `UTF-8 Unicode (with BOM) text`

---

## Escenario 2 — Descarga de PDF via curl

```bash
EVENT_ID="<uuid-del-evento>"
MEMBER_JWT="<jwt-válido>"

curl -X GET "http://localhost:8000/api/events/${EVENT_ID}/export?format=pdf" \
  -H "Authorization: Bearer ${MEMBER_JWT}" \
  --output "reporte-del-evento.pdf"
```

**Resultado esperado**:
- HTTP 200
- Archivo `reporte-del-evento.pdf` válido (verificar con `pdfinfo` o abrir en visor)
- Contiene: encabezado, tabla de balances, tabla de gastos, tabla de liquidaciones, pie de página

---

## Escenario 3 — Rechazo de usuario no miembro

```bash
EVENT_ID="<uuid-del-evento>"
NON_MEMBER_JWT="<jwt-de-usuario-no-miembro>"

curl -X GET "http://localhost:8000/api/events/${EVENT_ID}/export?format=csv" \
  -H "Authorization: Bearer ${NON_MEMBER_JWT}"
```

**Resultado esperado**:
- HTTP 403
- Body: `{"code":"forbidden","message":"No eres miembro activo de este evento.","details":null}`

---

## Escenario 4 — Formato inválido

```bash
curl -X GET "http://localhost:8000/api/events/${EVENT_ID}/export?format=xlsx" \
  -H "Authorization: Bearer ${MEMBER_JWT}"
```

**Resultado esperado**:
- HTTP 422
- Body con error de validación del parámetro `format`

---

## Escenario 5 — Descarga desde el frontend

1. Navegar a la página del evento: `http://localhost:3000/(event)/{eventId}`.
2. Hacer clic en el botón **"Exportar reporte"** (visible en la sección de acciones del evento).
3. En el menú emergente, seleccionar **"Descargar CSV"** o **"Descargar PDF"**.
4. El botón muestra un spinner durante la descarga.
5. El archivo se descarga automáticamente con el nombre `{slug-evento}-reporte.{csv|pdf}`.
6. El botón regresa a su estado normal al completarse.

**Verificación de coherencia financiera**:
- Abrir el archivo descargado y comparar la columna "Diferencia Neta" de cada participante con los valores mostrados en el dashboard del evento (feature 021).
- Los valores deben coincidir exactamente hasta el segundo decimal.

---

## Escenario 6 — Evento sin gastos (estado vacío)

```bash
EMPTY_EVENT_ID="<uuid-de-evento-sin-gastos>"

curl -X GET "http://localhost:8000/api/events/${EMPTY_EVENT_ID}/export?format=pdf" \
  -H "Authorization: Bearer ${MEMBER_JWT}" \
  --output "reporte-vacio.pdf"
```

**Resultado esperado**:
- HTTP 200
- PDF válido que contiene: encabezado del evento y participantes (si los hay), con mensaje "Sin gastos registrados" en la sección de historial.

---

## Invariantes a verificar

| Invariante | Cómo verificar |
|---|---|
| `sum(member_balances[*].total_paid) == sum(expenses[*].amount)` | Sumar columnas del CSV |
| Los gastos eliminados no aparecen | Eliminar un gasto lógicamente y regenerar el reporte |
| El nombre del archivo incluye el slug del evento | Inspeccionar el header `Content-Disposition` con curl |
| El archivo CSV es UTF-8 con BOM | `hexdump -C reporte.csv \| head -1` → primeros bytes `ef bb bf` |

---

## Referencias

- Contrato de API: [`contracts/export-api.md`](contracts/export-api.md)
- Modelo de datos: [`data-model.md`](data-model.md)
- Decisiones técnicas: [`research.md`](research.md)
- Plan completo: [`plan.md`](plan.md)

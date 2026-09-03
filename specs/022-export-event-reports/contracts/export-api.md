# Contrato de API: Exportación de Reporte del Evento

**Feature**: `022-export-event-reports`
**Date**: 2026-09-03

---

## Endpoint

### `GET /api/events/{event_id}/export`

Genera y entrega como descarga directa un reporte consolidado del evento en el formato solicitado.

#### Path Parameters

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `event_id` | UUID | ✅ | Identificador del evento |

#### Query Parameters

| Parámetro | Tipo | Requerido | Valores | Descripción |
|---|---|---|---|---|
| `format` | string | ✅ | `csv`, `pdf` | Formato del archivo generado |

#### Headers

| Header | Valor | Requerido |
|---|---|---|
| `Authorization` | `Bearer <jwt>` | ✅ |

---

## Respuestas exitosas

### `200 OK` — Formato CSV

```
HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="{slug-del-evento}-reporte.csv"
```

**Body**: Stream binario del archivo CSV con BOM UTF-8.

**Ejemplo de contenido**:
```
Evento,Viaje a Cochabamba
Moneda,Bs.
Estado,open
Creador,María López
Fecha de creación,2026-08-15

Participante,Monto Pagado,Monto Consumido,Diferencia Neta,Estado
María López,350.00,150.00,200.00,acreedor
Carlos Ríos,0.00,100.00,-100.00,deudor
Ana Torres,100.00,200.00,-100.00,deudor

Fecha,Descripción,Pagador,Categoría,Monto,Método de División
2026-08-15,Almuerzo grupal,María López,food,150.00,equal
2026-08-16,Combustible,María López,transport,200.00,equal
2026-08-17,Hotel,Ana Torres,lodging,100.00,equal

Pagador,Acreedor,Monto,Estado,Fecha
Carlos Ríos,María López,50.00,pending_confirmation,2026-08-18
Ana Torres,María López,75.00,confirmed,2026-08-19
```

---

### `200 OK` — Formato PDF

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="{slug-del-evento}-reporte.pdf"
```

**Body**: Stream binario del archivo PDF válido (generado con reportlab).

**Contenido del PDF**:
1. Título: "Reporte del Evento: {nombre}"
2. Metadatos del evento (moneda, estado, creador, fecha de creación)
3. Tabla de balance de participantes (con columnas: Participante, Pagado, Consumido, Diferencia, Estado)
4. Tabla de historial de gastos (con columnas: Fecha, Descripción, Pagador, Categoría, Monto, División)
5. Tabla de liquidaciones (con columnas: Pagador, Acreedor, Monto, Estado, Fecha)
6. Pie de página con fecha/hora de generación

---

## Respuestas de error

Todos los errores siguen el contrato centralizado del backend:

```json
{
  "code": "<código-estable-legible>",
  "message": "<mensaje-público-seguro>",
  "details": null
}
```

### `401 Unauthorized` — Token ausente o inválido
```json
{ "code": "unauthorized", "message": "Autenticación requerida.", "details": null }
```

### `403 Forbidden` — Usuario no es miembro activo del evento
```json
{ "code": "forbidden", "message": "No eres miembro activo de este evento.", "details": null }
```

### `404 Not Found` — Evento no existe o fue eliminado lógicamente
```json
{ "code": "not_found", "message": "El evento no existe.", "details": null }
```

### `422 Unprocessable Entity` — Formato no válido
```json
{
  "code": "validation_error",
  "message": "El parámetro 'format' debe ser 'csv' o 'pdf'.",
  "details": null
}
```

---

## Reglas del contrato

1. El endpoint no retorna JSON bajo ninguna circunstancia en caso de éxito — el body es siempre el binario del archivo.
2. El nombre del archivo en `Content-Disposition` sigue el patrón: `{slug}-reporte.{csv|pdf}` donde `slug` es el nombre del evento normalizado (minúsculas, sin tildes, sin caracteres especiales, espacios reemplazados por guiones, máximo 50 caracteres).
3. Los gastos con `deleted_at IS NOT NULL` están excluidos del reporte en cualquier formato.
4. Los montos en el CSV se representan como strings decimales con dos decimales (p. ej. `"150.00"`), sin símbolo de moneda.
5. Las fechas en el CSV se representan en formato `YYYY-MM-DD`.
6. El estado de liquidaciones en el CSV usa los valores en texto legible: `"Saldado"` para `confirmed` y `"Pendiente"` para `pending_confirmation`.
7. La codificación del CSV es UTF-8 con BOM (`EF BB BF`) para compatibilidad con Microsoft Excel.

# Contratos HTTP: Fundación del backend

## Convenciones

- Base de rutas públicas: `/api/v1`.
- Las respuestas usan JSON y los nombres de campos definidos en [data-model.md](../data-model.md).
- Las rutas futuras protegidas usarán `Authorization: Bearer <jwt>` y reutilizarán el verificador interno. Esta feature no expone aún ninguna ruta protegida.

## `GET /api/v1/health`

Comprueba disponibilidad pública. No autentica ni toca la base de datos.

### Respuesta exitosa — 200

```json
{
  "status": "ok",
  "service": "cuentas-claras-server"
}
```

## Contrato de error uniforme

Las rutas presentes y futuras devuelven este formato cuando ocurre un error controlado:

```json
{
  "code": "AUTHENTICATION_REQUIRED",
  "message": "Se requiere una credencial válida para realizar esta operación.",
  "details": null
}
```

| Clase | Estado HTTP | Código público | Regla |
|---|---:|---|---|
| Autenticación | 401 | `AUTHENTICATION_REQUIRED` o `INVALID_CREDENTIAL` | No revela por qué falló una firma o claim. |
| Autorización futura | 403 | `FORBIDDEN` | No se implementa en esta feature. |
| Validación | 422 | `VALIDATION_ERROR` | `details` solo incluye campos permitidos. |
| Infraestructura inesperada | 500 | `INTERNAL_ERROR` | Sin trazas, SQL, secretos ni tokens. |

Las rutas no pueden devolver formatos de error alternativos.

# Quickstart: validar ciclo de vida y QR de eventos

## Prerrequisitos

- PostgreSQL/Neon accesible desde `app/server/`.
- Better Auth configurado para emitir JWT verificables por el backend.
- Cuenta Cloudinary con credenciales de servidor. No colocar estas credenciales en `app/client/`.
- `pnpm` para el cliente y Python 3.12+ para el servidor.

## Configuración local

1. Copiar `app/server/.env.example` a `app/server/.env` y completar `DATABASE_URL`, JWT/JWKS, CORS y las variables `CLOUDINARY_*` indicadas por el plan.
2. Instalar dependencias del servidor, incluida la nueva dependencia Cloudinary, y aplicar la migración Alembic de esta feature.
3. Copiar la configuración de cliente existente y definir `NEXT_PUBLIC_API_URL` hacia el backend local. El cliente no necesita ni debe recibir variables Cloudinary.

## Ejecutar comprobaciones

```bash
cd app/server
pytest
ruff check app tests
mypy

cd ../client
pnpm lint
pnpm typecheck
pnpm test
```

Las pruebas del proveedor Cloudinary deben usar un adaptador simulado; no deben realizar cargas ni borrados reales durante la suite automatizada.

## Escenarios manuales de aceptación

### 1. Abandonar un evento

1. Iniciar sesión como miembro regular de un evento abierto que tenga QR.
2. Abrir “Mis eventos”; confirmar que la tarjeta muestra “Abandonar” con el estilo de la referencia.
3. Abrir el AlertDialog, cancelar y verificar que el evento sigue visible.
4. Confirmar el abandono; esperar toast de éxito y actualización de lista. El evento ya no debe aparecer.
5. Repetir como dueño: el backend debe rechazarlo, mostrarse un toast indicando que transfiera propiedad y no debe cambiar la lista.
6. Repetir sobre evento cerrado mediante una solicitud o vista previa: debe rechazarse sin cambiar membresía.

### 2. Transferencia y cierre

1. Como dueño de un evento abierto, transferir propiedad desde miembros a otro miembro activo.
2. Verificar toast y navegación a `/my-events`; al volver al evento no deben aparecer acciones administrativas del dueño anterior.
3. Como nuevo dueño, cerrar desde Event Home. Verificar que el control cambia a “Reabrir evento” y las acciones mutables desaparecen o quedan inactivas.
4. Verificar que invitación, edición, transferencia, remoción, abandono y carga de QR se rechazan en backend cuando el evento está cerrado.
5. Reabrir como dueño y verificar que las acciones condicionadas vuelven a estar disponibles.

### 3. Registrar y actualizar QR

1. Como miembro activo de un evento abierto, cargar Event Home y confirmar que detalle del evento y QR se solicitan en paralelo.
2. Sin QR existente, abrir “Registrar QR”; seleccionar JPEG, PNG o WebP menor o igual a 5 MiB y confirmar.
3. Verificar toast de éxito, cierre del Sheet, refresh y la imagen confirmada con “Actualizar QR”.
4. Reemplazar el QR y verificar que el nuevo activo se muestra; el anterior queda en limpieza pendiente/completada sin revertir el nuevo.
5. Probar archivo vacío, dañado, de otro tipo o mayor a 5 MiB. Debe mostrarse un toast comprensible y mantenerse la imagen anterior.
6. Abandonar un evento con QR y verificar que no queda QR visible; una falla de limpieza externa no debe reactivar la membresía.

## Contratos y modelo

- Rutas, respuestas y errores: [events-lifecycle.openapi.yaml](./contracts/events-lifecycle.openapi.yaml).
- Persistencia, estados y compensación de Cloudinary: [data-model.md](./data-model.md).

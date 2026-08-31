# Quickstart: validar fechas y filtro de eventos

## Prerrequisitos

- PostgreSQL/Neon configurado para `app/server/` y la configuración local de autenticación disponible.
- Dependencias instaladas en `app/server/` y `app/client/`.
- Una identidad autenticada con al menos un evento abierto y, para validar el filtro, uno cerrado.

## Preparación

1. Desde `app/server/`, generar y revisar la nueva migración Alembic; confirmar que depende de la revisión vigente y que rellena los eventos existentes antes de hacer obligatoria la fecha final.
2. Aplicar la migración en una base de desarrollo y levantar el servidor.
3. Desde `app/client/`, levantar Next.js con `NEXT_PUBLIC_API_URL` apuntando al servidor local.

## Comprobaciones automatizadas

```bash
cd app/server
pytest
ruff check app tests
mypy app tests

cd ../client
pnpm lint
pnpm typecheck
pnpm test
```

## Escenarios manuales de aceptación

### 1. Crear y editar el período

1. Abrir “Crear evento”; verificar que el formulario conserva su card, selector de emoji y campos centrados, ahora con leyendas de inicio y fin.
2. Crear un evento con el mismo día como inicio y fin; confirmar éxito y que el detalle muestra ambas fechas en español, por ejemplo “5 de noviembre de 2025”.
3. Editar la fecha final por una posterior; confirmar que el detalle muestra el nuevo período.
4. Intentar crear y editar con fin anterior al inicio; confirmar mensaje claro y que no se guarda ninguna combinación parcial.

### 2. Listar todos o solo abiertos

1. Como miembro activo de un evento abierto y uno cerrado, consultar la lista sin filtro; verificar que incluye ambos y ningún evento ajeno.
2. Consultar con `active_only=true`; verificar que solo devuelve el abierto.
3. Repetir con una persona que no tenga eventos abiertos; verificar una lista vacía, sin error.
4. Verificar que una persona sin membresía activa no puede obtener el detalle de un evento ni verlo en la lista.

### 3. Selector de Registrar gasto desde Home

1. Cargar Home; abrir “Registrar gasto”.
2. Verificar que el Sheet muestra solamente los eventos abiertos reales con emoji, nombre y número de miembros, sin tarjeta estática.
3. Seleccionar un evento y confirmar que conserva el flujo actual hacia el comprobante, asociado al evento elegido.
4. Probar una persona sin eventos abiertos; verificar un estado vacío accesible y que no existe una selección inválida.

## Referencias

- Contrato de API: [events-dates-filter.openapi.yaml](./contracts/events-dates-filter.openapi.yaml).
- Entidades, invariantes y migración: [data-model.md](./data-model.md).
- Decisiones técnicas: [research.md](./research.md).

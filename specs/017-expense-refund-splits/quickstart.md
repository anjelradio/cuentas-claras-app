# Quickstart: Validación de división y devolución

**Feature**: `017-expense-refund-splits` | **Date**: 2026-09-01

## Preparación

1. Aplicar la migración en una base de prueba con al menos un gasto anterior que tenga split del pagador.
2. Levantar FastAPI y Next.js con sus entornos de prueba.
3. Disponer de un evento abierto con cuatro miembros activos y sesión válida del miembro A.

## Migración

- El gasto histórico conserva su total.
- El split de A queda eliminado lógicamente.
- `payer_participated` refleja que A estaba incluido.
- `refund_amount` coincide con la suma activa de B, C y D.
- Ninguna devolución es negativa ni mayor al total.

## Equal con pagador participante

1. Abrir `/expenses/event/{eventId}/create` y poner `200.00`.
2. Elegir equal y responder que sí participó.
3. Verificar que A aparece como “Este eres tú”, pero no en la lista editable.
4. Seleccionar B, C y D.

Resultado: request sin `paid_by_member_id` ni A entre participantes; tres splits de `50.00`; devolución `150.00`; aporte `50.00`.

## Invitado excluido

Para `200.00`, pagador participante y solo B/C seleccionados: dos splits suman `133.33`, el aporte de A es `66.67` y el total se conserva exactamente.

## Pagador no participante

Responder “No” y seleccionar B/C/D. Sus splits cubren `200.00`, la devolución es `200.00` y el aporte `0.00`. Sin otros seleccionados no se puede confirmar.

## Exact con aporte propio

Para `200.00`, asignar B=`50.00`, C=`50.00`, D=`70.00` y pagador participante. Resultado: devolución `170.00`, aporte `30.00` y tres splits. Una entrada 0.00 no crea split activo.

## Validaciones exactas

- Suma `220.00`: cliente bloquea y backend rechaza si se fuerza.
- Pagador no participante con suma `170.00`: rechazo; debe cubrir `200.00`.
- ID del pagador, miembro ajeno/inactivo o duplicado: rechazo.

## Edición atómica

Editar equal de `200.00` a `120.00` conservando A/B/C/D como consumidores. Resultado: tres splits de `30.00`, devolución `90.00`, aporte `30.00`. Una prueba que fuerce fallo antes del commit debe demostrar que gasto, devolución y splits conservan el estado previo.

## Comandos

Desde `app/server`:

```bash
source venv/bin/activate
pytest
ruff check .
```

Desde `app/client`:

```bash
pnpm test
pnpm lint
pnpm build
```

## Criterio de cierre

Todas las pruebas financieras conservan centavos exactamente, ningún payload o split incluye al pagador, la edición restaura `payer_participated` y la UI muestra total, devolución y aporte en creación y lectura.

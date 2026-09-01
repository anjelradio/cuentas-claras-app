# Research: División de gastos con devolución al pagador

**Feature**: `017-expense-refund-splits` | **Date**: 2026-09-01

## Estado actual auditado

- Equal divide el total entre todos los IDs recibidos y persiste un split por cada uno, incluido el pagador.
- Exact exige que la suma sea exactamente igual al total y conserva entradas 0.00.
- Create y update aceptan `paid_by_member_id` desde el cliente; creador y pagador pueden divergir.
- La edición ya reconcilia splits con restauración y soft-delete bajo un Unit of Work; esta base se conservará.
- `Expense` no contiene devolución ni participación del pagador.
- El frontend selecciona inicialmente todos los miembros, muestra al usuario actual como seleccionable y usa `float` para la vista previa.
- Las páginas pueden mezclar `user_id` con `EventMember.id` y aplican fallbacks inseguros si falla la sesión o membresía.
- Expenses importa repositories y modelos internos de Events, contrario a la encapsulación modular.

## Decisión 1: el pagador se deriva del actor autenticado

**Decision**: Crear el gasto fija `paid_by_member_id = created_by_member_id = current_event_member.id`. Los Request públicos no aceptan `paid_by_member_id` y la edición no permite cambiarlo.

**Rationale**: La identidad es una regla de negocio y seguridad. La constitución prohíbe aceptar desde HTTP valores que deben derivarse del actor autenticado.

**Alternatives considered**:
- Conservar el campo y validar coincidencia: mantiene una superficie redundante.
- Permitir pagos por terceros: contradice el alcance y requeriría otra specification.

## Decisión 2: persistir devolución y participación

**Decision**: Agregar `refund_amount: Decimal` y `payer_participated: bool` a `Expense`. Exponer `payer_contribution = amount - refund_amount` como valor derivado.

**Rationale**: La devolución debe coincidir con la suma de splits activos. La participación no se puede reconstruir: el aporte puede representar consumo personal, invitados excluidos o ambos.

**Alternatives considered**:
- Calcular siempre devolución desde splits: no satisface el requisito de almacenarla.
- Persistir también el aporte: duplica estado derivable.
- Inferir participación de la devolución: es ambiguo.

## Decisión 3: equal divide entre consumidores

**Decision**: El denominador representa consumidores. Incluye al pagador solo si `payer_participated=true`; la lista enviada contiene exclusivamente otros consumidores. Solo estos últimos producen splits.

**Rationale**: Separa correctamente quién consumió de quién debe dinero. Un invitado excluido y un pagador que no consumió no pertenecen al denominador.

**Alternatives considered**:
- Dividir únicamente entre deudores: cobraría a los demás el consumo del pagador participante.
- Crear y ocultar un split del pagador: conserva una deuda ficticia.

## Decisión 4: centavos deterministas

**Decision**: Convertir el total a centavos. Equal distribuye cociente y residuo. Si participa el pagador, recibe primero un centavo residual y el resto se asigna por UUID ascendente; si no participa, todo residuo se asigna por UUID a los demás.

**Rationale**: Conserva exactamente el total. Para 200.00 entre pagador y dos miembros, el aporte queda 66.67 y los splits suman 133.33.

**Alternatives considered**:
- Redondear con float: puede perder o crear centavos.
- Asignar siempre el residuo al primer split: no reproduce el aporte esperado.

## Decisión 5: exact admite aporte propio

**Decision**: Con `payer_participated=true`, exact admite `sum(splits) <= amount`; la diferencia es aporte propio. Con `false`, exige `sum(splits) == amount`. Montos 0.00 se omiten.

**Rationale**: Un pagador participante puede absorber una parte. Si declara que no participó, su aporte de consumo debe ser cero.

**Alternatives considered**:
- Permitir suma menor cuando no participó: deja un aporte sin significado.
- Persistir splits cero: agrega filas sin deuda.

## Decisión 6: migración histórica con soft-delete

**Decision**: Inferir `payer_participated` desde un split activo del pagador; marcar lógicamente splits del pagador y cuotas cero; calcular `refund_amount` desde los splits activos restantes; después aplicar `NOT NULL` y el check.

**Rationale**: El contrato anterior normalmente incluía al pagador y su cuota representa razonablemente el aporte histórico. Se conserva auditoría y no hay hard-delete.

**Alternatives considered**:
- Default global `true`: no representa gastos históricos sin split propio.
- Borrar filas: viola eliminación lógica.
- Inicializar devolución con el total: perpetúa la deuda propia.

## Decisión 7: interfaz pública de Events

**Decision**: Events expondrá una capacidad pública mínima para contexto, miembro actual, miembros activos y nombres; Expenses no importará repositories ni modelos internos de Events.

**Rationale**: Cumple la constitución sin duplicar SQL ni crear un paquete common.

**Alternatives considered**:
- Mantener imports directos: viola una regla obligatoria.
- Crear un paquete shared: abstracción amplia sin necesidad actual.

## Decisión 8: wizard y vista previa segura

**Decision**: El Sheet pregunta primero si el pagador participó y después muestra solo otros miembros. La vista previa calcula con centavos enteros; el backend sigue siendo autoridad.

**Rationale**: Elimina la auto-selección ambigua y ofrece feedback inmediato sin sacrificar integridad.

**Alternatives considered**:
- Mantener al pagador como checkbox: hace implícita la regla contable.
- Usar decimales JS sin normalización: puede diferir del backend.

## Dependencias y alcance

No se necesitan librerías nuevas. Se reutilizan FastAPI, SQLModel, Alembic, Pydantic, Zod, shadcn/ui Sheet y Sonner. No se agregan estados de pago `pending|paid|cancelled`; pertenecen a una feature futura de liquidación.

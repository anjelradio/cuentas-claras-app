# Research: fechas y filtro de eventos

## Decision: representar la fecha final como `ends_at` obligatorio

**Rationale**: El recurso ya usa `starts_at` como fecha y hora. Mantener el par `starts_at`/`ends_at` evita nombres ambiguos, mantiene la respuesta homogénea y permite que creación, actualización, resumen y detalle compartan el mismo contrato.

**Alternatives considered**:

- Usar un campo de solo fecha distinto: descartado porque rompería la coherencia con `starts_at` y obligaría a conversiones especiales.
- Hacer la fecha final opcional permanentemente: descartado porque la specification exige que todo evento nuevo tenga período completo.

## Decision: permitir eventos de un día y rechazar solo fin anterior al inicio

**Rationale**: Un evento puede comenzar y terminar el mismo día. La única combinación inválida es `ends_at < starts_at`; debe validarse antes de persistir tanto para creación como para PATCH parcial.

**Alternatives considered**:

- Exigir que el fin sea estrictamente posterior: descartado porque impediría eventos de un solo día.
- Validar únicamente en el formulario: descartado porque un cliente no es fuente confiable de reglas de negocio.

## Decision: migrar eventos históricos usando su fecha de inicio como fecha de fin

**Rationale**: La tabla ya contiene eventos sin fecha final. Agregar la columna nullable, completar `ends_at = starts_at` y hacerla obligatoria conserva todos los datos y representa el valor histórico como un evento de un día sin inventar fechas futuras.

**Alternatives considered**:

- Introducir un valor arbitrario como fin: descartado porque alteraría la semántica histórica.
- Mantener `ends_at` nullable: descartado porque extendería indefinidamente un estado de datos incompleto y no cumple FR-001.

## Decision: usar `active_only=false` como query opcional en la lista

**Rationale**: La lista existente ya devuelve todos los eventos de membresías activas, abiertos y cerrados. Un booleano optativo conserva ese comportamiento por defecto y permite al Home solicitar solo los que están abiertos.

**Alternatives considered**:

- Crear una ruta adicional de eventos activos: descartado porque duplicaría contrato y lógica.
- Hacer que la lista general devuelva solo abiertos: descartado porque eliminaría del usuario el acceso a eventos cerrados que sigue necesitando consultar.

## Decision: definir “activo” como estado `open`

**Rationale**: Events ya posee únicamente los estados `open` y `closed`; la specification define explícitamente que “activo” equivale a abierto. La pertenencia de la persona sigue siendo un requisito separado: solo se listan membresías activas.

**Alternatives considered**:

- Inferir actividad por la fecha final: descartado porque el ciclo vigente del módulo está gobernado por su estado, no por la fecha.
- Incluir membresías abandonadas: descartado porque contradice el comportamiento actual y la specification.

## Decision: incluir `member_count` en cada resumen de evento

**Rationale**: El selector de “Registrar gasto” debe mostrar nombre, emoji y cantidad de miembros. Entregar el conteo agregado en el resumen evita una solicitud adicional por evento y mantiene la información autorizada/filtrada por el backend.

**Alternatives considered**:

- Consultar los miembros de cada evento desde el Sheet: descartado por el patrón N+1 y porque complica permisos, carga y estados.
- Omitir el conteo en Home: descartado porque el usuario lo requiere como información del selector.

## Decision: formatear en español con zona horaria UTC

**Rationale**: Los valores se almacenan y transportan como instantes ISO. Al usar `UTC` en el formato de fecha se evita que un valor de medianoche aparezca como el día anterior o siguiente según el navegador de la persona. El resultado será, por ejemplo, “5 de noviembre de 2025”.

**Alternatives considered**:

- Dejar el formato nativo del navegador: descartado porque no garantiza español ni consistencia visual.
- Repetir el formateo en cada página: descartado porque puede producir variaciones y errores de zona horaria.

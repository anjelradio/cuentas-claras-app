<!--
Sync Impact Report
- Cambio de versión: 1.1.1 → 1.2.0
- Principios modificados:
  - IX. SQLModel, SQLAlchemy y Alembic → mismo título; se añaden el registro
    canónico de modelos para Alembic, el BaseModel persistente y la eliminación
    lógica obligatoria.
- Secciones añadidas: ninguna.
- Secciones eliminadas: ninguna.
- TODOs de seguimiento: ninguno.
-->

# Cuentas Claras Constitution

## Core Principles

### I. Monorepo, ubicación de proyectos y separación de responsabilidades

Cuentas Claras DEBE mantenerse como un monorepo con separación explícita entre
frontend y backend.

La raíz del repositorio DEBE contener la configuración, memoria y artefactos de
SpecKit, mientras que todo el código ejecutable de la aplicación DEBE permanecer
dentro de:

app/

La ubicación obligatoria de los proyectos DEBE ser:

- app/client/: proyecto frontend construido con Next.js.
- app/server/: proyecto backend construido con FastAPI.

La estructura general del repositorio DEBE contemplar como mínimo:

```text
.
├── .agents/
├── .specify/
└── app/
    ├── client/
    └── server/
```

La carpeta .specify/ DEBE contener la constitución, specifications, plans, tasks
y demás artefactos administrados por SpecKit.

La carpeta .agents/ PUEDE contener agentes, skills e instrucciones auxiliares
para el desarrollo.

No se DEBE crear otro proyecto frontend o backend fuera de app/.

No se DEBEN crear carpetas alternativas de nivel superior llamadas frontend/ o
backend/ para alojar las aplicaciones.

Toda implementación exclusiva del frontend DEBE crear o modificar archivos
únicamente dentro de:

app/client/

Se permiten cambios fuera de app/client/ únicamente cuando se trate de
configuración compartida del monorepo y la specification o plan lo justifique
explícitamente.

Toda implementación exclusiva del backend DEBE crear o modificar archivos
únicamente dentro de:

app/server/

Se permiten cambios fuera de app/server/ únicamente cuando se trate de
configuración compartida del monorepo y la specification o plan lo justifique
explícitamente.

Una funcionalidad transversal PUEDE modificar ambos proyectos, pero su
specification y plan DEBEN identificar claramente qué responsabilidades y
archivos pertenecen a cada uno.

El frontend DEBE encargarse de:

- Presentación.
- Interacción con el usuario.
- Navegación.
- Estados de interfaz.
- Validación orientada a experiencia de usuario.
- Consumo de la API.

El backend DEBE ser la fuente de verdad para:

- Reglas de negocio.
- Persistencia.
- Integridad financiera.
- Validación de autenticación.
- Autorización contextual.
- Operaciones transaccionales.

El frontend no DEBE considerarse una fuente confiable de autorización, identidad
validada ni reglas financieras.

La lógica compartida entre frontend y backend solo PUEDE duplicarse cuando sea
necesario para mejorar la experiencia del usuario.

Toda validación relevante para seguridad, integridad o reglas del negocio DEBE
volver a ejecutarse en el backend.

### II. Simplicidad y excepciones justificadas

La solución más sencilla que cumpla correctamente el caso de uso DEBE tener
prioridad.

No se DEBEN introducir abstracciones, librerías, carpetas, patrones o capas sin
una necesidad concreta.

No se DEBE implementar infraestructura destinada únicamente a hipotéticas
necesidades futuras.

Toda excepción arquitectónica DEBE:

- Documentarse en la specification o plan correspondiente.
- Explicar por qué la estructura estándar no es suficiente.
- Identificar sus riesgos.
- Mantenerse limitada al alcance que la justificó.
- Ser aprobada durante la revisión.

Una excepción aplicada a una funcionalidad no modifica automáticamente la
constitución ni crea un patrón general para el resto del proyecto.

### III. Calidad, pruebas y regresiones

Toda funcionalidad DEBE incluir pruebas proporcionales a su riesgo.

Toda corrección de un defecto DEBE incluir una prueba de regresión cuando el
comportamiento pueda verificarse automáticamente.

Antes de integrar un cambio DEBEN aprobarse las comprobaciones de test, formato,
lint y tipado definidas para el proyecto correspondiente.

Las interfaces públicas, contratos y funciones relevantes DEBEN estar
correctamente tipados.

El código nuevo no DEBE introducir advertencias de tipado, lint o formato que
hayan sido configuradas como errores por el proyecto.

Las pruebas DEBEN verificar comportamientos observables y reglas relevantes, no
detalles accidentales de implementación.

## Principios del backend

### IV. Arquitectura modular del backend

El backend DEBE residir exclusivamente dentro de:

app/server/

El backend DEBE implementarse como un monolito modular construido con FastAPI y
orientado a capacidades del negocio.

Cada módulo DEBE ubicarse bajo:

app/server/app/modules/<nombre_del_modulo>/

Cada módulo DEBE utilizar como estructura base:

- routers/
- schemas/
- services/
- repositories/
- models/

Un módulo PUEDE agregar elementos como los siguientes únicamente cuando exista
una necesidad concreta y justificada en su specification o plan:

- dependencies/
- exceptions/
- domain/
- strategies/
- integrations/

Las carpetas shared o common solo PUEDEN contener elementos verdaderamente
transversales.

Las carpetas shared o common no DEBEN utilizarse como contenedores genéricos de
código sin un propietario o propósito claro.

Cada módulo DEBE representar una capacidad identificable del negocio y no una
separación puramente técnica sin cohesión funcional.

### V. Dirección de dependencias del backend

La dirección obligatoria de dependencias dentro de cada módulo DEBE ser:

Router -> Service -> Repository -> Base de datos

Los routers no DEBEN acceder directamente a:

- Repositories.
- Modelos de persistencia.
- Sesiones.
- Conexiones.
- Consultas SQL.

Los services no DEBEN ejecutar consultas SQL ni acceder directamente a la base
de datos.

Los repositories no DEBEN depender de routers.

Los modelos de persistencia no DEBEN contener comportamiento HTTP.

Las dependencias no DEBEN invertir esta dirección para evitar una capa
arquitectónica.

### VI. Responsabilidad de los routers

Los routers DEBEN limitarse a:

- Definir rutas.
- Definir métodos HTTP.
- Recibir datos.
- Validar datos mediante schemas.
- Resolver dependencias de FastAPI.
- Obtener la identidad autenticada.
- Invocar services.
- Traducir resultados exitosos a respuestas HTTP.
- Declarar estados HTTP y contratos públicos.

Los routers no DEBEN contener:

- Reglas de negocio.
- Consultas de persistencia.
- Decisiones de autorización de dominio.
- Cálculos financieros.
- Formatos particulares de errores.
- Bloques repetidos de transformación de excepciones.
- Coordinación transaccional.

### VII. Responsabilidad de los services

Los services DEBEN implementar:

- Casos de uso.
- Reglas de negocio.
- Autorización contextual.
- Coordinación entre repositories.
- Coordinación mediante capacidades públicas de otros módulos.
- Límites transaccionales cuando correspondan.
- Aplicación de invariantes del dominio.

Los services no DEBEN:

- Ejecutar SQL.
- Utilizar directamente SQLModel para persistencia.
- Utilizar directamente SQLAlchemy.
- Recibir Session.
- Recibir AsyncSession.
- Recibir conexiones de base de datos.
- Depender de Request.
- Depender de Response.
- Depender de HTTPException.
- Construir respuestas HTTP.
- Determinar formatos públicos de error.

Los services DEBEN poder probarse sin depender directamente del transporte HTTP.

### VIII. Responsabilidad de los repositories

Los repositories DEBEN ser la única capa autorizada para:

- Consultar la base de datos.
- Crear datos persistidos.
- Modificar datos persistidos.
- Eliminar datos persistidos.
- Utilizar SQLModel.
- Utilizar SQLAlchemy cuando sea necesario.
- Ejecutar consultas.
- Ejecutar operaciones de persistencia.

Los repositories no DEBEN contener:

- Reglas de negocio.
- Decisiones de autorización.
- Comportamiento HTTP.
- Formatos públicos de respuesta.
- Mensajes destinados directamente a la interfaz.
- Decisiones propias sobre el flujo completo de un caso de uso.

Los repositories DEBEN exponer operaciones de persistencia coherentes con las
necesidades del módulo y no filtrar innecesariamente detalles de infraestructura
hacia los services.

### IX. SQLModel, SQLAlchemy y Alembic

SQLModel DEBE ser la abstracción principal para definir modelos y realizar
operaciones comunes de persistencia.

SQLAlchemy PUEDE utilizarse directamente dentro de repositories cuando SQLModel
no permita expresar una consulta u operación de manera clara, eficiente o
suficiente.

El uso directo de SQLAlchemy DEBE:

- Permanecer dentro de repositories.
- Estar justificado por una necesidad técnica.
- No trasladar reglas de negocio a la persistencia.
- No filtrar detalles de SQLAlchemy hacia routers o services.
- Respetar los límites transaccionales del caso de uso.

Alembic DEBE ser el único mecanismo oficial para crear y evolucionar el esquema
de la base de datos mediante migraciones versionadas y revisables.

No se DEBE utilizar create_all como mecanismo de despliegue o evolución de una
base de datos compartida.

Los cambios de modelos persistentes que afecten el esquema DEBEN acompañarse de
la migración correspondiente cuando la base de datos ya haya sido inicializada.

Los modelos persistentes DEBEN utilizar un `BaseModel` común definido en:

app/server/app/db/base.py

Salvo una justificación técnica explícita en su specification o plan, todo
modelo persistente nuevo DEBE heredar de ese `BaseModel`.

El `BaseModel` DEBE declarar como mínimo:

- `id`: UUID estable como identificador primario.
- `created_at`: fecha y hora de creación para auditoría.
- `updated_at`: fecha y hora de la última modificación para auditoría.
- `deleted_at`: fecha y hora opcional que representa eliminación lógica.

No se DEBE eliminar físicamente un registro de dominio. Toda eliminación DEBE
marcar `deleted_at` y preservar el registro para auditoría.

Los repositories DEBEN excluir por defecto los registros con `deleted_at` no
nulo de las consultas funcionales. Una consulta que incluya registros eliminados
solo PUEDE existir cuando su propósito de auditoría o restauración esté
documentado y sea explícito.

El registro canónico de modelos para Alembic DEBE residir en:

app/server/app/db/models.py

Ese archivo DEBE importar cada modelo SQLModel persistente definido por los
módulos del backend. Antes de generar o ejecutar una migración de Alembic, todo
modelo nuevo DEBE incorporarse a ese registro; la configuración de Alembic DEBE
importar dicho archivo para que el metadata completo esté disponible.

Los modelos de cada capacidad siguen siendo propiedad de
`app/server/app/modules/<nombre_del_modulo>/models/`; el registro central no
DEBE contener definiciones de modelos ni reglas de negocio.

### X. Transacciones atómicas

Toda operación que modifique múltiples registros relacionados DEBE ser atómica.

Los repositories no DEBEN realizar commits independientes que puedan dejar un
caso de uso parcialmente aplicado.

El commit y rollback DEBEN coordinarse mediante un límite transaccional por caso
de uso o mediante una abstracción Unit of Work.

Si cualquier parte del caso de uso falla, todos sus cambios relacionados DEBEN
revertirse.

Los límites transaccionales DEBEN representar casos de uso completos y no
operaciones aisladas elegidas arbitrariamente por cada repository.

### XI. Encapsulación entre módulos

Un módulo solo DEBE consumir otro módulo mediante sus interfaces públicas de
servicios.

Un módulo no DEBE acceder directamente a:

- Repositories de otro módulo.
- Modelos internos de otro módulo.
- Consultas privadas de otro módulo.
- Detalles de persistencia de otro módulo.
- Archivos privados de otro módulo.

Las dependencias circulares entre módulos están prohibidas.

Cuando dos módulos necesiten colaborar, la interacción DEBE realizarse mediante:

- Un servicio público.
- Un contrato explícito.
- Un evento interno debidamente justificado.

La API pública de cada módulo DEBE mantenerse reducida y representar capacidades
reales del negocio.

### XII. Schemas y convenciones del backend

Los schemas Pydantic DEBEN representar contratos explícitos de entrada y salida.

Los schemas públicos de entrada HTTP DEBEN terminar con el sufijo Request.

Ejemplos:

- EventCreateRequest
- EventUpdateRequest
- PaymentConfirmRequest
- ExpenseSplitRequest

Los schemas públicos de lectura DEBEN terminar con el sufijo Read.

Ejemplos:

- EventRead
- EventSummaryRead
- ExpenseRead
- PaymentRead
- MemberRead

No se DEBE utilizar Response como sufijo para schemas de lectura.

Los modelos de SQLModel o SQLAlchemy no DEBEN exponerse directamente como
contratos públicos de la API.

Todo campo público DEBE ser intencional.

Los datos internos, sensibles o de auditoría no DEBEN aparecer accidentalmente
en un contrato público de lectura.

Los schemas de entrada no DEBEN aceptar campos cuya identidad o valor tenga que
derivarse del usuario autenticado o del estado interno del dominio.

### XIII. Autenticación mediante Better Auth y JWT

Better Auth DEBE ser la fuente de verdad para:

- Autenticación.
- Sesiones.
- Identidad global de los usuarios.
- Inicio de sesión.
- Cierre de sesión.
- Recuperación y verificación de credenciales.

Better Auth DEBE utilizar su plugin JWT para emitir tokens de corta duración
destinados al backend FastAPI.

El frontend DEBE enviar ese JWT en las peticiones protegidas utilizando:

Authorization: Bearer <jwt>

FastAPI DEBE validar el JWT antes de aceptar una petición protegida.

La validación DEBE comprobar como mínimo:

- Firma criptográfica.
- Vigencia temporal.
- Emisor esperado.
- Audiencia esperada cuando esté configurada.
- Identificador estable del usuario.

La validación DEBE utilizar las claves públicas proporcionadas mediante el
mecanismo JWKS publicado por Better Auth.

El backend no DEBE:

- Administrar contraseñas.
- Implementar recuperación de contraseñas.
- Duplicar las sesiones de Better Auth.
- Confiar en un JWT sin verificarlo.
- Confiar únicamente en una decodificación sin validación criptográfica.
- Aceptar un identificador enviado en el body como identidad del actor.
- Aceptar decisiones de autorización proporcionadas por el frontend.

La identidad del actor DEBE obtenerse exclusivamente del JWT validado.

La specification y el plan que implementen la integración de autenticación DEBEN
definir explícitamente la correspondencia entre los claims validados del JWT y el
identificador interno del usuario.

### XIV. Autorización sin roles globales

Cuentas Claras no DEBE tener roles administrativos globales de aplicación en su
alcance inicial.

Todo usuario autenticado representa el mismo tipo global de actor:

User

El JWT DEBE identificar al usuario, pero no DEBE utilizarse como fuente de
permisos contextuales de eventos.

Las capacidades dentro de un evento DEBEN derivarse del estado actual almacenado
en el backend. Por ejemplo:

- El usuario es propietario del evento.
- El usuario pertenece al evento.
- El usuario creó un gasto.
- El usuario debe confirmar un pago.
- El usuario está involucrado en una deuda.
- El usuario está autorizado para modificar un recurso concreto.

La condición de propietario o miembro de un evento es una relación de dominio,
no un rol global de Better Auth.

Los permisos contextuales DEBEN resolverse en el backend en cada operación
protegida.

Los permisos contextuales no DEBEN confiarse al frontend ni persistirse como
autorización permanente dentro del JWT.

### XV. Manejo centralizado de excepciones

Todas las respuestas de error del backend DEBEN utilizar un contrato uniforme y
ser producidas mediante un sistema centralizado de manejo de excepciones.

Los services DEBEN lanzar excepciones de dominio y no construir respuestas HTTP.

Los routers no DEBEN:

- Crear formatos de error propios.
- Repetir traducciones de excepciones.
- Capturar excepciones únicamente para cambiar su formato.
- Exponer detalles internos de infraestructura.
- Construir manualmente respuestas de error ya contempladas por el sistema
  centralizado.

Los handlers globales DEBEN traducir excepciones de:

- Dominio.
- Autenticación.
- Autorización.
- Validación.
- Infraestructura.

Estas excepciones DEBEN convertirse en respuestas HTTP consistentes.

Toda respuesta pública de error DEBE contener como mínimo:

- Un código estable y legible por máquinas.
- Un mensaje seguro y comprensible.
- Detalles opcionales cuando correspondan.

La implementación PUEDE incorporar un identificador de petición o correlación.

Los errores nunca DEBEN exponer:

- Trazas.
- SQL.
- Credenciales.
- Secretos.
- Tokens.
- Detalles internos sensibles.

Cada módulo PUEDE definir excepciones y códigos propios, pero DEBE utilizar el
contrato y los handlers centralizados.

### XVI. Integridad financiera

Los montos monetarios nunca DEBEN almacenarse ni calcularse utilizando float
binario.

Se DEBEN utilizar unidades monetarias menores enteras o Decimal con precisión
controlada.

Toda división monetaria DEBE conservar exactamente el total original.

Los residuos de redondeo DEBEN asignarse mediante una regla determinista,
reproducible y verificable.

Las reglas de división no DEBEN permitir que la suma de las partes sea diferente
del monto original.

La creación o modificación de los siguientes elementos DEBE realizarse dentro de
operaciones transaccionales consistentes:

- Gastos.
- Participaciones.
- Cuotas.
- Pagos.
- Deudas.
- Balances.
- Confirmaciones.
- Registros de auditoría relacionados.

Las reglas financieras críticas DEBEN expresarse como invariantes verificables
mediante pruebas.

### XVII. Pruebas del backend

Como mínimo:

- Los services DEBEN tener pruebas unitarias.
- Los repositories DEBEN tener pruebas de integración.
- Los contratos de API DEBEN tener pruebas de endpoints.
- La autenticación DEBE probar JWT válidos.
- La autenticación DEBE probar JWT expirados.
- La autenticación DEBE probar JWT manipulados.
- La autenticación DEBE probar JWT inválidos.
- La autorización DEBE probar accesos permitidos y denegados.
- Las reglas financieras DEBEN probar sus invariantes.
- Las operaciones transaccionales DEBEN probar rollback ante fallos.
- Los errores públicos DEBEN probar el contrato centralizado correspondiente.

Las pruebas de services no DEBEN requerir una petición HTTP real para verificar
reglas de negocio.

Las pruebas de repositories DEBEN utilizar una base de datos o entorno de
persistencia representativo de las operaciones verificadas.

## Principios del frontend

### XVIII. Arquitectura del frontend orientada a funcionalidades

El frontend DEBE residir exclusivamente dentro de:

app/client/

El frontend DEBE construirse con:

- Next.js.
- TypeScript.
- App Router.

Cada segmento funcional principal bajo:

app/client/src/app/

DEBE actuar como frontera de una funcionalidad.

La estructura base PUEDE seguir este modelo:

```text
app/client/src/app/events/
├── page.tsx
├── [event-id]/
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── _components/
├── _components/
├── _services/
├── _schemas/
└── _types/
```

Los elementos compartidos por todo el frontend DEBEN ubicarse fuera de una
funcionalidad concreta.

Las ubicaciones compartidas DEBEN contemplar cuando correspondan:

- app/client/src/components/ui/
- app/client/src/components/shared/
- app/client/src/lib/api/
- app/client/src/lib/auth/
- app/client/src/lib/utils/
- app/client/src/styles/

Las carpetas privadas con prefijo "_" DEBEN utilizarse cuando su contenido no
represente rutas públicas.

Los componentes exclusivos de una ruta DEBEN permanecer colocados junto a esa
ruta.

Los componentes compartidos entre varias rutas de una funcionalidad DEBEN
ubicarse en la raíz de dicha funcionalidad.

Los services, schemas y tipos compartidos por las rutas de una funcionalidad
DEBEN pertenecer a la raíz de esa funcionalidad, salvo que exista una necesidad
concreta de colocarlos en una ruta más específica.

No se DEBEN mover elementos a carpetas globales sin que exista reutilización real
entre funcionalidades diferentes.

Un archivo page.tsx representa el punto de entrada de una ruta. La frontera
funcional se define principalmente por el segmento padre y no necesariamente por
cada page.tsx individual.

### XIX. Dirección de dependencias del frontend

La dirección general de dependencias DEBE ser:

Page -> Components -> Services -> API Client -> Backend

Las pages y los componentes no DEBEN realizar llamadas directas al backend
FastAPI.

Toda comunicación con FastAPI DEBE pasar por:

- Los services de la funcionalidad correspondiente.
- El cliente HTTP centralizado.

Los services DEBEN encapsular:

- URL.
- Método HTTP.
- Headers.
- Autenticación.
- Serialización.
- Validación de respuestas.
- Normalización de errores.

Los componentes no DEBEN conocer detalles como:

- URL base del backend.
- Construcción manual del header Authorization.
- Contrato interno de errores HTTP.
- Obtención o renovación del JWT.
- Serialización específica del transporte.

Una funcionalidad no DEBE importar archivos privados internos de otra
funcionalidad.

La colaboración entre funcionalidades DEBE realizarse mediante contratos,
services o componentes públicos explícitos.

### XX. Server Components y Client Components

Los Server Components DEBEN ser la opción predeterminada.

La directiva "use client" solo DEBE añadirse cuando exista una necesidad real de:

- Estado interactivo.
- Eventos del navegador.
- Hooks de cliente.
- APIs exclusivas del navegador.
- Librerías que requieran ejecución en el cliente.

Los límites de Client Components DEBEN mantenerse tan pequeños como sea
razonablemente posible.

No se DEBE convertir una página o árbol completo en Client Component únicamente
porque uno de sus elementos internos sea interactivo.

Cuando sea posible, la interacción DEBE aislarse en un componente cliente
específico y el resto de la composición DEBE permanecer como Server Component.

### XXI. Services y contratos de respuesta

Los services DEBEN utilizar nombres en camelCase comenzando por un verbo que
describa la operación.

Ejemplos:

- listEvents
- getEventById
- createEvent
- updateEvent
- deleteEvent
- joinEvent
- registerExpense
- confirmPayment

Las operaciones de lectura DEBEN devolver datos tipados y validados.

Las mutaciones que no necesiten información de respuesta DEBEN completarse sin
exponer ni utilizar mensajes decorativos del backend.

Cuando el flujo necesite información mínima, como el identificador de un recurso
creado, la mutación PUEDE devolver un contrato mínimo y tipado.

El frontend no DEBE depender del texto de éxito enviado por el backend.

Los mensajes de éxito visibles para el usuario DEBEN definirse en el frontend.

Las mutaciones DEBEN decidir su siguiente acción mediante:

- Estado HTTP.
- Resultado tipado cuando sea necesario.
- Error tipado cuando la operación falle.

El cliente HTTP centralizado DEBE convertir respuestas fallidas en errores
tipados que conserven, cuando corresponda:

- Estado HTTP.
- Código estable del backend.
- Mensaje público.
- Detalles permitidos.

Los errores de conectividad o indisponibilidad del backend DEBEN normalizarse y
no DEBEN exponerse como errores sin estructura a cada componente.

Un error 404 del recurso principal de una ruta DEBE utilizar notFound() o el
mecanismo equivalente de Next.js.

Un error 404 perteneciente a una operación secundaria no DEBE convertir
automáticamente toda la página en una página no encontrada.

### XXII. Schemas y tipos del frontend

Zod DEBE utilizarse para validar información externa en los límites del sistema,
incluyendo:

- Respuestas relevantes del backend.
- Datos de formularios.
- Parámetros externos cuando su validación sea necesaria.
- Información almacenada cuya procedencia no sea confiable.

Los schemas DEBEN nombrarse en camelCase y terminar con Schema.

Ejemplos:

- eventReadSchema
- eventCreateSchema
- expenseReadSchema
- paymentConfirmSchema

Cuando un tipo represente directamente un schema de Zod, DEBE inferirse mediante
z.infer en lugar de duplicarse manualmente.

La carpeta _types DEBE reservarse para tipos propios de:

- Presentación.
- Estado.
- Composición.
- Propiedades de componentes.
- Información que no derive directamente de un schema.

No se DEBE confiar ciegamente en una conversión o aserción de tipos de TypeScript
para datos recibidos desde la API.

Una aserción de tipos no DEBE sustituir la validación de datos externos.

### XXIII. Autenticación del frontend y manejo del JWT

Better Auth DEBE administrar la sesión web del usuario mediante sus mecanismos
seguros de sesión.

La sesión de Better Auth y el JWT destinado a FastAPI DEBEN tratarse como
artefactos diferentes.

La sesión web PUEDE mantenerse mediante las cookies seguras gestionadas
directamente por Better Auth.

El JWT emitido por el plugin JWT DEBE utilizarse exclusivamente para autenticar
peticiones al backend FastAPI.

El JWT destinado a FastAPI:

- NO DEBE persistirse en localStorage.
- NO DEBE persistirse en sessionStorage.
- NO DEBE persistirse en IndexedDB.
- NO DEBE guardarse manualmente en una cookie accesible desde JavaScript.
- DEBE mantenerse únicamente durante el tiempo mínimo necesario.
- DEBE obtenerse nuevamente mediante Better Auth cuando sea necesario.
- DEBE añadirse centralmente como Authorization: Bearer <jwt>.

La obtención y envío del JWT DEBE estar encapsulada en:

- La infraestructura de autenticación.
- El cliente HTTP centralizado.

Las pages, componentes y services concretos no DEBEN repetir esta lógica.

Las cookies de sesión creadas y gestionadas directamente por Better Auth DEBEN
configurarse con las protecciones apropiadas para el entorno, incluyendo cuando
corresponda:

- HttpOnly.
- Secure.
- SameSite.

El frontend no DEBE utilizar claims simplemente decodificados del JWT como fuente
confiable de autorización.

Las capacidades contextuales, como propietario o miembro de un evento, DEBEN
proceder del estado y de las respuestas validadas del backend.

El plugin Bearer de Better Auth no DEBE confundirse con el plugin JWT.

La incorporación del plugin Bearer solo PUEDE realizarse si una specification
futura identifica una necesidad adicional concreta y justifica su utilización.

### XXIV. shadcn/ui, Tailwind CSS y sistema de diseño

Tailwind CSS DEBE ser el mecanismo principal de estilos del frontend.

shadcn/ui DEBE priorizarse para componentes base cuando exista un componente que
resuelva adecuadamente la necesidad.

Los componentes instalados de shadcn/ui DEBEN ubicarse en:

app/client/src/components/ui/

Los componentes compartidos creados por el proyecto DEBEN ubicarse en:

app/client/src/components/shared/

Los componentes de shadcn/ui DEBEN componerse desde los componentes funcionales
y no modificarse indiscriminadamente para resolver necesidades locales.

Solo se DEBEN instalar los componentes de shadcn/ui que realmente se utilicen.

Antes de crear un componente base desde cero, se DEBE comprobar si shadcn/ui
ofrece una alternativa adecuada.

Todos los iconos del frontend DEBEN implementarse utilizando la librería
lucide-react. No se DEBEN utilizar otras librerías de iconos ni crear iconos
personalizados para funcionalidades que Lucide React ya cubra.

Los colores, espaciados, radios, tipografía, superficies y estados DEBEN
expresarse mediante tokens semánticos centralizados cuando pertenezcan al sistema
visual.

Se DEBEN priorizar nombres semánticos como:

- background
- foreground
- primary
- secondary
- muted
- accent
- destructive
- border
- input
- ring

No se DEBEN repetir colores hexadecimales ni valores arbitrarios cuando exista un
token semántico equivalente.

Los valores específicos de una única composición visual PUEDEN expresarse
mediante Tailwind cuando no representen una decisión reutilizable del sistema de
diseño.

### XXV. Stitch como referencia visual

Los documentos HTML o diseños generados con Stitch DEBEN tratarse como referencia
visual y funcional, no como código de producción definitivo.

Al implementar un diseño de Stitch se DEBE:

- Convertirlo a componentes React.
- Utilizar Next.js correctamente.
- Utilizar Tailwind CSS.
- Priorizar shadcn/ui.
- Reutilizar los tokens del sistema de diseño.
- Preservar la jerarquía visual.
- Preservar la intención del diseño.
- Verificar estados interactivos.
- Verificar accesibilidad.
- Verificar comportamiento responsive.
- Integrarlo con la arquitectura funcional establecida.

No se DEBE copiar HTML, estilos duplicados o scripts de Stitch sin adaptación a
la arquitectura del proyecto.

La fidelidad visual no DEBE justificar la introducción de código duplicado,
componentes inaccesibles o estilos incompatibles con el sistema de diseño.

### XXVI. Diseño mobile-first y comportamiento responsive

Toda interfaz DEBE diseñarse y verificarse primero para dispositivos móviles.

La versión de escritorio DEBE ampliar y redistribuir el mismo flujo sin crear una
experiencia funcional diferente.

El header y el contenido principal DEBEN compartir el mismo contenedor,
alineación horizontal y ancho máximo en escritorio.

Las interfaces DEBEN evitar:

- Desbordamientos horizontales.
- Contenido cortado.
- Objetivos táctiles demasiado pequeños.
- Separaciones insuficientes.
- Texto ilegible.
- Acciones disponibles únicamente por hover.

Una funcionalidad no DEBE existir exclusivamente en desktop si también es
necesaria en móvil, ni viceversa.

Las acciones principales DEBEN mantenerse identificables y accesibles en ambos
tamaños.

Los cambios de distribución responsive no DEBEN alterar las reglas del negocio ni
el significado de las acciones.

### XXVII. Estados de interfaz y Sonner

Toda vista que dependa de información remota DEBE contemplar explícitamente los
estados aplicables:

- Loading.
- Empty.
- Success.
- Error.
- Unauthorized.
- Not found.

Los archivos loading.tsx, error.tsx y not-found.tsx DEBEN incorporarse cuando el
alcance y comportamiento de la ruta lo justifiquen.

Sonner, mediante su integración con shadcn/ui, DEBE ser el mecanismo estándar
para mostrar notificaciones breves de éxito y error.

Los formularios no DEBEN mostrar mensajes de error debajo de los campos ni
paneles particulares de error dentro del formulario.

Los errores de validación, errores de operaciones y errores recuperables DEBEN
comunicarse mediante toasts de Sonner claros y concretos.

Cuando existan varios errores de validación, el toast DEBE resumirlos de forma
comprensible y evitar generar una notificación independiente por cada campo.

Al producirse un error, la interfaz DEBE conservar los datos introducidos por el
usuario siempre que sea seguro hacerlo.

Los errores fatales de renderizado y los recursos principales inexistentes DEBEN
seguir utilizando los límites error.tsx y not-found.tsx de Next.js.

Estos estados de ruta no se sustituyen únicamente por un toast.

Los mensajes de éxito DEBEN describir el resultado de la acción y no copiar
mensajes decorativos enviados por el backend.

Las notificaciones DEBEN ser accesibles.

Las notificaciones no DEBEN ser la única representación de un estado permanente
que el usuario necesite consultar posteriormente.

Una operación exitosa DEBE actualizar o invalidar el estado visible
correspondiente para que la interfaz refleje el resultado real.

### XXVIII. Documentación y comentarios en español

Toda page y todo componente React creado por el proyecto DEBE incluir
documentación breve en español que explique:

- Su propósito.
- Su responsabilidad principal.
- Sus entradas relevantes cuando no sean evidentes.
- Las decisiones importantes que afecten su comportamiento.

Los services, hooks y funciones con comportamiento relevante DEBEN documentar en
español:

- Su propósito.
- Sus datos de entrada.
- Su resultado.
- Sus condiciones de error cuando no sean evidentes por la firma.

Las zonas clave o complejas del código DEBEN contener comentarios en español que
expliquen la intención o la razón de la implementación.

Los comentarios DEBEN explicar el porqué del código y no repetir literalmente lo
que ya expresa una instrucción, nombre o componente.

No se DEBEN agregar comentarios línea por línea.

No se DEBEN agregar comentarios triviales que aumenten el ruido del archivo.

La documentación DEBE colocarse en una ubicación compatible con las directivas
obligatorias del framework.

Por ejemplo, la directiva "use client" DEBE conservar la posición exigida por
Next.js.

Los identificadores de código PUEDEN mantenerse en inglés siguiendo las
convenciones técnicas del proyecto, aunque la documentación y los comentarios
se escriban en español.

Los comentarios heredados de librerías o código generado no DEBEN traducirse
automáticamente si hacerlo dificulta actualizaciones o mantenimiento.

### XXIX. Convenciones de nombres del frontend

Los archivos y carpetas creados por el proyecto DEBEN utilizar kebab-case.

Los componentes React y tipos DEBEN utilizar PascalCase.

Las funciones, variables, services y hooks DEBEN utilizar camelCase.

Los hooks DEBEN comenzar con use.

Las constantes globales DEBEN utilizar UPPER_SNAKE_CASE.

Los schemas de Zod DEBEN terminar con Schema.

Los nombres de services DEBEN comenzar con un verbo descriptivo.

Los nombres DEBEN describir responsabilidades del dominio.

Se DEBEN evitar términos genéricos como utils, helpers o manager cuando exista un
nombre más específico.

Las rutas dinámicas DEBEN utilizar nombres descriptivos y consistentes, por
ejemplo:

[event-id]

### XXX. Pruebas y accesibilidad del frontend

Como mínimo:

- Los services DEBEN tener pruebas de sus contratos y manejo de errores.
- Los schemas de Zod DEBEN probar datos válidos e inválidos relevantes.
- Los componentes interactivos DEBEN probar su comportamiento observable.
- Los flujos críticos DEBEN tener pruebas de integración o end-to-end.
- Toda corrección reproducible DEBE incluir una prueba de regresión.
- Los estados loading, empty y error críticos DEBEN poder verificarse.
- Los flujos protegidos DEBEN probar usuarios autenticados y no autenticados.
- Las operaciones que dependan de permisos contextuales DEBEN probar estados
  permitidos y denegados.

Los controles interactivos DEBEN ser utilizables con teclado.

Los elementos visuales DEBEN conservar:

- Contraste suficiente.
- Foco visible.
- Etiquetas accesibles.
- Objetivos táctiles apropiados.
- Orden de navegación comprensible.

La semántica HTML DEBE priorizarse antes de agregar roles ARIA manuales.

Los botones compuestos únicamente por iconos DEBEN proporcionar un nombre
accesible.

Los estados comunicados únicamente mediante color DEBEN incorporar una señal
adicional comprensible.

## Governance

La constitución DEBE ser la fuente principal de reglas arquitectónicas, técnicas
y de calidad para todas las specifications, plans, tasks y revisiones.

Toda specification, plan y conjunto de tasks DEBE declarar explícitamente su
ámbito de implementación utilizando uno de los siguientes valores:

- Frontend: app/client/
- Backend: app/server/
- Transversal: app/client/ y app/server/

Una specification o plan exclusivo del backend DEBE comprobar:

- Los principios compartidos.
- Los principios del backend.

Una specification o plan exclusivo del frontend DEBE comprobar:

- Los principios compartidos.
- Los principios del frontend.

Una specification o plan transversal DEBE comprobar:

- Los principios compartidos.
- Los principios del backend.
- Los principios del frontend.

Las tareas generadas no DEBEN crear ni modificar archivos fuera del ámbito
declarado, salvo que el plan documente y justifique un cambio compartido del
monorepo.

Cuando una regla constitucional entre en conflicto con una specification, plan o
implementación, prevalece la constitución hasta que sea formalmente enmendada.

Las modificaciones a la constitución DEBEN:

- Documentar la razón del cambio.
- Identificar principios añadidos, modificados o eliminados.
- Evaluar el impacto sobre código y especificaciones existentes.
- Incluir un Sync Impact Report.
- Utilizar versionado semántico.

Los cambios incompatibles, la eliminación de principios o la redefinición de
principios requieren incremento MAJOR.

Los nuevos principios o ampliaciones materiales requieren incremento MINOR.

Las aclaraciones sin cambio semántico requieren incremento PATCH.

Toda revisión de código DEBE comprobar las reglas constitucionales aplicables al
alcance del cambio.

Toda complejidad que contradiga la estructura estándar DEBE justificarse en la
specification o plan antes de implementarse.

La constitución solo PUEDE modificarse mediante una enmienda explícita y
versionada.

**Version**: 1.2.0 | **Ratified**: 2026-08-29 | **Last Amended**: 2026-08-29

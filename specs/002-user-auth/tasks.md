---
description: "Tareas de implementación de autenticación de usuarios"
---

# Tareas: Autenticación de usuarios

**Input**: Documentos de diseño de `/specs/002-user-auth/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-flows.md y quickstart.md

**Scope**: Todas las tareas de código modifican exclusivamente `app/client`. No se modifica `app/server`, `docs` ni se ejecutan migraciones de Neon/Better Auth.

**Tests**: Se incluyen pruebas porque la specification define criterios independientes y flujos de seguridad observables.

## Dependencias y orden

- **Setup (Fase 1)** no tiene dependencias.
- **Fundacional (Fase 2)** depende de Setup y bloquea las historias.
- **US1 (Fase 3)** depende de la base de Better Auth, Brevo y proxy.
- **US2 (Fase 4)** depende de US1 para reutilizar el estado de usuario/verificación y Home.
- **US3 (Fase 5)** depende de la base de Better Auth/Brevo, pero puede desarrollarse en paralelo con US2 después de la Fase 2.
- **US4 (Fase 6)** consolida errores y estados compartidos después de US1–US3.
- **Polish (Fase 7)** depende de todas las historias que se quieran entregar.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar dependencias y configuración local del cliente.

- [X] T001 Añadir `better-auth`, `pg` y `@getbrevo/brevo` a `app/client/package.json` y actualizar `app/client/pnpm-lock.yaml` usando pnpm.
- [X] T002 [P] Crear `app/client/.env.example` con `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_JWT_AUDIENCE` opcional, `AUTH_JWT_EXPIRATION`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y `BREVO_SENDER_NAME`, sin secretos reales.
- [X] T003 [P] Confirmar en `app/client/.gitignore` que `.env.local` y demás archivos `.env*` no se versionen, manteniendo la plantilla `.env.example` como única referencia compartible.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configuración compartida que todas las historias necesitan.

**⚠️ CRITICAL**: Ninguna historia debe comenzar antes de completar esta fase.

- [X] T004 Crear la instancia server-only de Better Auth en `app/client/src/lib/auth.ts` con pool PostgreSQL, `emailAndPassword`, `socialProviders.google`, expiraciones de enlaces, `autoSignIn: false`, `requireEmailVerification: true` y sin tablas o migraciones personalizadas.
- [X] T005 Configurar en `app/client/src/lib/auth.ts` el hook de validación de nombre/contraseña para `/sign-up/email` y `/reset-password`, sin almacenar ni exponer contraseñas en texto plano.
- [X] T006 Configurar el plugin JWT en `app/client/src/lib/auth.ts` y `jwtClient()` en `app/client/src/lib/auth-client.ts`, con `sub` predeterminado como `user.id`, TTL de `AUTH_JWT_EXPIRATION` y audiencia omitida cuando `AUTH_JWT_AUDIENCE` sea vacía o nula.
- [X] T007 Montar `toNextJsHandler(auth)` en `app/client/src/app/api/auth/[...all]/route.ts`, dejando disponibles los endpoints de sesión, Google, correo, token y JWKS sin añadir rutas de autenticación propias.
- [X] T008 Crear el cliente server-only de Brevo en `app/client/src/lib/email/brevo-client.ts` usando `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y `BREVO_SENDER_NAME`, con errores internos sin filtrar al navegador.
- [X] T009 [P] Crear las plantillas HTML/texto y el adaptador de callbacks de Better Auth en `app/client/src/lib/email/templates.ts` y `app/client/src/lib/email/auth-email.ts` para verificación y recuperación; incluir la URL segura únicamente en el correo transaccional destinado al usuario y nunca exponerla en logs, toasts, errores o correos ajenos al flujo; nunca registrar token, contraseña o API key.
- [X] T010 Crear el mapeo de errores seguros y la utilidad de toasts en `app/client/src/lib/auth-errors.ts` y conectar el `Toaster` de Sonner en `app/client/src/app/layout.tsx`; todos los errores deben comunicarse mediante `toast.error` con texto accesible.
- [X] T011 Crear `app/client/src/proxy.ts` con las rutas invitadas `/auth/**`, exclusión de `/api/auth/**` y redirecciones entre sesión presente/ausente; no usarlo como sustituto de la comprobación server-side de Home.
- [X] T012 [P] Definir esquemas Zod y componentes compartidos de formularios en `app/client/src/app/auth/components/` para email, contraseña, estado de carga, `aria-invalid` y mensajes accionables por toast.

**Checkpoint**: Better Auth, Brevo, JWT opcional, Sonner y la política de rutas están disponibles para historias independientes.

---

## Phase 3: User Story 1 - Crear y verificar una cuenta (Priority: P1) 🎯 MVP

**Goal**: Permitir registro por email con verificación de un solo uso y registro con Google que llega directamente a Home.

**Independent Test**: Una persona puede registrarse por email, llegar a revisar correo, verificar un enlace vigente una sola vez y alcanzar Home; Google llega a Home sin verificación adicional.

### Tests for User Story 1

- [X] T013 [P] [US1] Añadir pruebas de requisitos de registro y mensajes seguros en `app/client/src/app/auth/__tests__/register.test.tsx`, incluyendo nombre/email/contraseña inválidos y email ya registrado.
- [X] T014 [P] [US1] Añadir pruebas del estado de verificación y enlaces inválidos/expirados/reutilizados en `app/client/src/app/auth/__tests__/verify-email.test.tsx`.

### Implementation for User Story 1

- [X] T015 [P] [US1] Crear la página de registro por email en `app/client/src/app/auth/register/page.tsx` con nombre, email, contraseña, reglas visibles y envío a Better Auth.
- [X] T016 [P] [US1] Crear los componentes de registro y revisión de correo en `app/client/src/app/auth/components/register-form.tsx` y `app/client/src/app/auth/components/check-email-card.tsx`, usando tokens existentes y Sonner.
- [X] T017 [US1] Crear `app/client/src/app/auth/verify-email/page.tsx` para procesar el enlace de Better Auth, mostrar estados de pendiente/éxito/error y dirigir éxito a `/`.
- [X] T018 [US1] Conectar callbacks de verificación a Brevo en `app/client/src/lib/email/auth-email.ts` y asegurar que el enlace dure una hora y sea de un solo uso.
- [X] T019 [US1] Crear el botón y flujo de Google en `app/client/src/app/auth/components/google-sign-in-button.tsx`, con `callbackURL: "/"` y sin vinculación implícita por coincidencia de correo.
- [X] T020 [US1] Componer la Home protegida inicial en `app/client/src/app/page.tsx` y el encabezado de sesión en `app/client/src/components/layout/home-header.tsx`, mostrando imagen o icono Lucide, nombre, email y salida.

**Checkpoint**: US1 puede demostrarse sin US3 y cumple el MVP.

---

## Phase 4: User Story 2 - Iniciar y cerrar sesión (Priority: P1)

**Goal**: Permitir acceso por email verificado o Google y cierre de sesión con redirección a Login.

**Independent Test**: Una cuenta verificada puede iniciar sesión, una cuenta no verificada recibe toast y reenvío a revisión de correo, y una sesión activa puede cerrarse y perder acceso a Home.

### Tests for User Story 2

- [X] T021 [P] [US2] Añadir pruebas de login por email/Google, credenciales incorrectas y correo no verificado en `app/client/src/app/auth/__tests__/login.test.tsx`.
- [X] T022 [P] [US2] Añadir pruebas de cierre de sesión, redirecciones del proxy y protección de Home en `app/client/src/app/__tests__/session-routing.test.tsx`.

### Implementation for User Story 2

- [X] T023 [P] [US2] Crear la página de login en `app/client/src/app/auth/login/page.tsx` con email, contraseña, Google y enlaces a registro/recuperación.
- [X] T024 [US2] Implementar `app/client/src/app/auth/components/login-form.tsx` para iniciar sesión con Better Auth y redirigir éxito a `/`.
- [X] T025 [US2] Implementar en `app/client/src/app/auth/components/login-form.tsx` el caso de email no verificado: mostrar toast, depender de `sendOnSignIn` para reenviar Brevo y dirigir a `/auth/verify-email`.
- [X] T026 [US2] Implementar salida en `app/client/src/components/layout/home-header.tsx` con `signOut`, toast de error seguro y redirección a `/auth/login` solo tras revocar la sesión.
- [X] T027 [US2] Completar en `app/client/src/app/page.tsx` la comprobación server-side de sesión para que una petición directa sin sesión no reciba contenido protegido.

**Checkpoint**: US1 y US2 funcionan independientemente después de la base compartida.

---

## Phase 5: User Story 3 - Recuperar una contraseña (Priority: P1)

**Goal**: Solicitar recuperación sin enumerar cuentas y establecer una contraseña nueva con un enlace único.

**Independent Test**: Correos registrados y no registrados reciben la misma confirmación; un enlace vigente permite cambiar la contraseña una vez y dirige a Login sin sesión automática.

### Tests for User Story 3

- [X] T028 [P] [US3] Añadir pruebas de respuesta pública idéntica, fallos de Brevo y no enumeración en `app/client/src/app/auth/__tests__/forgot-password.test.tsx`.
- [X] T029 [P] [US3] Añadir pruebas de token vigente, expirado, inválido y reutilizado en `app/client/src/app/auth/__tests__/reset-password.test.tsx`.

### Implementation for User Story 3

- [X] T030 [P] [US3] Crear la página de solicitud en `app/client/src/app/auth/forgot-password/page.tsx` con confirmación pública constante y errores por Sonner.
- [X] T031 [P] [US3] Crear la página de nueva contraseña en `app/client/src/app/auth/reset-password/page.tsx` con token de query, reglas de contraseña visibles y estado de enlace inválido/expirado.
- [X] T032 [US3] Conectar `sendResetPassword` de Better Auth con la plantilla Brevo `reset-password` en `app/client/src/lib/email/auth-email.ts`, usando expiración de una hora.
- [X] T033 [US3] Dirigir recuperación exitosa a `/auth/login?passwordReset=1`, mostrar confirmación accesible y asegurar que no se crea una sesión automática.

**Checkpoint**: US3 conserva la privacidad de recuperación y no modifica el alcance de US1/US2.

---

## Phase 6: User Story 4 - Recibir orientación ante errores (Priority: P2)

**Goal**: Unificar orientación segura y accesible ante errores de todos los flujos de acceso.

**Independent Test**: Cada error especificado produce un toast comprensible, accionable y sin secretos, manteniendo valores no sensibles cuando sea seguro.

### Tests for User Story 4

- [X] T034 [P] [US4] Añadir pruebas de catálogo y traducción segura de errores en `app/client/src/lib/auth-errors.test.ts` para credenciales, email existente, contraseña inválida, enlace inválido/expirado y correo no verificado.
- [X] T035 [P] [US4] Añadir pruebas de accesibilidad y ausencia de secretos en toasts/estados/logs en `app/client/src/app/auth/__tests__/error-accessibility.test.tsx`, verificando que los enlaces seguros solo aparezcan en el correo transaccional destinado al usuario.

### Implementation for User Story 4

- [X] T036 [US4] Completar `app/client/src/lib/auth-errors.ts` con mensajes seguros y siguientes pasos para Better Auth, Brevo, Google y redirección por verificación pendiente.
- [X] T037 [US4] Aplicar el canal único Sonner a todos los formularios y estados de `app/client/src/app/auth/components/`, evitando contraseñas, tokens, enlaces seguros e identificadores en toasts y errores; los enlaces solo se entregan mediante el correo transaccional destinado al usuario.
- [X] T038 [US4] Revisar las páginas de `app/client/src/app/auth/` para que foco, `aria-invalid`, carga y errores sean accesibles sin depender solo del color.

**Checkpoint**: Todos los errores de autenticación tienen una presentación uniforme, segura y accesible.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validación final y endurecimiento transversal del cliente.

- [X] T039 [P] Revisar `app/client/src/lib/auth.ts` y `app/client/src/lib/email/` para impedir importaciones client-side de secretos o SDK de Brevo.
- [X] T040 [P] Revisar `app/client/src/proxy.ts`, `app/client/src/app/page.tsx` y las páginas de auth para mantener rutas protegidas, exclusiones de assets y no persistencia de JWT.
- [X] T041 [P] Auditar `app/client/src/app/auth/` y `app/client/src/components/layout/home-header.tsx` para uso exclusivo de Lucide y tokens del design system.
- [X] T042 Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test` desde `app/client`, resolviendo errores sin modificar `app/server` ni `docs`.
- [ ] T043 Ejecutar los escenarios de `specs/002-user-auth/quickstart.md` con Neon/Brevo configurados, dejando generación y ejecución de migraciones fuera de esta tarea.

---

## Oportunidades de paralelización

- T002, T003 y T012 pueden realizarse en paralelo tras la preparación del repositorio.
- T008 y T009 pueden realizarse en paralelo con T011, una vez creado `auth.ts`.
- T013–T014 son paralelas; T015–T019 pueden repartirse por archivos después de T004–T012.
- T021–T022 son paralelas; T023–T026 pueden repartirse después de la base.
- T028–T029 son paralelas; T030–T033 pueden repartirse después de la base.
- T034–T035 son paralelas; T039–T041 son auditorías paralelas al cierre de historias.

## Estrategia de implementación

### MVP (US1)

1. Completar Fase 1 y Fase 2.
2. Completar US1: registro por email, Brevo, verificación, Google y Home.
3. Ejecutar las pruebas de US1 y detenerse para validar el flujo completo.

### Entrega incremental

1. Añadir US2 para login, reenvío por correo no verificado y logout.
2. Añadir US3 para recuperación segura.
3. Añadir US4 para catálogo uniforme de errores y accesibilidad.
4. Ejecutar Polish con variables reales de Neon/Brevo, sin ejecutar migraciones desde estas tareas.

## Notas

- `[P]` identifica tareas que pueden trabajar archivos distintos sin depender de trabajo incompleto.
- `[USn]` vincula cada tarea de historia con la historia correspondiente de `spec.md`.
- Todas las tareas incluyen una ruta concreta y comienzan sin marcar (`- [ ]`).
- El backend y las migraciones son explícitamente fuera del alcance; el contrato JWT queda disponible para una feature futura.

---

## Phase 8: Convergence

- [X] T044 CRITICAL Mover el envío de recuperación y verificación de Better Auth a una ejecución en segundo plano que no revele la existencia de una cuenta por tiempo o error, y añadir pruebas de respuesta pública idéntica para correos existentes e inexistentes per FR-008, SC-003 y FR-012 (partial).
- [X] T045 Configurar y probar una limitación de abuso para solicitudes repetidas de recuperación y reenvío de verificación, conservando mensajes públicos seguros per Edge Cases: recuperación repetida (missing).
- [X] T046 Ajustar y probar la semántica de `AUTH_JWT_AUDIENCE` vacía o nula con el plugin JWT, evitando exigir o introducir una audiencia no acordada y preservando `sub = user.id` per plan: Correspondencia futura de identidad y FR-014 (contradicts).
- [X] T047 Añadir pruebas de interacción accesibles de registro, inicio de sesión, verificación, recuperación y cierre de sesión que cubran teclado, `aria-invalid`, preservación de valores no sensibles y redirecciones per SC-004 y Constitución III (partial).
- [X] T048 Añadir pruebas server-side del adaptador Brevo que demuestren que la URL solo aparece en el correo transaccional dirigido a la persona y nunca en errores, toasts ni logs per FR-012 y SC-005 (partial).

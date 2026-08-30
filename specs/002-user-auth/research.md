# Investigación técnica: autenticación de usuarios

## Decisiones

### 1. Integración de Better Auth en Next.js

**Decisión**: instalar `better-auth` y montar `toNextJsHandler(auth)` en
`app/client/src/app/api/auth/[...all]/route.ts`; crear una instancia React en
`src/lib/auth-client.ts` y una instancia de servidor en `src/lib/auth.ts`.

**Motivo**: la integración oficial para App Router utiliza el catch-all de
`/api/auth/[...all]`. Mantiene las rutas internas de Better Auth —incluidas las
de correo, sesión, Google, token y JWKS— en el mismo origen del cliente.

**Alternativas descartadas**:

- Implementar endpoints de autenticación propios: duplicaría contraseñas,
  sesiones y enlaces que la constitución asigna a Better Auth.
- Montarlo en FastAPI: contradice la decisión del alcance de inicializar Better
  Auth dentro del cliente Next.js y añade un segundo límite de sesión.

**Referencias**: [integración Next.js](https://better-auth.com/docs/1.6/integrations/next), [cliente](https://better-auth.com/docs/concepts/client).

### 2. PostgreSQL de Neon y migraciones

**Decisión**: usar el pool `pg` de Node conectado mediante `DATABASE_URL`. La
configuración de Better Auth y el plugin JWT determinan el esquema estándar; la
persona responsable ejecutará después la generación/migración contra Neon.

**Motivo**: el adaptador PostgreSQL oficial acepta directamente un `Pool` de
`pg`; la CLI soporta generación y migración para ese adaptador. Esto deja a
Better Auth como dueño de sus tablas, sin personalizarlas.

**Alternativas descartadas**:

- Crear modelos SQLModel/Alembic para las tablas de Better Auth: sería una
  duplicación de la persistencia de identidad.
- Ejecutar migraciones durante la implementación: queda fuera de la autoridad
  solicitada y requiere una base de Neon real configurada.

**Referencias**: [PostgreSQL](https://better-auth.com/docs/adapters/postgresql), [base de datos y CLI](https://better-auth.com/docs/concepts/database).

### 3. JWT y JWKS para consumo futuro

**Decisión**: configurar `jwt()` en la instancia Better Auth de Next.js y
`jwtClient()` en el cliente. Configurar `issuer`, `audience` opcional y
`expirationTime` desde entorno; usar una
expiración de **15 minutos** en desarrollo y producción salvo que se cambie
explícitamente `AUTH_JWT_EXPIRATION`. Mantener el sujeto predeterminado:
`sub = user.id` de Better Auth. Publicar el JWKS predeterminado en
`/api/auth/jwks`. El consumo y validación por FastAPI quedan para una feature
posterior, sin modificar `app/server` ahora. `AUTH_JWT_AUDIENCE` puede ser
vacía/nula en pruebas; cuando no tenga valor, Better Auth no fija audiencia y
el futuro consumidor no debe exigir ese claim.

**Motivo**: JWT y sesión tienen propósitos distintos. El plugin entrega tokens
verificables por JWKS para servicios; el backend podrá verificarlos localmente en
el futuro sin llamar a Better Auth ni administrar contraseñas o sesiones.

**Alternativas descartadas**:

- Usar la cookie de sesión como token del backend: no cumple el contrato
  `Authorization: Bearer <jwt>` ni separa sesión de credencial de servicio.
- Añadir el plugin Bearer: no fue solicitado y el JWT plugin basta para obtener
  el token cuando se necesita.
- Usar email como identidad interna: puede cambiar; `sub` es el identificador
  estable que exige la constitución.

**Referencias**: [plugin JWT](https://better-auth.com/docs/plugins/jwt).

### 4. Correo transaccional mediante Brevo

**Decisión**: usar el SDK oficial `@getbrevo/brevo` únicamente en código de
servidor, aislado en `src/lib/email/brevo-client.ts`. `auth-email.ts` será el
adaptador de Better Auth y llamará al cliente para verificación y recuperación;
`templates.ts` generará cuerpos HTML y texto alternativo sin registrar la URL ni
el token. No se usa SMTP ni se expone la API key al navegador.

**Configuración requerida**: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y
`BREVO_SENDER_NAME`. El correo remitente debe estar registrado y verificado en
Brevo; el nombre es obligatorio en la aplicación para que ambos mensajes tengan
un remitente reconocible. La key es la API key de Brevo, no una SMTP key.

**Motivo**: la API oficial acepta la key, `sender`, destinatario, asunto y
contenido; el SDK TypeScript ya gestiona tipos y reintentos. La separación deja
las credenciales y los enlaces de autenticación en el servidor.

**Alternativas descartadas**:

- SMTP de Brevo: usa credenciales SMTP distintas y añade un transporte que no se
  necesita para los Route Handlers de Next.js.
- Plantillas alojadas de Brevo: no son necesarias para los dos mensajes de esta
  feature; se usarán plantillas locales simples y auditables.

**Referencias**: [envío transaccional](https://developers.brevo.com/docs/send-a-transactional-email), [SDK Node.js](https://developers.brevo.com/guides/node-js), [remitentes y dominios](https://developers.brevo.com/docs/getting-started-with-senders-and-domains).

### 5. Correo, verificación y recuperación

**Decisión**: habilitar `emailAndPassword` con validación de contraseña de la
feature, `requireEmailVerification: true`, `autoSignIn: false`,
`resetPasswordTokenExpiresIn: 3600` y revocación de las otras sesiones al
restablecer contraseña. Configurar `emailVerification` con `sendOnSignUp: true`,
`sendOnSignIn: true`, `autoSignInAfterVerification: true` y `expiresIn: 3600`
(una hora). Un `before` hook de Better Auth valida en servidor el nombre no
vacío y la regla completa de contraseña (12+ caracteres, letra y número) en
`/sign-up/email` y `/reset-password`. Las funciones de envío delegan a
`auth-email.ts`, el único adaptador de Brevo, y nunca devolverán el enlace/token
a la UI.

**Motivo**: Better Auth recibe un callback de envío para verificación y
  recuperación. Desactivar el auto-inicio de sesión al registrarse evita que el
  proxy entregue Home a una cuenta no verificada; el enlace exitoso sí crea la
  sesión necesaria para redirigir a Home. Para la recuperación, la interfaz
  siempre muestra la respuesta anónima indicada por la specification. Cuando el
  acceso por correo devuelve el estado de correo no verificado, `sendOnSignIn`
  reenvía el enlace; la UI muestra un toast y redirige a `/auth/verify-email`.
  El hook
  oficial permite que la regla de contraseña se valide también en el límite de
  seguridad, sin crear un plugin ni un endpoint personalizado.

**Alternativas descartadas**:

- Código OTP: la decisión aprobada es un enlace de un solo uso, no OTP.
- Auto-iniciar sesión tras recuperar contraseña: contradice la clarification;
  el destino correcto es `/auth/login` con confirmación.
- Un proveedor de correo incorporado a Better Auth: Better Auth exige Bring
  Your Own Email Provider; su implementación se aísla para no añadir otro
  proveedor de inicio de sesión.

**Referencias**: [correo](https://better-auth.com/docs/concepts/email), [opciones](https://better-auth.com/docs/reference/options), [hooks](https://better-auth.com/docs/concepts/hooks).

### 6. Google como único acceso social

**Decisión**: configurar solo `socialProviders.google` con
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `BETTER_AUTH_URL`. El botón de
Google invoca `signIn.social({ provider: "google", callbackURL: "/" })`; tanto
alta como acceso finalizan en Home. No se habilita vinculación automática por
coincidencia de correo.

**Motivo**: Better Auth construye por defecto el callback
`/api/auth/callback/google` a partir de la URL base. Google es el único
proveedor solicitado y el registro social llega con la identidad validada por
Google, sin la pantalla de verificación de correo del flujo contraseña.

**Referencia**: [Google](https://better-auth.com/docs/authentication/google).

### 7. Protección de rutas en Next.js 16

**Decisión**: crear un único `app/client/src/proxy.ts`. El proxy distingue
`/auth/**`, rutas públicas de Better Auth y rutas de aplicación; obtiene la
sesión de Better Auth en runtime Node para redirigir sesiones válidas desde
`/auth/**` a `/` y sesiones ausentes desde rutas protegidas a `/auth/login`.
Home y cualquier layout/ruta protegida repetirán la comprobación de sesión en
servidor antes de entregar datos.

**Motivo**: en Next.js 16 el archivo se llama `proxy.ts`; Proxy centraliza
redirecciones pero no reemplaza la autorización o validación definitiva en
datos/rutas. Better Auth soporta la comprobación de sesión en Proxy Node.

**Alternativas descartadas**:

- `middleware.ts`: es la convención anterior a Next.js 16.
- Confiar solo en Proxy: no protege accesos directos a datos o Route Handlers.

**Referencias**: [Proxy de Next.js](https://nextjs.org/docs/app/getting-started/proxy), [protección Better Auth](https://better-auth.com/docs/1.6/integrations/next).

# Contratos de rutas y flujos de autenticación

## Rutas de interfaz

| Ruta | Acceso | Resultado principal |
|---|---|---|
| `/auth/login` | solo sin sesión | acceso correo/contraseña o Google; éxito a `/` |
| `/auth/register` | solo sin sesión | correo/contraseña a `/auth/verify-email`; Google a `/` |
| `/auth/forgot-password` | solo sin sesión | mensaje público idéntico para cualquier correo |
| `/auth/reset-password?token=…` | solo sin sesión | éxito a `/auth/login?passwordReset=1`, sin sesión |
| `/auth/verify-email` | solo sin sesión o estado de verificación | explica revisar correo, permite reenvío seguro y procesa el enlace a `/` |
| `/` | sesión válida | Home protegida con encabezado de usuario y salida |
| `/api/auth/[...all]` | Better Auth | Route Handler interno; excluido de las redirecciones de UI |

El proxy considera `/auth/**` rutas de invitado y todas las rutas de aplicación
protegidas salvo los assets y el Route Handler de Better Auth. Con sesión válida
redirige invitado a `/`; sin sesión redirige cualquier ruta protegida a
`/auth/login`. Cada página/handler que entregue datos protegidos verifica la
sesión nuevamente en servidor.

## Acciones visibles

| Acción | Éxito | Error seguro y siguiente paso |
|---|---|---|
| Registro correo/contraseña | crea cuenta no verificada, Brevo manda enlace de 1 h y lleva a revisar correo | toast: correo existente o regla de contraseña; no expone datos internos |
| Registro/acceso Google | callback de Google y sesión a `/` | toast de fallo OAuth y reintento; no crea vínculo implícito por igual correo |
| Verificar correo | enlace único marca correo verificado, crea sesión y redirige a `/` | toast de enlace inválido/expirado/usado y opción de solicitar otro |
| Acceso correo/contraseña | solo correo verificado; sesión a `/` | credenciales: toast genérico; no verificado: Better Auth/Brevo reenvía enlace, toast y navegación a revisar correo |
| Olvidé contraseña | Brevo envía enlace cuando corresponde y siempre muestra la misma confirmación | toast público idéntico; no revela si existe la cuenta |
| Restablecer contraseña | token único de 1 h actualiza contraseña y va a login con confirmación | toast de token inválido/expirado/usado; no cambia contraseña |
| Cerrar sesión | invalida sesión del dispositivo y redirige a `/auth/login` | toast seguro de fallo y no simular salida si no se revocó |

## Contrato de interfaz

- Formularios: `name`, `email` y `password` validan con Zod para experiencia;
  Better Auth vuelve a validar en su límite seguro. La contraseña requiere 12+
  caracteres, al menos una letra y un número.
- Todo error de validación, interacción, Better Auth, Brevo u OAuth se presenta
  mediante `toast.error` de Sonner. Cada toast tiene texto accionable y
  accesible; los controles afectados conservan `aria-invalid` sin duplicar un
  segundo canal visual de error. Nunca se devuelve el valor de contraseña al
  formulario.
- Componentes comunes de las páginas residen en `src/app/auth/components/` y
  consumen tokens existentes; iconos exclusivamente de `lucide-react`.
- Home obtiene sesión de Better Auth del lado servidor. Su header presenta foto
  si existe, o `User` de Lucide si no; nombre arriba, correo abajo y botón
  «Salir» que ejecuta `signOut` antes de ir a login.

## Endpoints de seguridad

| Endpoint | Consumidor | Garantía |
|---|---|---|
| `/api/auth/token` | cliente, bajo demanda | JWT breve; no se persiste |
| `/api/auth/jwks` | consumidor futuro | material público de las claves; la caché por `kid` queda fuera de esta feature |
| endpoints internos de Better Auth | formularios/client | sesiones y tokens por cookie/flujo Better Auth; no se replican en FastAPI |

# Modelo de datos y seguridad

Better Auth administra estos datos en PostgreSQL/Neon. La feature no introduce
tablas, columnas ni migraciones personalizadas.

| Entidad | Dueño | Datos relevantes | Reglas |
|---|---|---|---|
| Usuario | Better Auth | `id`, nombre, correo, `emailVerified`, imagen | `id` es estable y se vuelve `sub` del JWT. El correo no es el identificador interno del actor. |
| Cuenta | Better Auth | vínculo proveedor, identificador externo, credencial cifrada | Admite contraseña y Google; no vincula automáticamente Google a un correo existente. |
| Sesión | Better Auth | usuario, expiración, token de sesión | La cookie segura de sesión es para el navegador y no se usa como JWT de FastAPI. |
| Verificación | Better Auth | token temporal, identificador, expiración | Se usa una sola vez. Verificación y recuperación expiran a los 3.600 s. |
| JWKS | plugin JWT | clave pública, clave privada cifrada, `kid`, vigencia | La clave privada permanece en la base; JWKS solo expone material público. |
| JWT de servicio | plugin JWT | `iss`, `aud`, `sub`, `exp`, `kid` | Vida de 15 min; se obtiene bajo demanda, no se persiste en el navegador. |

## Variables de entorno

El repositorio versionará únicamente `app/client/.env.example`; la
implementación crea `app/client/.env.local` local con placeholders y el usuario
reemplaza los valores. Nunca se versiona un secreto.

| Variable | Uso | Valor/decisión |
|---|---|---|
| `DATABASE_URL` | cadena PostgreSQL de Neon para `pg` | requerida; secreto |
| `BETTER_AUTH_SECRET` | cifrado, firma y hash de Better Auth | requerida; mínimo 32 caracteres de alta entropía |
| `BETTER_AUTH_URL` | origen canónico e `iss` por defecto | requerida; `http://localhost:3000` en local |
| `GOOGLE_CLIENT_ID` | OAuth de Google | requerida para Google |
| `GOOGLE_CLIENT_SECRET` | OAuth de Google | requerida; secreto |
| `AUTH_JWT_AUDIENCE` | audiencia opcional del JWT | opcional; puede ser vacía/nula en pruebas; solo se valida cuando tiene valor |
| `AUTH_JWT_EXPIRATION` | TTL del JWT de servicio | `15m` |
| `BREVO_API_KEY` | autentica la API transaccional de Brevo | requerida; secreto de servidor, no `NEXT_PUBLIC_` |
| `BREVO_SENDER_EMAIL` | remitente de verificación/recuperación | requerida; dirección registrada y verificada en Brevo |
| `BREVO_SENDER_NAME` | nombre visible del remitente | requerida; texto de marca, sin secretos |

## Contrato de identidad para integración futura

1. El cliente solicita `authClient.token()` solo justo antes de una llamada a
   un servicio protegido; esta feature no modifica el consumidor backend.
2. El cliente añade el token temporal como `Authorization: Bearer <jwt>` y no
   lo guarda.
3. La futura integración obtiene JWKS de `${BETTER_AUTH_URL}/api/auth/jwks`,
   selecciona por `kid` y verifica firma, `exp` e `iss`; verifica
   `aud == AUTH_JWT_AUDIENCE` únicamente cuando la variable no sea vacía/nula.
4. Solo un `sub` no vacío y verificado se mapea a `actor_id` de los casos de
   uso. Claims de perfil no se usan para autorización.
5. La futura integración convertirá fallos de JWT en su contrato central de
   errores; esta feature no implementa ese código ni toca `app/server`.

## Envío de correo

`auth-email.ts` recibe de Better Auth el destinatario y la URL de un enlace ya
generado. Invoca el cliente de Brevo solo del lado servidor con
`BREVO_API_KEY`, el remitente verificado y una plantilla local de tipo
`verify-email` o `reset-password`. La URL segura solo aparece en el correo
transaccional destinado a ese usuario; nunca se registra en logs ni se expone
en toasts, errores o correos no destinados al flujo. La respuesta de Brevo
(`messageId`) puede registrarse solo como dato operativo; nunca se registra el
token, la contraseña ni la API key. Un fallo de Brevo se traduce a mensaje
genérico y Sonner lo anuncia mediante toast.

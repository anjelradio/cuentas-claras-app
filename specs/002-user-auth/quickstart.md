# Guía de implementación y validación

## Preparación local

1. En `app/client`, instalar `better-auth` y `pg` con pnpm. No añadir plugins
   de Better Auth salvo JWT ni proveedores sociales salvo Google.
2. Crear `.env.local` a partir de `.env.example` y proporcionar `DATABASE_URL`
   de Neon, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, credenciales de Google,
   audiencia/TTL del JWT, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y
   `BREVO_SENDER_NAME`.
3. En Google Cloud, registrar exactamente
   `http://localhost:3000/api/auth/callback/google` para desarrollo y
   `https://<dominio>/api/auth/callback/google` para producción.
4. En Brevo, crear la API key y registrar/verificar el correo remitente y su
   dominio. `auth-email.ts` debe enviar exclusivamente por la API transaccional
   el enlace recibido de Better Auth; no registrar enlaces, tokens ni API key.
5. La persona responsable de Neon genera y ejecuta las migraciones de Better
   Auth una vez que la configuración esté completa. Esta implementación no
   ejecuta `auth generate` ni `auth migrate`.

## Validación manual

1. Registro por correo con datos válidos: llegar a «revisa tu correo», no a
   Home; abrir enlace antes de una hora y comprobar Home.
2. Reutilizar o expirar el enlace de verificación: no cambia la cuenta; se
   ofrece reenviar.
3. Intentar acceso con esa cuenta antes de verificar: Brevo reenvía el enlace,
   aparece un toast, la persona vuelve a revisar correo y no recibe contenido
   protegido.
4. Google: verificar callback autorizado y llegada directa a Home.
5. Recuperación: enviar una dirección existente y una inexistente; confirmar que
   el texto público es idéntico. Con enlace válido actualizar contraseña y
   comprobar redirección a Login sin sesión; reutilizarlo debe fallar.
6. Abrir una ruta protegida sin sesión y una ruta `/auth/**` con sesión para
   confirmar las dos direcciones de Proxy.
7. En Home, revisar imagen/icono, nombre, correo y Salir; al salir, abrir `/`
   debe regresar a login.
8. Solicitar un JWT solo para una llamada protegida y comprobar que el cliente
   no lo persiste. La verificación por JWKS y el mapeo de `sub` quedan para una
   feature futura del backend.

## Comprobaciones automatizadas

- `pnpm lint`, `pnpm typecheck` y `pnpm test` desde `app/client`.
- Pruebas de cada redirección, cada error anunciado por Sonner, accesibilidad
  por teclado y la ausencia de contraseñas/enlaces en estados renderizados.
- Pruebas del cliente JWT/JWKS y de su ausencia de persistencia; las pruebas del
  consumidor backend quedan fuera de este alcance.

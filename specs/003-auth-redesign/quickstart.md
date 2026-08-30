# Guía de Validación Rápida (Quickstart)

Esta guía describe cómo verificar la correcta aplicación del diseño "Stitch" en las rutas de autenticación.

## Pasos de Verificación Visual

1. **Revisión del Layout Global**
   - Navega a `/auth/login`.
   - **Esperado:** El fondo debe tener el color `#0d1021` con efectos de iluminación `radial-gradient` en tonos morados/azules, cumpliendo con la indicación del layout unificado.

2. **Revisión de Componentes (Stitch)**
   - Navega a las rutas `/auth/register`, `/auth/forgot-password`, `/auth/verify-email`.
   - **Esperado:** 
     - Los contenedores deben presentar el estilo `.glass-panel` (fondo semitransparente oscuro con `backdrop-blur`).
     - Los botones primarios deben mostrar el degradado `#5f4dff` a `#1e1c9e`.

3. **Verificación de Regresiones (Lógica)**
   - Intenta registrarte o iniciar sesión con una cuenta válida e inválida.
   - **Esperado:** Todos los toasts de error, redirecciones a correos, y protección de sesión (Better Auth) deben funcionar exactamente igual que antes del rediseño.

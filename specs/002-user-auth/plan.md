# Plan de implementación: autenticación de usuarios

**Rama**: `002-user-auth` | **Fecha**: 2026-08-29 | **Specification**: [spec.md](./spec.md)

## Resumen

Incorporar Better Auth al proyecto Next.js de `app/client` como fuente única de verdad de las cuentas, sesiones, contraseñas, verificación de correo y acceso con Google. Better Auth se montará en `api/auth/[...all]`, utilizará PostgreSQL de Neon mediante `pg` y tendrá únicamente el plugin JWT (con su cliente) para emitir tokens breves verificables por JWKS. Las páginas de autenticación, el proxy y Home aplicarán los flujos y redirecciones definidos en la specification; ninguna ruta de negocio se construye en esta feature.

## Contexto técnico

**Lenguaje/versión**: TypeScript 5; Next.js 16.3.3 con React 19, App Router y Node.js en los Route Handlers/Proxy.

**Dependencias principales**: `better-auth`, `pg`, `@getbrevo/brevo` y cliente React de Better Auth con `jwtClient`; componentes existentes shadcn/ui (Vega), Zod, Sonner y `lucide-react`. No se agregan plugins de Better Auth aparte de JWT ni otros proveedores sociales.

**Almacenamiento**: PostgreSQL administrado por Neon, conectado por `DATABASE_URL`. Better Auth es dueño de sus tablas base y de la tabla `jwks` que añade el plugin JWT; no se diseñan tablas, columnas ni migraciones propias.

**Pruebas**: Vitest + Testing Library en cliente; pruebas de integración de los Route Handlers de Better Auth contra PostgreSQL de prueba.

**Plataforma destino**: aplicación web Next.js desplegada en Node.js y navegador moderno.

**Tipo de proyecto**: cliente web Next.js dentro del monorepo.

**Objetivos de rendimiento**: el proxy no realizará trabajo de negocio y Home obtendrá una sesión una vez en el servidor.

**Restricciones**:

- La implementación de esta feature modifica exclusivamente `app/client`; no se modifica `app/server`, `docs` ni se crean proyectos alternativos. La futura validación del JWT por el backend queda documentada, pero fuera de esta implementación.
- Los comandos de generación o migración de Better Auth no se ejecutarán. La persona responsable configurará Neon y ejecutará la migración de las tablas estándar de Better Auth y de `jwks`.
- Las contraseñas, secretos, tokens, enlaces y JWT no se registran ni se persisten en `localStorage`, `sessionStorage` ni cookies legibles por JavaScript. La sesión web usa la cookie segura de Better Auth.
- La entrega de correo se implementa exclusivamente mediante la API transaccional de Brevo. Better Auth delega sus dos funciones de envío en ese adaptador; Brevo no es un proveedor de inicio de sesión.
- Cada error de formulario, operación de Better Auth u OAuth se comunica con el `Toaster` de Sonner ya instalado; las indicaciones siguen siendo accesibles y no muestran secretos.

**Alcance**: cinco pantallas bajo `/auth`, un punto de entrada de Better Auth, un proxy, Home con encabezado de sesión y la documentación del contrato JWT/JWKS futuro. No incluye MFA, roles, permisos, passkeys, SMS, otros proveedores sociales, validación backend ni funcionalidades de gastos.

## Verificación de la constitución

| Regla | Decisión del plan | Estado |
|---|---|---|
| I. Ubicación y responsabilidades | Next.js y Better Auth residen en `app/client`; `app/server` no se modifica. El consumo y validación JWT/JWKS se reserva para una feature futura. | Cumple |
| III. Calidad | Se prueban flujos observables, accesibilidad de formularios, redirecciones y los fallos de seguridad. | Cumple |
| IV–XII. Backend | `app/server` no se modifica; las decisiones futuras de integración no generan archivos ni tareas en esta feature. | Cumple |
| XIII. Better Auth y JWT | Better Auth gestiona sesiones y credenciales; el cliente deja disponible JWT/JWKS para consumo futuro. El mapeo `sub` queda documentado sin implementar el verificador backend. | Cumple |
| XIV. Sin roles globales | El JWT identifica al actor, sin roles ni permisos de dominio. | Cumple |
| XV. Errores | La UI traduce únicamente errores seguros mediante Sonner; los límites de FastAPI quedan fuera de alcance. | Cumple |
| Frontend | App Router, Server Components por defecto, shadcn/ui, tokens existentes, Sonner y solo iconos Lucide. | Cumple |

**Correspondencia futura de identidad**: el JWT emitido por Better Auth mantendrá el sujeto predeterminado del plugin: `sub = BetterAuth user.id`. Cuando se implemente el backend, deberá tratar exclusivamente `sub` como identificador interno tras verificar firma, `exp`, `iss`, `aud` (si está configurada) y `kid`. Esta feature no crea ni modifica archivos en `app/server`.

**Revisión posterior a Phase 1**: los contratos siguientes conservan la separación de sesión/JWT y el mapeo `sub`; no requieren excepciones ni aumentan la complejidad arquitectónica.

## Estructura del proyecto

### Artefactos de esta feature

```text
specs/002-user-auth/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── auth-flows.md
```

### Código previsto

```text
app/
├── client/
│   ├── .env.example
│   ├── .env.local                         # local, ignorado, sin valores reales en Git
│   └── src/
│       ├── app/
│       │   ├── api/auth/[...all]/route.ts
│       │   ├── auth/
│       │   │   ├── components/
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx
│       │   │   ├── forgot-password/page.tsx
│       │   │   ├── reset-password/page.tsx
│       │   │   └── verify-email/page.tsx
│       │   ├── layout.tsx
│       │   └── page.tsx                   # Home protegida
│       ├── components/layout/
│       │   └── home-header.tsx
│       ├── lib/
│       │   ├── auth.ts
│       │   ├── auth-client.ts
│       │   ├── auth-errors.ts
│       │   └── email/
│       │       ├── auth-email.ts
│       │       ├── brevo-client.ts
│       │       └── templates.ts
│       └── proxy.ts
```

**Decisión de estructura**: `auth` agrupa únicamente las rutas y componentes de flujo de acceso. La configuración de servidor y cliente de Better Auth se mantiene en `src/lib`; Home sigue siendo la ruta raíz solicitada. Cualquier verificador futuro de FastAPI no pertenece a esta feature.

## Entrega por fases

### Fase 0 — decisiones comprobadas

Consultar [research.md](./research.md) antes de instalar o configurar paquetes.

### Fase 1 — contratos y diseño

Aplicar [data-model.md](./data-model.md), [auth-flows.md](./contracts/auth-flows.md) y [quickstart.md](./quickstart.md) como contratos de implementación y de validación manual. Las expiraciones y la configuración de seguridad ya quedan decididas allí.

### Fase 2 — implementación posterior

`speckit-tasks` convertirá este plan en tareas ordenadas. No añade tareas para generar ni ejecutar migraciones: esas operaciones de Neon siguen a cargo de la persona responsable de infraestructura.

## Complejidad

No hay violaciones de la constitución que requieran justificación.

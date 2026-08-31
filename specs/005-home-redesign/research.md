# Research & Architecture

## Quick Actions Architecture
- **Decision**: Crear el componente `QuickActionButton` en `@/components/custom/quick-action-button.tsx`.
- **Rationale**: Reutilizable en cualquier pantalla. Soportará las variantes (orange, blue, purple) a través de `cva` y un prop de ícono de `lucide-react`. La apertura de `Sheet` o `Modal` (`Dialog`) sucederá envolviendo el botón con el respectivo componente trigger de shadcn.
- **Alternatives considered**: Manejar un estado global o de contexto. *Rejected*: Shadcn aconseja componer triggers directamente junto con el contenido del modal (`<Dialog><DialogTrigger asChild><QuickActionButton/></DialogTrigger>...`).

## Home Page Composition
- **Decision**: Crear una ruta explícita `app/home/page.tsx` para el dashboard de inicio, y que `app/page.tsx` redirija hacia allí. Aislar las secciones del dashboard en componentes privados `app/home/_components/*.tsx`.
- **Rationale**: Mantiene el archivo `page.tsx` limpio, organizado, y sigue la convención de rutas explícitas que facilita el mantenimiento futuro y aislamiento del scope.
- **Alternatives considered**: Todo en `app/page.tsx`. *Rejected*: Aumenta la fricción si en el futuro se quiere una landing page pública en la raíz.

## Mock Data
- **Decision**: Todo el mock data vivirá en `app/home/_components/home-mock-data.ts`.
- **Rationale**: Simula un fetch del servidor. Cuando el backend esté listo, `app/home/page.tsx` hará la petición y pasará la info como props reales.

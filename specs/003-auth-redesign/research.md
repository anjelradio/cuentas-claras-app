# Phase 0: Outline & Research

## Análisis de los diseños "Stitch"

Al inspeccionar los archivos HTML provistos en `design/auth/` (por ejemplo, `login.html`), descubrimos que el diseño se basa fuertemente en una estética oscura ("Darker navy background") con colores vibrantes, tipografía específica y efectos de "glassmorphism".

- **Font Family**: La fuente original del diseño Stitch es `Montserrat Alternates`, **sin embargo**, por directriz del usuario, *se respetará la fuente existente ya configurada en el layout principal de la aplicación*. No se modificará la tipografía.
- **Colors**:
  - `background`: `#0d1021`
  - `surface`: `rgba(21, 26, 48, 0.6)`
  - `surface-high`: `rgba(30, 37, 66, 0.7)`
  - `border`: `rgba(255, 255, 255, 0.08)`
  - `primary`: `#3d3bff`
  - `primary-gradient-start`: `#5f4dff`
  - `primary-gradient-end`: `#1e1c9e`
  - `secondary`: `#a3a5cc`
  - `text`: `#ffffff`
  - `text-muted`: `#9699be`
  - `success`: `#1ee370`
  - `error`: `#ff4d4d`
  - `warning`: `#ff6b1a`
- **Background Image (Body)**: Múltiples `radial-gradient` que simulan iluminación en las esquinas.
- **Utilidades Custom**: `.glass-panel` para desenfoque y bordes traslúcidos.

### Decisiones de Arquitectura CSS

- **Decision**: Mantener Shadcn/UI pero inyectando los colores de "Stitch" mediante variables CSS en el `app/client/src/app/globals.css` que afecten exclusivamente la raíz oscura o extendiendo el archivo `tailwind.config.ts` según corresponda. La tipografía no se tocará, heredando la del layout global de la app.
- **Rationale**: El usuario requiere fidelidad al diseño "Stitch" visualmente pero manteniendo la fuente general. Al tener los colores definidos explícitamente en el HTML original, es más seguro agregarlos como colores fijos en la configuración de Tailwind, o remapear las variables `--primary`, `--background`, `--card`, etc., para aprovechar los componentes de Shadcn/UI ya instalados (inputs, botones).
- **Alternatives considered**: Escribir todo desde cero (se descartó por el esfuerzo y riesgo de perder accesibilidad).

### Estrategia de Layout

- **Decision**: Se modificará el archivo `app/client/src/app/auth/layout.tsx` para aplicar las clases de fondo global (gradientes radiales y color de fondo `#0d1021`) exigidas por el requerimiento ("en el layout que cubre todas las rutas de autenticación setear el fondo, al menos el fondo, para que sea idéntico").
- **Rationale**: El layout compartido es el lugar natural en el App Router de Next.js para colocar fondos que afectan a toda una sección, garantizando consistencia.

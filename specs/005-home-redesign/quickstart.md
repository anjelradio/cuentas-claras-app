# Quickstart & Validation Guide

**Prerequisites:**
- Servidor de frontend corriendo (`npm run dev`).
- Un usuario de prueba autenticado (o iniciar sesión con Google).

**Validation Scenarios:**

1. **Visualización de Componentes Estáticos**
   - Navega a `http://localhost:3000/`.
   - Verifica que el Header rediseñado coincida con la estética de Stitch.
   - Verifica que las cartas "Requiere tu atención", "Eventos Recientes" y "Actividad Reciente" se muestren con los datos estáticos, utilizando el `glass-panel` y colores acordados.

2. **Acciones Rápidas (Quick Actions)**
   - Identifica la sección de Accesos Rápidos.
   - Verifica los botones con sus variantes (ej. Naranja, Azul, Morado).
   - Haz clic en los botones y comprueba que se desplieguen los componentes overlay de shadcn (Modales o Bottom Sheets) sin errores de renderizado.

3. **Responsividad**
   - Inspecciona la página en modo móvil (ej. iPhone 12 Pro) en DevTools.
   - Verifica que los menús y overlays se ajusten correctamente al ancho de pantalla.

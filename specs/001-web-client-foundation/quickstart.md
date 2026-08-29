# Guía de validación: Base del cliente web

## Alcance de ejecución

Esta guía se ejecuta al implementar. La planificación no inicializa paquetes ni
modifica `app/client/`.

## Prerrequisitos

- pnpm estable disponible.
- `app/client/` existe y está vacío; comprobarlo antes de inicializar.
- No ejecutar comandos en `app/server/` ni fuera de `app/client/`.

## Inicialización planificada

Desde `app/client/`:

```text
pnpm create next-app@latest . --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-pnpm --yes
```

Antes de inicializar shadcn/create, verificar que la paleta y las asignaciones
tipográficas definitivas estén registradas en el [contrato de UI](./contracts/ui-foundation.md)
y revisar el contraste de los roles de texto. Después, seleccionar Vega, Lucide
React y Next.js, copiar el código de preset generado e inicializar shadcn/ui.

## Escenarios de validación

1. Linter y compilación de producción terminan sin errores.
2. El fondo usa `background`; Card, Dialog, AlertDialog y Sheet usan `surface`.
3. Los roles headline, body y label usan sus variables tipográficas y la paleta
   coincide con el contrato.
4. Cada control interactivo se usa con teclado y expone foco y etiqueta accesible.
5. A 320 px y en escritorio no hay desplazamiento horizontal que oculte acciones.
6. Una notificación de ejemplo de Sonner comunica estado mediante contenido
   además de color.

## Resultado esperado

La ruta inicial confirma que el sistema de diseño y la colección están listos
para funcionalidades futuras, sin flujos de negocio ni comunicación con backend.

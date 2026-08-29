# Fundación visual Checklist: Base del cliente web

**Purpose**: Revisar la claridad, completitud, consistencia y trazabilidad de
los requisitos de la fundación visual antes de descomponer la implementación.
**Created**: 2026-08-29
**Feature**: [spec.md](../spec.md)

**Note**: Esta checklist personalizada revisa la calidad de los requisitos, no
la implementación.
**Review Ownership**: Es un artefacto de revisión de requisitos. Marque `[x]`
solo cuando la persona revisora determine que el criterio está satisfecho.
**Marker Semantics**: `[x]` indica calidad de requisitos aprobada; no indica que
el trabajo de implementación esté terminado.

## Alcance y límites del proyecto

- [x] CHK001 ¿La ruta obligatoria `app/client/` y su código bajo
  `app/client/src/` están definidos de forma inequívoca? [Clarity, Spec §FR-009]
- [x] CHK002 ¿La ruta `app/client/` y el límite `app/client/src/` están
  documentados de forma consistente entre la especificación, las suposiciones y
  el plan?
  [Consistency, Spec §Assumptions, Plan §Constitution Check]
- [x] CHK003 ¿Los límites que excluyen servidor, documentación, autenticación,
  persistencia, API y funcionalidades de negocio están completos y no dejan
  rutas alternativas implícitas? [Completeness, Spec §FR-010–FR-011]
- [x] CHK004 ¿La página de verificación mínima está delimitada de manera que no
  se confunda con una pantalla de producto? [Clarity, Plan §Summary]

## Tokens y tipografía

- [x] CHK005 ¿Los roles primary, secondary, tertiary y neutral tienen valores
  canónicos y una finalidad semántica definida? [Completeness, Spec §FR-001,
  Contract §Tokens obligatorios]
- [x] CHK006 ¿Los requisitos distinguen con claridad `background` de `surface`
  y asignan sus valores aprobados sin contradicciones? [Consistency, Spec §FR-002,
  Contract §Tokens obligatorios]
- [x] CHK007 ¿Los roles headline, body y label especifican tres fuentes Google,
  sus variables y su ámbito de aplicación sin dejar las familias indefinidas al
  comenzar la implementación? [Clarity,
  Spec §FR-002, Research §Tema, tokens y tipografía]
- [x] CHK008 ¿Los requisitos de color success, info, warning y error establecen
  criterios de contraste y significado, aunque sus valores concretos se definan
  después? [Completeness, Spec §FR-003, Contract §Tokens obligatorios]
- [] CHK009 ¿La prohibición de duplicar colores y fuentes establece qué se
  considera un token equivalente? [Clarity, Spec §FR-004]
- [x] CHK010 ¿El requisito de tema único excluye explícitamente variantes claras,
  oscuras y adaptación automática, sin exigir valores de paleta antes de que se
  registren formalmente? [Consistency, Spec §FR-012–FR-013, Clarifications]

## Superficies y componentes base

- [x] CHK011 ¿La asignación de `surface` a Card, Dialog, AlertDialog y Sheet está
  completa y usa el mismo significado de superficie elevada en toda la
  documentación? [Consistency, Spec §FR-002, Contract §Tokens obligatorios]
- [ ] CHK012 ¿La colección de componentes define cada categoría requerida y
  distingue componentes de formularios, contenedores y notificaciones?
  [Completeness, Spec §FR-005]
- [x] CHK013 ¿La cantidad y la lista de componentes son consistentes con los 15
  tipos solicitados y excluyen Toast como componente separado? [Consistency,
  Spec §FR-005, Spec §SC-001, Plan §Summary]
- [x] CHK014 ¿Los requisitos identifican a Sonner como el único sistema de
  notificaciones y evitan una política alternativa? [Clarity, Contract §Reglas
  de comportamiento]
- [x] CHK015 ¿La regla de iconos restringe de forma consistente la colección a
  Lucide React y define el tratamiento de iconos sin texto? [Completeness,
  Constitution §XXIV, Contract §Reglas de comportamiento]

## Accesibilidad y diseño responsive

- [x] CHK016 ¿Los requisitos de teclado, foco visible y nombres accesibles cubren
  todos los controles interactivos de la colección? [Coverage, Spec §FR-006]
- [ ] CHK017 ¿Los requisitos de estados semánticos precisan que el texto, icono
  o etiqueta complemente el color en todos los estados relevantes?
  [Completeness, Spec §FR-007]
- [x] CHK018 ¿El criterio de diseño mobile-first define un umbral objetivo y una
  condición observable para no ocultar acciones principales? [Measurability,
  Spec §SC-004]
- [ ] CHK019 ¿Los casos límite documentan de forma suficiente campos inválidos,
  componentes sin contenido, notificaciones y pantallas estrechas?
  [Coverage, Spec §Edge Cases]
- [ ] CHK020 ¿Los requisitos de accesibilidad distinguen los estados permanentes
  de las notificaciones transitorias para evitar depender solo de un aviso breve?
  [Gap, Constitution §XXVII]

## Trazabilidad y criterios de aceptación

- [ ] CHK021 ¿Cada requisito de tokens, tipografía, superficies y componentes
  tiene al menos un criterio de éxito o escenario de aceptación asociado?
  [Traceability, Spec §FR-001–FR-008, Spec §Success Criteria]
- [ ] CHK022 ¿El porcentaje de componentes de SC-001 es medible con la lista
  definitiva de 15 tipos y Sonner como único sistema de notificaciones?
  [Clarity, Spec §SC-001, Spec §FR-005]
- [ ] CHK023 ¿El objetivo de ensamblar cinco componentes en menos de 15 minutos
  identifica la persona revisora, el punto de inicio y el criterio de finalización?
  [Clarity, Spec §SC-005]
- [ ] CHK024 ¿Las suposiciones documentan la dependencia de la configuración
  oficial de Vega, el preset generado y el bloqueo de versiones por pnpm?
  [Dependencies, Spec §Assumptions, Research §shadcn/ui, Vega y componentes]

## Notes

- Marque elementos `[x]` solo tras revisar que el requisito está suficientemente
  definido; déjelos sin marcar cuando requieran corrección o aclaración.
- Esta checklist no sustituye la checklist integrada de calidad de especificación.
- `$speckit-implement` puede leer los marcadores, pero no debe modificarlos.
- Añada hallazgos o enlaces junto al elemento correspondiente.

## Alineación final del plan técnico

- [x] CHK025 ¿La distinción entre la raíz del proyecto `app/client/`, el código
  fuente bajo `app/client/src/` y el App Router en `app/client/src/app/` está
  expresada sin ambigüedad? [Clarity, Spec §FR-009, Plan §Summary, Plan
  §Project Structure]
- [x] CHK026 ¿Las exclusiones de `app/server/`, `docs/`, servicios externos y
  demás funcionalidades de negocio son consistentes entre la especificación,
  el plan y la guía de validación, incluyendo la excepción explícita para
  artefactos de Spec Kit? [Consistency, Spec §FR-010–FR-011, Plan §Constraints,
  Quickstart §Alcance de ejecución]
- [ ] CHK027 ¿El plan exige resolver la versión estable de Next.js al implementar
  y conservar el lockfile sin convertir una versión histórica en una decisión
  permanente? [Clarity, Plan §Technical Context, Research §Versiones estables]
- [x] CHK028 ¿La configuración inicial enumera todos los requisitos solicitados:
  TypeScript, ESLint, Tailwind CSS, App Router, `src-dir`, pnpm y alias `@/*`?
  [Completeness, Spec §FR-009, Plan §Summary, Research §Inicialización del
  cliente]
- [ ] CHK029 ¿La selección del preset Vega mediante el flujo oficial de
  shadcn/create y la colección exacta de 15 componentes están trazadas sin
  permitir componentes adicionales? [Traceability, Plan §Summary, Research
  §shadcn/ui, Vega y componentes, Contract §Colección requerida]
- [ ] CHK030 ¿La especificación diferencia inequívocamente Sonner como único
  sistema de notificaciones de cualquier componente o proveedor denominado
  Toast/Toaster? [Clarity, Spec §FR-005, Plan §Summary, Contract §Reglas de
  comportamiento]
- [x] CHK031 ¿Los 13 tokens obligatorios aparecen completos y con una finalidad
  única, incluyendo `background` como fondo global y `surface` para Card,
  Dialog, AlertDialog y Sheet? [Completeness, Spec §FR-001–FR-003, Plan
  §Summary, Contract §Tokens obligatorios]
- [ ] CHK032 ¿La condición de registrar los valores definitivos de la paleta y
  las tres familias Google antes de implementar está formulada como una
  dependencia previa, sin introducir valores provisionales no aprobados?
  [Consistency, Spec §FR-013–FR-014, Research §Tema, tokens y tipografía]
- [ ] CHK033 ¿Los requisitos definen un criterio objetivo para evaluar el
  contraste accesible de los colores de texto y estados antes de la
  implementación? [Measurability, Spec §FR-006–FR-007 y §FR-013, Contract
  §Tokens obligatorios]
- [x] CHK034 ¿La regla de iconos limita explícitamente todas las funcionalidades
  de iconografía a Lucide React y contempla nombres accesibles para iconos sin
  texto? [Completeness, Constitution §XXIV, Contract §Reglas de comportamiento]
- [ ] CHK035 ¿La ruta de verificación está delimitada como evidencia de la base
  visual y de componentes, sin transformarse en una pantalla de producto ni
  incorporar autenticación, API, persistencia o lógica de gastos? [Boundary,
  Spec §FR-010, Plan §Summary, Quickstart §Resultado esperado]

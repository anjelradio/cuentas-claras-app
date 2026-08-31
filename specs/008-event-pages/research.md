# Research: Event Pages

## Technical Context
No unknowns found. The project uses Next.js App Router, Tailwind CSS, and shadcn/ui components.

## Design System Mapping
- **UI Libraries**: shadcn/ui (Alert Dialog, Button, Skeleton).
- **Icons**: Lucide React or Phosphor Icons (existing in project).
- **Styling**: `bg-[#181b27]`, `border-white/10`, `bg-surface-high`, gradients.
- **Responsiveness**: Will be handled via standard Tailwind classes (`md:flex-row`, etc.) ensuring 100% fidelity to Stitch designs.

## Decision: Inline Private Components
- **Rationale**: Following the user request, no `_components` folder will be created. The `EventCard` and `MemberItem` components will be declared directly inside their respective `page.tsx` files and mapped over mock data to keep the codebase centralized per page as requested.

## Decision: Mock Data
- **Rationale**: Static mock data will be used for events and members to fulfill the design before integrating with the backend.

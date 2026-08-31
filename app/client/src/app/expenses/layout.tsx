import { ProtectedAppLayout } from "@/components/layout/protected-app-layout"

/** Mantiene protegidas las rutas de gastos fuera del grupo funcional de eventos. */
export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>
}

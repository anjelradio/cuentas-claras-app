import { ProtectedAppLayout } from "@/components/layout/protected-app-layout"

export default async function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>
}

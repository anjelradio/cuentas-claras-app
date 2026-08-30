import { AuthCard } from "@/app/auth/components/auth-card"
import { AuthPageLayout } from "@/app/auth/components/auth-page-layout"
import { VerifyEmailStatus } from "@/app/auth/components/verify-email-status"

/** Guía la verificación de correo y redirige a Home al completarse. */
export default function VerifyEmailPage() {
  return <AuthPageLayout><AuthCard title="Revisa tu correo" description="Verifica tu dirección para activar tu cuenta."><VerifyEmailStatus /></AuthCard></AuthPageLayout>
}

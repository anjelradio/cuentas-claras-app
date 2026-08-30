import { AuthCard } from "@/app/auth/components/auth-card"
import { AuthPageLayout } from "@/app/auth/components/auth-page-layout"
import { ForgotPasswordForm } from "@/app/auth/components/forgot-password-form"

/** Permite solicitar un enlace de recuperación sin enumerar cuentas. */
export default function ForgotPasswordPage() {
  return <AuthPageLayout><AuthCard title="Recupera tu acceso" description="Te enviaremos instrucciones si existe una cuenta asociada al correo."><ForgotPasswordForm /></AuthCard></AuthPageLayout>
}

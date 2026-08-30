import { AuthCard } from "@/app/auth/components/auth-card"
import { AuthPageLayout } from "@/app/auth/components/auth-page-layout"
import { RegisterForm } from "@/app/auth/components/register-form"

/** Presenta el registro por correo y el acceso con Google. */
export default function RegisterPage() {
  return <AuthPageLayout><AuthCard title="Crea tu cuenta" description="Organiza tus cuentas con claridad."><RegisterForm /></AuthCard></AuthPageLayout>
}

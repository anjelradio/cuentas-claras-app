import { AuthCard } from "@/app/auth/components/auth-card"
import { AuthPageLayout } from "@/app/auth/components/auth-page-layout"
import { LoginForm } from "@/app/auth/components/login-form"

/** Presenta las opciones de acceso por correo o Google. */
export default function LoginPage() {
  return <AuthPageLayout><AuthCard title="Bienvenido de nuevo" description="Ingresa para continuar con tus cuentas."><LoginForm /></AuthCard></AuthPageLayout>
}

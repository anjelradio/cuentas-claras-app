"use client"

import { useSearchParams } from "next/navigation"

import { AuthCard } from "@/app/auth/components/auth-card"
import { AuthPageLayout } from "@/app/auth/components/auth-page-layout"
import { ResetPasswordForm } from "@/app/auth/components/reset-password-form"

/** Permite reemplazar una contraseña con el token temporal recibido por correo. */
export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const hasError = Boolean(searchParams.get("error"))
  const token = hasError ? null : searchParams.get("token")
  const description = token ? "Elige una contraseña nueva y segura." : "El enlace no es válido o ya expiró. Solicita uno nuevo."

  return <AuthPageLayout><AuthCard title="Restablece tu contraseña" description={description}><ResetPasswordForm token={token} /></AuthCard></AuthPageLayout>
}

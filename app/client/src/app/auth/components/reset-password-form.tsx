"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { getValidationMessage, resetPasswordSchema } from "@/app/auth/auth-schemas"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"

/** Establece una nueva contraseña a partir de un token temporal de Better Auth. */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [isInvalid, setIsInvalid] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      toast.error("El enlace ya no es válido. Solicita uno nuevo para continuar.")
      return
    }

    const password = new FormData(event.currentTarget).get("password")
    const parsed = resetPasswordSchema.safeParse({ password })
    if (!parsed.success) {
      setIsInvalid(true)
      toast.error(getValidationMessage(parsed.error))
      return
    }

    setIsInvalid(false)
    setIsPending(true)
    const result = await authClient.resetPassword({ token, newPassword: parsed.data.password })
    setIsPending(false)

    if (result.error) {
      toast.error(getAuthErrorMessage(result.error))
      return
    }

    router.push("/auth/login?passwordReset=1")
  }

  return (
    <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="password" className="sr-only">Nueva contraseña</FieldLabel>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          placeholder="Nueva contraseña"
          autoComplete="new-password" 
          aria-invalid={isInvalid} 
          disabled={isPending || !token} 
          className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-6 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-center text-lg" 
        />
      </Field>
      <p className="text-sm text-center text-muted-foreground px-4">Usa al menos 12 caracteres, una letra y un número.</p>
      <Button 
        type="submit" 
        className="w-full px-4 py-6 rounded-xl text-white font-semibold text-lg transition-all shadow-[0_4px_12px_rgba(255,107,26,0.3)] hover:shadow-[0_6px_16px_rgba(255,107,26,0.4)] hover:-translate-y-0.5 bg-gradient-to-br from-[#ff6b35] to-[#e65100]" 
        disabled={isPending || !token}
      >
        {isPending ? "Actualizando…" : "Actualizar contraseña"}
      </Button>
    </form>
  )
}

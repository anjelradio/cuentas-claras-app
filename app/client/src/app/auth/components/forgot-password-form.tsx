"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"

import { forgotPasswordSchema, getValidationMessage } from "@/app/auth/auth-schemas"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"

/** Solicita recuperación sin revelar si el correo pertenece a una cuenta. */
export function ForgotPasswordForm() {
  const [isPending, setIsPending] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isInvalid, setIsInvalid] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get("email")
    const parsed = forgotPasswordSchema.safeParse({ email })

    if (!parsed.success) {
      setIsInvalid(true)
      toast.error(getValidationMessage(parsed.error))
      return
    }

    setIsInvalid(false)
    setIsPending(true)
    const result = await authClient.requestPasswordReset({ email: parsed.data.email, redirectTo: "/auth/reset-password" })
    setIsPending(false)

    if (result.error && result.error.code !== "USER_NOT_FOUND") {
      toast.error(getAuthErrorMessage(result.error))
      return
    }

    setIsSubmitted(true)
    toast.success("Si existe una cuenta asociada, recibirás instrucciones para continuar.")
  }

  if (isSubmitted) {
    return (
      <div className="w-full flex flex-col gap-4 text-center">
        <p className="text-sm leading-6 text-muted-foreground px-4">Si existe una cuenta con ese correo, recibirás un enlace de recuperación. Revisa también tu carpeta de spam.</p>
        <Link 
          className="w-full px-4 py-4 rounded-xl text-white font-semibold text-lg transition-all border border-border bg-white/5 hover:bg-white/10" 
          href="/auth/login"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="email" className="sr-only">Correo electrónico</FieldLabel>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="Correo electrónico"
          autoComplete="email" 
          aria-invalid={isInvalid} 
          disabled={isPending} 
          className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-6 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-center text-lg" 
        />
      </Field>
      <Button 
        type="submit" 
        className="w-full px-4 py-6 rounded-xl text-white font-semibold text-lg transition-all shadow-[0_4px_12px_rgba(255,107,26,0.3)] hover:shadow-[0_6px_16px_rgba(255,107,26,0.4)] hover:-translate-y-0.5 bg-gradient-to-br from-[#ff6b35] to-[#e65100]" 
        disabled={isPending}
      >
        {isPending ? "Enviando…" : "Enviar instrucciones"}
      </Button>
      <p className="text-muted-foreground text-center text-sm mt-2">
        <Link className="text-white font-semibold hover:underline" href="/auth/login">Volver a iniciar sesión</Link>
      </p>
    </form>
  )
}

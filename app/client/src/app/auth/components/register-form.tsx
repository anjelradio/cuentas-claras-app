"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getValidationMessage, registerSchema } from "@/app/auth/auth-schemas"
import { GoogleSignInButton } from "@/app/auth/components/google-sign-in-button"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"

/** Registra una cuenta por correo y dirige a revisar el correo de verificación. */
export function RegisterForm() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [invalidFields, setInvalidFields] = useState<string[]>([])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parsed = registerSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    })

    if (!parsed.success) {
      setInvalidFields(parsed.error.issues.map((issue) => String(issue.path[0])))
      toast.error(getValidationMessage(parsed.error))
      return
    }

    setInvalidFields([])
    setIsPending(true)
    const result = await authClient.signUp.email({ ...parsed.data, callbackURL: "/" })
    setIsPending(false)

    if (result.error) {
      toast.error(getAuthErrorMessage(result.error))
      return
    }

    router.push("/auth/verify-email")
  }

  return (
    <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FieldGroup className="flex flex-col gap-4">
        <Field data-invalid={invalidFields.includes("name")}>
          <FieldLabel htmlFor="name" className="sr-only">Nombre</FieldLabel>
          <Input 
            id="name" 
            name="name" 
            placeholder="Nombre"
            autoComplete="name" 
            aria-invalid={invalidFields.includes("name")} 
            disabled={isPending} 
            className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-6 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-center text-lg" 
          />
        </Field>
        <Field data-invalid={invalidFields.includes("email")}>
          <FieldLabel htmlFor="email" className="sr-only">Correo electrónico</FieldLabel>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="Correo electrónico"
            autoComplete="email" 
            aria-invalid={invalidFields.includes("email")} 
            disabled={isPending} 
            className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-6 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-center text-lg" 
          />
        </Field>
        <Field data-invalid={invalidFields.includes("password")}>
          <FieldLabel htmlFor="password" className="sr-only">Contraseña</FieldLabel>
          <Input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Contraseña"
            autoComplete="new-password" 
            aria-invalid={invalidFields.includes("password")} 
            disabled={isPending} 
            className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-6 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-center text-lg" 
          />
        </Field>
      </FieldGroup>
      <p className="text-sm text-center text-muted-foreground px-4">Usa al menos 12 caracteres, una letra y un número.</p>
      
      <Button 
        type="submit" 
        className="w-full px-4 py-6 rounded-xl text-white font-semibold text-lg transition-all shadow-[0_4px_12px_rgba(255,107,26,0.3)] hover:shadow-[0_6px_16px_rgba(255,107,26,0.4)] hover:-translate-y-0.5 bg-gradient-to-br from-[#ff6b35] to-[#e65100]" 
        disabled={isPending}
      >
        {isPending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>

      <div className="flex items-center gap-4 w-full py-2">
        <div className="h-px bg-border flex-1"></div>
        <span className="text-muted-foreground text-sm font-medium">O</span>
        <div className="h-px bg-border flex-1"></div>
      </div>
      
      <GoogleSignInButton />
      
      <p className="text-muted-foreground text-center text-sm mt-2">
        ¿Ya tienes una cuenta? <Link className="text-white font-semibold hover:underline" href="/auth/login">Inicia sesión</Link>
      </p>
    </form>
  )
}

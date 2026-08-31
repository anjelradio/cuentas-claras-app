"use client"

import { FormEvent, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { loginSchema, getValidationMessage } from "@/app/auth/auth-schemas"
import { GoogleSignInButton } from "@/app/auth/components/google-sign-in-button"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getAuthErrorMessage } from "@/lib/auth-errors"
import { authClient } from "@/lib/auth-client"
import { buildJoinPath, buildLoginPath } from "@/lib/auth-redirect"

/** Inicia sesión y orienta al usuario cuando aún debe verificar su correo. */
export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, setIsPending] = useState(false)
  const [invalidFields, setInvalidFields] = useState<string[]>([])

  useEffect(() => {
    if (searchParams.get("error") === "access_denied") {
      toast.error("El acceso con Google fue cancelado o denegado.", { id: "google-access-denied" })
      router.replace(buildLoginPath(searchParams.get("redirect")))
    }
  }, [searchParams, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") })

    if (!parsed.success) {
      setInvalidFields(parsed.error.issues.map((issue) => String(issue.path[0])))
      toast.error(getValidationMessage(parsed.error))
      return
    }

    setInvalidFields([])
    setIsPending(true)
    const result = await authClient.signIn.email({ ...parsed.data, callbackURL: "/" })
    setIsPending(false)

    if (result.error) {
      const message = getAuthErrorMessage(result.error)
      toast.error(message)
      if (message.includes("todavía no está verificado")) {
        router.push("/auth/verify-email")
      }
      return
    }

    const joinPath = buildJoinPath(searchParams.get("redirect"))
    if (joinPath) {
      router.push(joinPath)
    } else {
      router.push("/home")
    }
  }

  return (
    <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FieldGroup className="flex flex-col gap-4">
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
            autoComplete="current-password" 
            aria-invalid={invalidFields.includes("password")} 
            disabled={isPending}
            className="w-full bg-[#151a30]/80 border border-border rounded-xl px-4 py-6 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-center text-lg" 
          />
        </Field>
      </FieldGroup>
      <div className="flex justify-end px-1">
        <Link className="text-muted-foreground hover:text-white text-sm transition-colors" href="/auth/forgot-password">¿Olvidaste tu contraseña?</Link>
      </div>
      
      <Button 
        type="submit" 
        className="w-full px-4 py-6 rounded-xl text-white font-semibold text-lg transition-all shadow-[0_4px_12px_rgba(255,107,26,0.3)] hover:shadow-[0_6px_16px_rgba(255,107,26,0.4)] hover:-translate-y-0.5 bg-gradient-to-br from-[#ff6b35] to-[#e65100]" 
        disabled={isPending}
      >
        {isPending ? "Ingresando…" : "Iniciar sesión"}
      </Button>

      <div className="flex items-center gap-4 w-full py-2">
        <div className="h-px bg-border flex-1"></div>
        <span className="text-muted-foreground text-sm font-medium">O</span>
        <div className="h-px bg-border flex-1"></div>
      </div>
      
      <GoogleSignInButton />
      
      <p className="text-muted-foreground text-center text-sm mt-2">
        ¿No tienes una cuenta? <Link className="text-white font-semibold hover:underline" href="/auth/register">Regístrate aquí</Link>
      </p>
    </form>
  )
}

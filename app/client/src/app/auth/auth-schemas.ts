import { z } from "zod"

const passwordRule = z
  .string()
  .min(12, "La contraseña debe tener al menos 12 caracteres.")
  .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra.")
  .regex(/\d/, "La contraseña debe incluir al menos un número.")

/** Valida los datos antes de solicitar el registro. */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Ingresa tu nombre."),
  email: z.email("Ingresa un correo válido."),
  password: passwordRule,
})

/** Valida las credenciales del inicio de sesión. */
export const loginSchema = z.object({
  email: z.email("Ingresa un correo válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
})

/** Valida la dirección de recuperación sin revelar si existe una cuenta. */
export const forgotPasswordSchema = z.object({
  email: z.email("Ingresa un correo válido."),
})

/** Valida la contraseña de reemplazo antes de enviarla a Better Auth. */
export const resetPasswordSchema = z.object({
  password: passwordRule,
})

/** Resume los errores de Zod en un solo toast accesible. */
export function getValidationMessage(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ")
}

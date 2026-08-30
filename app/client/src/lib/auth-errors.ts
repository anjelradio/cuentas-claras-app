/**
 * Traduce fallos de autenticación a mensajes seguros y accionables en español.
 * Nunca devuelve el mensaje técnico recibido por el proveedor.
 */
export function getAuthErrorMessage(error: unknown): string {
  const code = getErrorCode(error)

  if (code.includes("credential") || code.includes("invalid_email_or_password")) {
    return "No pudimos validar tus credenciales. Revisa tus datos e inténtalo otra vez."
  }

  if (code.includes("user_already_exists") || code.includes("email_already_exists")) {
    return "Ya existe una cuenta con ese correo. Puedes iniciar sesión o recuperar tu acceso."
  }

  if (code.includes("email_not_verified")) {
    return "Tu correo todavía no está verificado. Te enviamos un nuevo enlace para continuar."
  }

  if (code.includes("invalid_token") || code.includes("token_expired") || code.includes("token_used")) {
    return "El enlace ya no es válido. Solicita uno nuevo para continuar."
  }

  if (code.includes("password")) {
    return "La contraseña no cumple los requisitos indicados."
  }

  if (code.includes("oauth") || code.includes("social") || code.includes("account_not_linked")) {
    return "No pudimos completar el acceso con Google. Inténtalo nuevamente."
  }

  return "No pudimos completar la operación. Inténtalo nuevamente."
}

/** Obtiene solo un código interno seguro para clasificar un error. */
function getErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") {
    return ""
  }

  const candidate = error as { code?: unknown; message?: unknown; statusText?: unknown }
  return [candidate.code, candidate.message, candidate.statusText]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()
}

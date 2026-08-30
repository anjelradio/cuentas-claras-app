import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/lib/auth"

/** Expone exclusivamente los endpoints estándar de Better Auth y JWT/JWKS. */
export const { GET, POST } = toNextJsHandler(auth)

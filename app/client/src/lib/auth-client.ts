"use client"

import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

/** Cliente React de Better Auth; los JWT solo se solicitan bajo demanda. */
export const authClient = createAuthClient({
  plugins: [jwtClient()],
})

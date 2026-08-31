"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { QuickActionButton } from "@/components/custom/quick-action-button"

export function CreateEventButton() {
  const router = useRouter()
  return (
    <QuickActionButton
      icon={Plus}
      title="Crear evento"
      description="Organiza un nuevo gasto compartido"
      variant="primary-blue"
      onClick={() => router.push('/create-event')}
    />
  )
}

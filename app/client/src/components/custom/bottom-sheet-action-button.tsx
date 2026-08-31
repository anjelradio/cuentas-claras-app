import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const bottomSheetActionVariants = cva(
  "group w-full rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        blue: "border-primary/40 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
        purple: "border-tertiary/40 bg-gradient-to-br from-tertiary to-tertiary/70 text-headline shadow-lg shadow-tertiary/30 hover:shadow-xl hover:shadow-tertiary/40",
        orange: "border-action-orange/40 bg-gradient-to-br from-action-orange to-action-orange/70 text-action-orange-foreground shadow-lg shadow-action-orange/30 hover:shadow-xl hover:shadow-action-orange/40",
      },
      layout: {
        inline: "flex min-h-[120px] items-center gap-4",
        stacked: "flex min-h-[180px] flex-col items-start gap-4",
      },
    },
    defaultVariants: {
      variant: "blue",
      layout: "inline",
    },
  },
)

const iconVariants = cva(
  "flex size-12 shrink-0 items-center justify-center rounded-full border backdrop-blur-sm",
  {
    variants: {
      variant: {
        blue: "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground",
        purple: "border-headline/20 bg-headline/15 text-headline",
        orange: "border-action-orange-foreground/20 bg-action-orange-foreground/15 text-action-orange-foreground",
      },
    },
    defaultVariants: { variant: "blue" },
  },
)

const descriptionVariants = cva("text-sm leading-tight", {
  variants: {
    variant: {
      blue: "text-primary-foreground/80",
      purple: "text-headline/80",
      orange: "text-action-orange-foreground/80",
    },
  },
  defaultVariants: { variant: "blue" },
})

export interface BottomSheetActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof bottomSheetActionVariants> {
  icon: LucideIcon
  title: string
  description: string
}

/**
 * Acción reutilizable para sheets: presenta variantes cromáticas y dos
 * disposiciones sin duplicar la composición de icono, contenido y flecha.
 */
const BottomSheetActionButton = React.forwardRef<HTMLButtonElement, BottomSheetActionButtonProps>(
  ({ className, variant, layout, icon: Icon, title, description, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="bottom-sheet-action-button"
      data-layout={layout ?? "inline"}
      className={cn(bottomSheetActionVariants({ variant, layout, className }))}
      {...props}
    >
      <span className={cn(iconVariants({ variant }))}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span className={cn("flex min-w-0 flex-1 flex-col", layout === "stacked" ? "mt-auto" : "") }>
        <span className="text-lg font-semibold leading-tight">{title}</span>
        <span className={cn("mt-1", descriptionVariants({ variant }))}>{description}</span>
      </span>
      {layout !== "stacked" && <ChevronRight className="size-5 shrink-0 opacity-60 transition-transform group-hover:translate-x-1" aria-hidden="true" />}
    </button>
  ),
)

BottomSheetActionButton.displayName = "BottomSheetActionButton"

export { BottomSheetActionButton, bottomSheetActionVariants }

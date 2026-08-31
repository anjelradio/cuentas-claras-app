import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronRight, LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const quickActionVariants = cva(
  "rounded-2xl p-6 text-left gap-4 h-full group transition-all duration-300 w-full cursor-pointer relative overflow-hidden border",
  {
    variants: {
      layout: {
        vertical: "flex flex-col justify-between min-h-[180px]",
        horizontal: "flex items-center min-h-[140px]",
      },
      variant: {
        "primary-blue":
          "bg-gradient-to-br from-primary to-primary/70 border-primary/40 shadow-lg shadow-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/40",
        "primary-orange":
          "bg-gradient-to-br from-action-orange to-action-orange/70 border-action-orange/40 shadow-lg shadow-action-orange/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-action-orange/40",
        "primary-purple":
          "bg-gradient-to-br from-tertiary to-tertiary/70 border-tertiary/40 shadow-lg shadow-tertiary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-tertiary/40",
        "secondary-purple":
          "bg-surface border-border shadow-sm hover:bg-tertiary/10 hover:border-tertiary/30",
        "secondary-green":
          "bg-surface border-border shadow-sm hover:bg-success/10 hover:border-success/30",
      },
    },
    defaultVariants: {
      layout: "vertical",
      variant: "primary-blue",
    },
  }
)

const iconBgVariants = cva(
  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
  {
    variants: {
      variant: {
        "primary-blue": "bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/20",
        "primary-orange": "bg-action-orange-foreground/15 text-action-orange-foreground border border-action-orange-foreground/20",
        "primary-purple": "bg-headline/15 text-headline border border-headline/20",
        "secondary-purple": "bg-tertiary/10 text-tertiary",
        "secondary-green": "bg-success/10 text-success",
      },
    },
    defaultVariants: {
      variant: "primary-blue",
    },
  }
)

const titleVariants = cva(
  "font-semibold text-sm sm:text-lg mb-0.5 sm:mb-1 transition-colors leading-tight sm:leading-normal",
  {
    variants: {
      variant: {
        "primary-blue": "text-primary-foreground",
        "primary-orange": "text-action-orange-foreground",
        "primary-purple": "text-headline",
        "secondary-purple": "text-headline",
        "secondary-green": "text-headline",
      },
    },
    defaultVariants: { variant: "primary-blue" },
  },
)

const descriptionVariants = cva("text-xs sm:text-sm leading-snug sm:leading-tight", {
  variants: {
    variant: {
      "primary-blue": "text-primary-foreground/80",
      "primary-orange": "text-action-orange-foreground/80",
      "primary-purple": "text-headline/80",
      "secondary-purple": "text-muted-foreground",
      "secondary-green": "text-muted-foreground",
    },
  },
  defaultVariants: { variant: "primary-blue" },
})

export interface QuickActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof quickActionVariants> {
  icon: LucideIcon
  title: string
  description: string
  layout?: "vertical" | "horizontal"
}

const QuickActionButton = React.forwardRef<HTMLButtonElement, QuickActionButtonProps>(
  ({ className, variant, layout, icon: Icon, title, description, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(quickActionVariants({ variant, layout, className }))}
        {...props}
      >
        <div className={cn(iconBgVariants({ variant }))}>
          <Icon className="size-5 sm:size-6" strokeWidth={2} />
        </div>
        <div className={cn("flex flex-col justify-end", layout === "horizontal" ? "flex-1" : "mt-auto")}>
          <h4 className={cn(titleVariants({ variant }))}>{title}</h4>
          <p className={cn(descriptionVariants({ variant }))}>{description}</p>
        </div>
        {layout === "horizontal" && <ChevronRight className={cn("size-5 shrink-0 transition-transform group-hover:translate-x-1", variant === "primary-orange" ? "text-action-orange-foreground/60" : "text-primary-foreground/60")} aria-hidden="true" />}
      </button>
    )
  }
)
QuickActionButton.displayName = "QuickActionButton"

export { QuickActionButton, quickActionVariants }

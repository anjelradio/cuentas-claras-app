"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#151a30]/50 group-[.toaster]:backdrop-blur-[20px] group-[.toaster]:border group-[.toaster]:border-white/5 group-[.toaster]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.2)] group-[.toaster]:text-white font-sans rounded-2xl p-5 flex gap-4 items-center w-full transition-all",
          description: "group-[.toast]:text-white/60 text-sm",
          title: "text-[15px] font-medium text-white tracking-wide",
          error: "group-[.toaster]:!border-[#ff4d4d]/40 group-[.toaster]:!shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_40px_rgba(255,77,77,0.2)] [&_[data-icon]]:text-[#ff4d4d]",
          success: "group-[.toaster]:!border-[#1ee370]/40 group-[.toaster]:!shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_40px_rgba(30,227,112,0.2)] [&_[data-icon]]:text-[#1ee370]",
          warning: "group-[.toaster]:!border-[#ff6b1a]/40 group-[.toaster]:!shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_40px_rgba(255,107,26,0.2)] [&_[data-icon]]:text-[#ff6b1a]",
          info: "group-[.toaster]:!border-[#3d3bff]/40 group-[.toaster]:!shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_40px_rgba(61,59,255,0.2)] [&_[data-icon]]:text-[#3d3bff]",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium rounded-lg",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white font-medium rounded-lg",
          closeButton: "group-[.toast]:bg-white/5 group-[.toast]:text-white/60 group-[.toast]:border-white/10 hover:group-[.toast]:bg-white/10 hover:group-[.toast]:text-white transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

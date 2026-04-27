"use client"

import type { CSSProperties } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={false}
      expand
      position="top-right"
      visibleToasts={4}
      icons={{
        success: (
          <CircleCheckIcon className="size-5" />
        ),
        info: (
          <InfoIcon className="size-5" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5" />
        ),
        error: (
          <OctagonXIcon className="size-5" />
        ),
        loading: (
          <Loader2Icon className="size-5 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "1rem",
        } as CSSProperties
      }
      toastOptions={{
        duration: 4500,
        classNames: {
          toast:
            "flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-950 shadow-xl shadow-slate-950/10",
          content: "min-w-0 flex-1",
          title: "text-sm font-semibold leading-5 text-slate-950",
          description: "mt-1 text-sm leading-5 text-slate-600",
          icon: "mt-0.5 flex size-5 shrink-0 items-center justify-center",
          closeButton:
            "border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-900",
          success: "border-emerald-200 bg-white text-emerald-950",
          error: "border-red-200 bg-white text-red-950",
          info: "border-sky-200 bg-white text-sky-950",
          warning: "border-amber-200 bg-white text-amber-950",
          loading: "border-slate-200 bg-white text-slate-950",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

import type { ComponentProps } from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type LoadingSpinnerProps = ComponentProps<typeof Loader2> & {
  label?: string
}

function LoadingSpinner({
  className,
  label = "Loading",
  ...props
}: LoadingSpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { LoadingSpinner }

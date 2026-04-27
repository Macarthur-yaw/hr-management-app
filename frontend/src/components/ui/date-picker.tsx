import * as React from "react"
import { CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

const DatePicker = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => (
  <div className={cn("relative", className)}>
    <Input
      ref={ref}
      type="date"
      className="w-full rounded-2xl border border-transparent bg-slate-100 pr-10 text-sm text-slate-950 shadow-sm focus:border-[#049FA7] focus:ring-2 focus:ring-[#049FA7]/20"
      {...props}
    />
    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
))

DatePicker.displayName = "DatePicker"

export { DatePicker }

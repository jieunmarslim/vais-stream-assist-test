import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        <select
          ref={ref}
          className={cn(
            "flex h-8 w-full appearance-none rounded-md border border-input bg-background px-2.5 py-1 pr-7 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 opacity-50" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }

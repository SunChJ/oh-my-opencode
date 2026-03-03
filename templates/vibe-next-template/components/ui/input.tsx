import * as React from "react"
import { cn } from '@/utils/cn'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          // Focus states with modern glow
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus-visible:border-primary/50",
          // Dark mode enhancements
          "dark:bg-secondary/30 dark:border-white/[0.08]",
          "dark:focus-visible:border-white/20 dark:focus-visible:ring-white/20",
          "dark:focus-visible:shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]",
          // Transitions
          "transition-all duration-200 ease-out",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

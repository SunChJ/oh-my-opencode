/* eslint-disable @typescript-eslint/no-empty-object-type */
import * as React from "react"
import { cn } from "@/utils/cn"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background",
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
Textarea.displayName = "Textarea"

export { Textarea }

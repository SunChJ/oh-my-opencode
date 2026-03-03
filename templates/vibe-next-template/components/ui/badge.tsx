import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from '@/utils/cn'

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
    "transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-transparent bg-primary text-primary-foreground",
          "hover:bg-primary/80",
        ],
        secondary: [
          "border-transparent bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
        ],
        destructive: [
          "border-transparent bg-destructive text-white",
          "hover:bg-destructive/80",
        ],
        outline: [
          "text-foreground",
          "dark:border-white/[0.15]",
        ],
        // Modern tech style variants
        ghost: [
          "border-transparent bg-muted text-muted-foreground",
          "hover:bg-muted/80",
        ],
        glow: [
          "border-transparent bg-primary/10 text-primary",
          "dark:bg-primary/20 dark:text-primary-foreground",
          "dark:shadow-[0_0_10px_-3px_rgba(255,255,255,0.1)]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

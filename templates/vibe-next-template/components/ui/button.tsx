import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/utils/cn"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Modern animations
    "transition-all duration-200 ease-out",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90 hover:shadow-md",
          "dark:hover:shadow-lg dark:hover:shadow-primary/5",
        ],
        destructive: [
          "bg-destructive text-white",
          "hover:bg-destructive/90 hover:shadow-md",
        ],
        outline: [
          "border border-input bg-background",
          "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
          "dark:hover:bg-accent/50",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 hover:shadow-sm",
        ],
        ghost: [
          "hover:bg-accent hover:text-accent-foreground",
          "dark:hover:bg-accent/50",
        ],
        link: [
          "text-primary underline-offset-4",
          "hover:underline",
        ],
        // Modern tech style variants
        glow: [
          "bg-primary text-primary-foreground",
          "hover:shadow-lg hover:shadow-primary/25",
          "dark:hover:shadow-primary/10",
        ],
        gradient: [
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
          "hover:from-primary/90 hover:to-primary/70 hover:shadow-md",
        ],
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

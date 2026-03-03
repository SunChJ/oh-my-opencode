import { cn } from "@/utils/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        "dark:bg-white/[0.08]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

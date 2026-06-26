import { cn } from "../../utils.js"

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-border bg-transparent hover:bg-secondary text-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
}

const sizes = {
  default: "h-10 px-4 py-2",
  lg: "h-14 px-8 text-lg",
}

export function Button({ children, className, variant = "default", size = "default", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

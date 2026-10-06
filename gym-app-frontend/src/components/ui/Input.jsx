import { cn } from "../../utils.js"

export function Input({ label, error, className, id, ...props }) {
  return (
    <label className="block" htmlFor={id}>
      {label && <span className="mb-2 block text-sm font-semibold">{label}</span>}
      <input
        id={id}
        className={cn(
          "h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className,
        )}
        {...props}
      />
      {error && <span className="mt-1.5 block text-xs text-red-300">{error}</span>}
    </label>
  )
}

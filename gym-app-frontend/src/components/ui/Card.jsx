import { cn } from "../../utils.js"

export function Card({ children, className, ...props }) {
  return (
    <section className={cn("rounded-lg border border-border bg-card p-5", className)} {...props}>
      {children}
    </section>
  )
}

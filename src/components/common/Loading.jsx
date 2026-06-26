export function Loading({ label = "Đang tải..." }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label}
    </div>
  )
}

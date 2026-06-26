import { AlertCircle } from "lucide-react"

export function ErrorMessage({ message }) {
  if (!message) return null

  return (
    <div role="alert" className="flex items-start gap-3 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      {message}
    </div>
  )
}

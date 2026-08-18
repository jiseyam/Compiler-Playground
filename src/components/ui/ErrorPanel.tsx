import { AlertTriangle } from 'lucide-react'

export default function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-coral/30 bg-coral-soft px-4 py-3 text-sm text-coral">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <span className="whitespace-pre-wrap">{message}</span>
    </div>
  )
}

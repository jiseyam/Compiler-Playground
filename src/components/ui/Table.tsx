import type { ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface text-text-muted text-xs uppercase tracking-wide">{children}</thead>
}

export function TRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={`border-t border-border ${className}`}>{children}</tr>
}

export function TH({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <th className={`text-left font-medium px-3 py-2.5 ${className}`}>{children}</th>
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top font-mono text-[13px] ${className}`}>{children}</td>
}

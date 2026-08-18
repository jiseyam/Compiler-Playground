import type { ReactNode } from 'react'

export default function SplitPane({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
      <div className="border-b lg:border-b-0 lg:border-r border-border p-5 overflow-y-auto">{left}</div>
      <div className="p-5 overflow-y-auto bg-bg-alt/40">{right}</div>
    </div>
  )
}

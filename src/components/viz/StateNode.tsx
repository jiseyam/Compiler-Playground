import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface StateNodeData {
  label: string
  accepting?: boolean
  start?: boolean
  [key: string]: unknown
}

export default function StateNode({ data }: NodeProps) {
  const d = data as StateNodeData
  return (
    <div className="relative flex items-center justify-center">
      {d.start && (
        <span className="absolute -left-6 text-text-dim text-xs select-none" aria-hidden>
          →
        </span>
      )}
      <div
        className={`flex items-center justify-center rounded-full border-2 font-mono text-xs px-1 ${
          d.accepting ? 'border-teal text-teal shadow-[0_0_0_3px_rgba(76,224,210,0.15)]' : 'border-accent text-accent'
        }`}
        style={{ width: 52, height: 52 }}
      >
        {d.accepting && (
          <div className="absolute rounded-full border border-teal/60" style={{ width: 42, height: 42 }} />
        )}
        <span className="relative bg-bg-alt rounded-full w-full h-full flex items-center justify-center">
          {d.label}
        </span>
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    </div>
  )
}

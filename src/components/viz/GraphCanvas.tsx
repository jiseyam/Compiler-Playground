import { useMemo } from 'react'
import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import StateNode from './StateNode'
import { layeredLayout } from '@/lib/graphLayout'

export interface GraphState {
  id: string
  label: string
  accepting: boolean
}

export interface GraphEdge {
  source: string
  target: string
  label: string
}

const nodeTypes = { state: StateNode }

export default function GraphCanvas({
  states,
  edges,
  start,
  height = 320,
}: {
  states: GraphState[]
  edges: GraphEdge[]
  start: string
  height?: number
}) {
  const nodes: Node[] = useMemo(() => {
    const positions = layeredLayout(
      states.map((s) => s.id),
      start,
      edges.map((e) => ({ source: e.source, target: e.target })),
    )
    return states.map((s) => ({
      id: s.id,
      type: 'state',
      position: positions[s.id],
      data: { label: s.label, accepting: s.accepting, start: s.id === start },
      draggable: true,
    }))
  }, [states, edges, start])

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((e, i) => ({
        id: `${e.source}-${e.target}-${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-text-muted)' },
        style: { stroke: 'var(--color-border-hover)' },
        labelStyle: { fill: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontSize: 11 },
        labelBgStyle: { fill: 'var(--color-surface)' },
      })),
    [edges],
  )

  return (
    <div style={{ height }} className="rounded-xl border border-border overflow-hidden bg-bg-alt">
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Background color="var(--color-border)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}

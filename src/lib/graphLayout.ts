export interface LayoutEdge {
  source: string
  target: string
}

/** Simple BFS-layered layout: x = distance from start, y = rank within that layer. */
export function layeredLayout(
  stateIds: string[],
  start: string,
  edges: LayoutEdge[],
): Record<string, { x: number; y: number }> {
  const layer = new Map<string, number>()
  layer.set(start, 0)
  const queue = [start]
  while (queue.length) {
    const s = queue.shift()!
    const d = layer.get(s)!
    for (const e of edges) {
      if (e.source === s && !layer.has(e.target)) {
        layer.set(e.target, d + 1)
        queue.push(e.target)
      }
    }
  }
  let maxLayer = 0
  for (const s of stateIds) {
    if (!layer.has(s)) layer.set(s, 0)
    maxLayer = Math.max(maxLayer, layer.get(s)!)
  }

  const perLayerCount = new Map<number, number>()
  const positions: Record<string, { x: number; y: number }> = {}
  for (const s of stateIds) {
    const l = layer.get(s)!
    const rank = perLayerCount.get(l) ?? 0
    perLayerCount.set(l, rank + 1)
    positions[s] = { x: l * 190 + 40, y: rank * 110 + 40 }
  }
  return positions
}

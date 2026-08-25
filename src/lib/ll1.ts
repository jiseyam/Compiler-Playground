import {
  EPSILON,
  END_MARKER,
  isNonTerminal,
  productionToString,
  type Grammar,
  type Production,
} from './grammar'
import { firstOfString, type SymbolSetMap } from './firstFollowLeading'

export interface Ll1Conflict {
  nonTerminal: string
  terminal: string
  productions: Production[]
}

export interface Ll1Table {
  rows: string[]
  cols: string[]
  cells: Map<string, Map<string, Production[]>>
  conflicts: Ll1Conflict[]
}

export function buildLl1Table(grammar: Grammar, first: SymbolSetMap, follow: SymbolSetMap): Ll1Table {
  const cells = new Map<string, Map<string, Production[]>>()
  for (const nt of grammar.nonTerminals) cells.set(nt, new Map())

  const addCell = (nt: string, terminal: string, prod: Production) => {
    const row = cells.get(nt)!
    if (!row.has(terminal)) row.set(terminal, [])
    row.get(terminal)!.push(prod)
  }

  for (const p of grammar.productions) {
    const alphaFirst = firstOfString(grammar, p.rhs, first)

    for (const a of alphaFirst) {
      if (a === EPSILON) continue
      addCell(p.lhs, a, p)
    }

    if (alphaFirst.has(EPSILON)) {
      const followEntries = follow.get(p.lhs) ?? []
      for (const e of followEntries) {
        addCell(p.lhs, e.symbol, p)
      }
    }
  }

  const conflicts: Ll1Conflict[] = []
  for (const nt of grammar.nonTerminals) {
    for (const [terminal, prods] of cells.get(nt)!) {
      if (prods.length > 1) {
        conflicts.push({ nonTerminal: nt, terminal, productions: prods })
      }
    }
  }

  return {
    rows: grammar.nonTerminals,
    cols: [...grammar.terminals, END_MARKER],
    cells,
    conflicts,
  }
}

export type ParseAction =
  | { kind: 'match'; symbol: string }
  | { kind: 'apply'; production: Production }
  | { kind: 'accept' }
  | { kind: 'error'; message: string }

export interface ParseStep {
  index: number
  stack: string[] // top of stack is last element
  input: string[] // remaining input, including trailing $
  action: ParseAction
}

export interface ParseResult {
  accepted: boolean
  steps: ParseStep[]
  error?: string
}

const MAX_STEPS = 500

export function tokenizeInput(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean)
}

export function runPredictiveParse(grammar: Grammar, table: Ll1Table, inputTokens: string[]): ParseResult {
  const stack: string[] = [END_MARKER, grammar.start]
  const input: string[] = [...inputTokens, END_MARKER]
  const steps: ParseStep[] = []
  let ip = 0

  while (true) {
    if (steps.length >= MAX_STEPS) {
      return { accepted: false, steps, error: 'Parse aborted after 500 steps (possible non-terminating grammar).' }
    }

    const top = stack[stack.length - 1]
    const current = input[ip]

    if (top === END_MARKER && current === END_MARKER) {
      steps.push({ index: steps.length, stack: [...stack], input: input.slice(ip), action: { kind: 'accept' } })
      return { accepted: true, steps }
    }

    if (!isNonTerminal(grammar, top)) {
      if (top === current) {
        steps.push({
          index: steps.length,
          stack: [...stack],
          input: input.slice(ip),
          action: { kind: 'match', symbol: top },
        })
        stack.pop()
        ip++
        continue
      }
      const message = `Terminal mismatch: stack top "${top}" does not match input "${current}".`
      steps.push({ index: steps.length, stack: [...stack], input: input.slice(ip), action: { kind: 'error', message } })
      return { accepted: false, steps, error: message }
    }

    // top is a non-terminal — consult the table
    const entry = table.cells.get(top)?.get(current)
    if (!entry || entry.length === 0) {
      const message = `No rule for M[${top}, ${current}] — "${current}" is unexpected here.`
      steps.push({ index: steps.length, stack: [...stack], input: input.slice(ip), action: { kind: 'error', message } })
      return { accepted: false, steps, error: message }
    }

    const production = entry[0]
    steps.push({
      index: steps.length,
      stack: [...stack],
      input: input.slice(ip),
      action: { kind: 'apply', production },
    })
    stack.pop()
    if (!(production.rhs.length === 1 && production.rhs[0] === EPSILON)) {
      for (let i = production.rhs.length - 1; i >= 0; i--) {
        stack.push(production.rhs[i])
      }
    }
  }
}

export interface ParseTreeNode {
  symbol: string
  children: ParseTreeNode[]
}

/** Reconstructs the parse tree by replaying the parser's own stack discipline with tree nodes instead of bare symbols. */
export function buildParseTree(grammar: Grammar, steps: ParseStep[]): ParseTreeNode {
  const root: ParseTreeNode = { symbol: grammar.start, children: [] }
  const stack: ParseTreeNode[] = [root]

  for (const step of steps) {
    if (step.action.kind === 'apply') {
      const node = stack.pop()
      if (!node) continue
      const { production } = step.action
      const isEpsilon = production.rhs.length === 1 && production.rhs[0] === EPSILON
      const children: ParseTreeNode[] = isEpsilon
        ? [{ symbol: EPSILON, children: [] }]
        : production.rhs.map((s) => ({ symbol: s, children: [] }))
      node.children = children
      if (!isEpsilon) {
        for (let i = children.length - 1; i >= 0; i--) stack.push(children[i])
      }
    } else if (step.action.kind === 'match') {
      stack.pop()
    }
  }

  return root
}

interface PositionedNode {
  node: ParseTreeNode
  depth: number
  x: number
}

function assignTreePositions(node: ParseTreeNode, depth: number, nextLeafX: { value: number }, out: PositionedNode[]): number {
  if (node.children.length === 0) {
    const x = nextLeafX.value++
    out.push({ node, depth, x })
    return x
  }
  const childXs = node.children.map((c) => assignTreePositions(c, depth + 1, nextLeafX, out))
  const x = childXs.reduce((a, b) => a + b, 0) / childXs.length
  out.push({ node, depth, x })
  return x
}

/**
 * Centered textbook-style parse tree: every node at the same depth shares a
 * row, with a /, |, \ connector row between each pair of levels pointing
 * down toward each child's column.
 */
export function renderParseTreeCentered(root: ParseTreeNode): string[] {
  const positions: PositionedNode[] = []
  assignTreePositions(root, 0, { value: 0 }, positions)

  const maxDepth = Math.max(...positions.map((p) => p.depth))
  const byDepth: PositionedNode[][] = Array.from({ length: maxDepth + 1 }, () => [])
  for (const p of positions) byDepth[p.depth].push(p)
  for (const level of byDepth) level.sort((a, b) => a.x - b.x)

  const labelWidth = Math.max(...positions.map((p) => p.node.symbol.length), 1)
  const colWidth = labelWidth + 2
  const margin = Math.ceil(labelWidth / 2) + 1
  const col = (x: number) => Math.round(x * colWidth) + margin

  const lineWidth = Math.max(...positions.map((p) => col(p.x) + labelWidth)) + 1
  const blankLine = () => new Array<string>(lineWidth).fill(' ')

  const lines: string[] = []

  for (let depth = 0; depth <= maxDepth; depth++) {
    const row = blankLine()
    for (const p of byDepth[depth]) {
      const c = col(p.x)
      const start = Math.max(0, c - Math.floor(p.node.symbol.length / 2))
      for (let i = 0; i < p.node.symbol.length && start + i < row.length; i++) {
        row[start + i] = p.node.symbol[i]
      }
    }
    lines.push(row.join('').replace(/\s+$/, ''))

    if (depth === maxDepth) break

    const connectorRow = blankLine()
    for (const p of byDepth[depth]) {
      const parentCol = col(p.x)
      for (const child of p.node.children) {
        const childPos = positions.find((q) => q.node === child)!
        const c = col(childPos.x)
        connectorRow[c] = c < parentCol ? '/' : c > parentCol ? '\\' : '|'
      }
    }
    lines.push(connectorRow.join('').replace(/\s+$/, ''))
  }

  return lines
}

/**
 * One sentential form per production applied, in leftmost-derivation order.
 * At each 'apply' step, the next step's stack (top-to-bottom, excluding the
 * bottom $) is exactly the still-to-derive suffix; prepending the input
 * tokens already matched gives the full sentential form.
 */
export function leftmostDerivationLines(inputTokens: string[], steps: ParseStep[]): string[] {
  const lines: string[] = []
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    if (step.action.kind !== 'apply') continue
    const next = steps[i + 1]
    if (!next) continue
    const matchedCount = inputTokens.length - (step.input.length - 1)
    const matchedPrefix = inputTokens.slice(0, matchedCount)
    const remaining = [...next.stack].slice(1).reverse()
    lines.push([...matchedPrefix, ...remaining].join(' ') || EPSILON)
  }
  return lines
}

export { productionToString }

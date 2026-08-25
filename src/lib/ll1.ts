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

/** ASCII outline (no box-drawing Unicode) so it renders correctly in a PDF's built-in fonts. */
export function renderParseTreeLines(node: ParseTreeNode): string[] {
  const lines: string[] = [node.symbol]
  const walk = (n: ParseTreeNode, prefix: string) => {
    n.children.forEach((child, i) => {
      const isLast = i === n.children.length - 1
      lines.push(prefix + (isLast ? '`-- ' : '+-- ') + child.symbol)
      walk(child, prefix + (isLast ? '    ' : '|   '))
    })
  }
  walk(node, '')
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

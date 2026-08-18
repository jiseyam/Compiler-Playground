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

export { productionToString }

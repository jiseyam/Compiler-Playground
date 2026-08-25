export const EPSILON = 'ε'
export const END_MARKER = '$'

const EPSILON_ALIASES = new Set(['#', 'ε', 'eps', 'epsilon', "''", '""'])

export interface Production {
  id: number
  lhs: string
  rhs: string[]
}

export interface Grammar {
  start: string
  nonTerminals: string[]
  terminals: string[]
  productions: Production[]
  byLhs: Map<string, Production[]>
}

export class GrammarError extends Error {
  line?: number
  constructor(message: string, line?: number) {
    super(message)
    this.line = line
  }
}

function normalizeSymbol(sym: string): string {
  return EPSILON_ALIASES.has(sym.toLowerCase()) ? EPSILON : sym
}

function looksLikeNonTerminal(sym: string): boolean {
  return /^[A-Z]/.test(sym)
}

export function parseGrammar(source: string): Grammar {
  const lines = source
    .split('\n')
    .map((l, idx) => ({ text: l.trim(), lineNo: idx + 1 }))
    .filter((l) => l.text.length > 0 && !l.text.startsWith('//'))

  if (lines.length === 0) {
    throw new GrammarError('Grammar is empty. Add at least one production, e.g. "E -> T E\'".')
  }

  const rawRules: { lhs: string; alt: string[]; lineNo: number }[] = []
  const nonTerminals: string[] = []
  const nonTerminalSet = new Set<string>()

  for (const { text, lineNo } of lines) {
    const arrowMatch = text.match(/->|→|::=/)
    if (!arrowMatch) {
      throw new GrammarError(
        `Line ${lineNo}: missing "->". Expected format "A -> alpha | beta".`,
        lineNo,
      )
    }
    const arrowIndex = arrowMatch.index!
    const lhs = text.slice(0, arrowIndex).trim()
    const rhsText = text.slice(arrowIndex + arrowMatch[0].length).trim()

    if (!lhs) {
      throw new GrammarError(`Line ${lineNo}: production is missing a left-hand side.`, lineNo)
    }
    if (/\s/.test(lhs)) {
      throw new GrammarError(
        `Line ${lineNo}: left-hand side "${lhs}" must be a single symbol.`,
        lineNo,
      )
    }
    if (!rhsText) {
      throw new GrammarError(`Line ${lineNo}: production for "${lhs}" has an empty right-hand side.`, lineNo)
    }

    if (!nonTerminalSet.has(lhs)) {
      nonTerminalSet.add(lhs)
      nonTerminals.push(lhs)
    }

    const alternatives = rhsText.split('|').map((alt) => alt.trim())
    for (const alt of alternatives) {
      if (!alt) {
        throw new GrammarError(`Line ${lineNo}: empty alternative in production for "${lhs}".`, lineNo)
      }
      const symbols = alt.split(/\s+/).map(normalizeSymbol)
      rawRules.push({ lhs, alt: symbols, lineNo })
    }
  }

  // Second pass: classify terminals vs non-terminals, validate references.
  const terminalSet = new Set<string>()
  for (const rule of rawRules) {
    for (const sym of rule.alt) {
      if (sym === EPSILON) continue
      if (!nonTerminalSet.has(sym)) {
        if (looksLikeNonTerminal(sym)) {
          throw new GrammarError(
            `Line ${rule.lineNo}: "${sym}" looks like a non-terminal (capitalized) but has no production defined for it.`,
            rule.lineNo,
          )
        }
        terminalSet.add(sym)
      }
    }
  }

  const productions: Production[] = rawRules.map((rule, idx) => ({
    id: idx + 1,
    lhs: rule.lhs,
    rhs: rule.alt,
  }))

  const byLhs = new Map<string, Production[]>()
  for (const p of productions) {
    if (!byLhs.has(p.lhs)) byLhs.set(p.lhs, [])
    byLhs.get(p.lhs)!.push(p)
  }

  return {
    start: nonTerminals[0],
    nonTerminals,
    terminals: Array.from(terminalSet).sort(),
    productions,
    byLhs,
  }
}

export function isNonTerminal(grammar: Grammar, sym: string): boolean {
  return grammar.byLhs.has(sym)
}

export function productionToString(p: Production): string {
  return `${p.lhs} -> ${p.rhs.join(' ')}`
}

/** One entry per non-terminal, with all of its alternatives joined by " | " (e.g. "S' -> ; A S' | ε"). */
export function productionsGroupedByLhs(grammar: Grammar): { lhs: string; text: string }[] {
  return grammar.nonTerminals.map((lhs) => {
    const alts = (grammar.byLhs.get(lhs) ?? []).map((p) => p.rhs.join(' '))
    return { lhs, text: `${lhs} -> ${alts.join(' | ')}` }
  })
}

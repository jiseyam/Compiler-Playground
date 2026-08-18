import { EPSILON, END_MARKER, isNonTerminal, productionToString, type Grammar, type Production } from './grammar'

export interface SetEntry {
  symbol: string
  reasons: string[]
}

export type SymbolSetMap = Map<string, SetEntry[]>

function addSymbol(map: Map<string, Map<string, Set<string>>>, key: string, symbol: string, reason: string): boolean {
  if (!map.has(key)) map.set(key, new Map())
  const symbolMap = map.get(key)!
  if (!symbolMap.has(symbol)) symbolMap.set(symbol, new Set())
  const reasons = symbolMap.get(symbol)!
  const before = reasons.size
  reasons.add(reason)
  return reasons.size > before || before === 0
}

function toSymbolSetMap(raw: Map<string, Map<string, Set<string>>>, keys: string[]): SymbolSetMap {
  const result: SymbolSetMap = new Map()
  for (const key of keys) {
    const symbolMap = raw.get(key) ?? new Map<string, Set<string>>()
    const entries: SetEntry[] = Array.from(symbolMap.entries())
      .map(([symbol, reasons]) => ({ symbol, reasons: Array.from(reasons) }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
    result.set(key, entries)
  }
  return result
}

/** FIRST of a sequence of symbols, using already-computed FIRST sets for non-terminals. */
function firstOfSequence(
  grammar: Grammar,
  seq: string[],
  firstRaw: Map<string, Map<string, Set<string>>>,
): Set<string> {
  const result = new Set<string>()
  let allNullable = true

  for (const sym of seq) {
    if (sym === EPSILON) continue
    if (!isNonTerminal(grammar, sym)) {
      result.add(sym)
      allNullable = false
      break
    }
    const symFirst = firstRaw.get(sym) ?? new Map()
    for (const s of symFirst.keys()) {
      if (s !== EPSILON) result.add(s)
    }
    if (!symFirst.has(EPSILON)) {
      allNullable = false
      break
    }
  }

  if (allNullable) result.add(EPSILON)
  return result
}

export function computeFirst(grammar: Grammar): SymbolSetMap {
  const raw = new Map<string, Map<string, Set<string>>>()
  let changed = true

  while (changed) {
    changed = false
    for (const p of grammar.productions) {
      const ruleStr = productionToString(p)
      if (p.rhs.length === 1 && p.rhs[0] === EPSILON) {
        if (addSymbol(raw, p.lhs, EPSILON, `${ruleStr}: epsilon production adds ε directly`)) changed = true
        continue
      }

      let allNullableSoFar = true
      for (let i = 0; i < p.rhs.length; i++) {
        const sym = p.rhs[i]
        if (!isNonTerminal(grammar, sym)) {
          if (addSymbol(raw, p.lhs, sym, `${ruleStr}: "${sym}" is a terminal reached at position ${i + 1}`)) {
            changed = true
          }
          allNullableSoFar = false
          break
        }
        const symFirst = raw.get(sym) ?? new Map()
        for (const s of symFirst.keys()) {
          if (s === EPSILON) continue
          if (addSymbol(raw, p.lhs, s, `${ruleStr}: FIRST(${sym}) contributes "${s}"`)) changed = true
        }
        if (!symFirst.has(EPSILON)) {
          allNullableSoFar = false
          break
        }
      }
      if (allNullableSoFar) {
        if (addSymbol(raw, p.lhs, EPSILON, `${ruleStr}: every symbol on the right can derive ε`)) changed = true
      }
    }
  }

  return toSymbolSetMap(raw, grammar.nonTerminals)
}

export function computeFollow(grammar: Grammar, first: SymbolSetMap): SymbolSetMap {
  const firstRaw = new Map<string, Map<string, Set<string>>>()
  for (const [nt, entries] of first) {
    firstRaw.set(nt, new Map(entries.map((e) => [e.symbol, new Set(e.reasons)])))
  }

  const raw = new Map<string, Map<string, Set<string>>>()
  addSymbol(raw, grammar.start, END_MARKER, `${END_MARKER} is added to FOLLOW(${grammar.start}) as the start symbol`)

  let changed = true
  while (changed) {
    changed = false
    for (const p of grammar.productions) {
      const ruleStr = productionToString(p)
      for (let i = 0; i < p.rhs.length; i++) {
        const sym = p.rhs[i]
        if (sym === EPSILON || !isNonTerminal(grammar, sym)) continue

        const beta = p.rhs.slice(i + 1)
        const betaFirst = firstOfSequence(grammar, beta, firstRaw)

        for (const s of betaFirst) {
          if (s === EPSILON) continue
          if (addSymbol(raw, sym, s, `${ruleStr}: FIRST(β) contributes "${s}" (β follows ${sym})`)) changed = true
        }

        if (betaFirst.has(EPSILON)) {
          const followA = raw.get(p.lhs) ?? new Map()
          for (const s of followA.keys()) {
            if (addSymbol(raw, sym, s, `${ruleStr}: β is nullable, so FOLLOW(${p.lhs}) propagates to FOLLOW(${sym})`)) {
              changed = true
            }
          }
        }
      }
    }
  }

  return toSymbolSetMap(raw, grammar.nonTerminals)
}

export function computeLeading(grammar: Grammar): SymbolSetMap {
  const raw = new Map<string, Map<string, Set<string>>>()
  let changed = true

  while (changed) {
    changed = false
    for (const p of grammar.productions) {
      const ruleStr = productionToString(p)
      if (p.rhs.length === 1 && p.rhs[0] === EPSILON) continue

      const first = p.rhs[0]
      if (!isNonTerminal(grammar, first)) {
        if (addSymbol(raw, p.lhs, first, `${ruleStr}: "${first}" is the first symbol and a terminal`)) changed = true
      } else {
        const leadingFirst = raw.get(first) ?? new Map()
        for (const s of leadingFirst.keys()) {
          if (addSymbol(raw, p.lhs, s, `${ruleStr}: LEADING(${first}) propagates since ${first} is the first symbol`)) {
            changed = true
          }
        }
        // Only the symbol immediately after a leading non-terminal can also be leading —
        // a terminal already blocks any position after it from being reachable first.
        const second = p.rhs[1]
        if (second !== undefined && second !== EPSILON && !isNonTerminal(grammar, second)) {
          if (
            addSymbol(
              raw,
              p.lhs,
              second,
              `${ruleStr}: "${second}" immediately follows leading non-terminal "${first}"`,
            )
          ) {
            changed = true
          }
        }
      }
    }
  }

  return toSymbolSetMap(raw, grammar.nonTerminals)
}

export function getProductionsFor(grammar: Grammar, lhs: string): Production[] {
  return grammar.byLhs.get(lhs) ?? []
}

/** FIRST of a symbol sequence, built from an already-computed FIRST SymbolSetMap. Used by the LL(1) table builder. */
export function firstOfString(grammar: Grammar, seq: string[], first: SymbolSetMap): Set<string> {
  const raw = new Map<string, Map<string, Set<string>>>()
  for (const [nt, entries] of first) {
    raw.set(nt, new Map(entries.map((e) => [e.symbol, new Set(e.reasons)])))
  }
  return firstOfSequence(grammar, seq, raw)
}

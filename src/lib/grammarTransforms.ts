import { EPSILON, GrammarError, type Grammar, type Production } from './grammar'
import { getProductionsFor } from './firstFollowLeading'

export interface TransformStep {
  title: string
  detail: string
  before: string[]
  after: string[]
}

export interface TransformResult {
  grammar: Grammar
  steps: TransformStep[]
  changed: boolean
}

function rhsStr(lhs: string, rhs: string[]): string {
  return `${lhs} -> ${rhs.join(' ')}`
}

function buildGrammar(start: string, order: string[], prodMap: Map<string, string[][]>): Grammar {
  const productions: Production[] = []
  let id = 1
  for (const nt of order) {
    for (const rhs of prodMap.get(nt) ?? []) {
      productions.push({ id: id++, lhs: nt, rhs })
    }
  }

  const nonTerminalSet = new Set(order)
  const terminalSet = new Set<string>()
  for (const p of productions) {
    for (const sym of p.rhs) {
      if (sym === EPSILON) continue
      if (!nonTerminalSet.has(sym)) terminalSet.add(sym)
    }
  }

  const byLhs = new Map<string, Production[]>()
  for (const p of productions) {
    if (!byLhs.has(p.lhs)) byLhs.set(p.lhs, [])
    byLhs.get(p.lhs)!.push(p)
  }

  return { start, nonTerminals: order, terminals: Array.from(terminalSet).sort(), productions, byLhs }
}

function makePrimeName(base: string, used: Set<string>): string {
  let name = `${base}'`
  while (used.has(name)) name += "'"
  used.add(name)
  return name
}

/**
 * Eliminates direct and indirect left recursion (Dragon-book algorithm 4.19):
 * substitute earlier non-terminals' productions into any that start with them,
 * then remove immediate left recursion in each non-terminal via a fresh A' pair.
 */
export function eliminateLeftRecursion(grammar: Grammar): TransformResult {
  const order = [...grammar.nonTerminals]
  const prodMap = new Map<string, string[][]>()
  for (const nt of order) prodMap.set(nt, getProductionsFor(grammar, nt).map((p) => p.rhs.slice()))
  const usedNames = new Set(order)

  const steps: TransformStep[] = []
  let changed = false
  const finalOrder: string[] = []

  for (const Ai of order) {
    let AiProds = prodMap.get(Ai)!

    for (const Aj of finalOrder) {
      const before = AiProds.map((r) => rhsStr(Ai, r))
      const next: string[][] = []
      let substituted = false

      for (const rhs of AiProds) {
        if (rhs[0] === Aj) {
          substituted = true
          for (const ajRhs of prodMap.get(Aj)!) {
            const tail = rhs.slice(1)
            const combined = ajRhs[0] === EPSILON ? tail : [...ajRhs, ...tail]
            next.push(combined.length ? combined : [EPSILON])
          }
        } else {
          next.push(rhs)
        }
      }

      if (substituted) {
        changed = true
        AiProds = next
        prodMap.set(Ai, AiProds)
        steps.push({
          title: `Substitute ${Aj} into ${Ai}`,
          detail: `${Ai} had a production starting with the earlier non-terminal ${Aj}, so it was expanded using ${Aj}'s productions to expose any left recursion hiding through ${Aj}.`,
          before,
          after: AiProds.map((r) => rhsStr(Ai, r)),
        })
      }
    }

    const recursive: string[][] = []
    const nonRecursive: string[][] = []
    for (const rhs of AiProds) {
      if (rhs[0] === Ai) recursive.push(rhs.slice(1))
      else nonRecursive.push(rhs)
    }

    if (recursive.length > 0) {
      if (nonRecursive.length === 0) {
        throw new GrammarError(
          `"${Ai}" only has left-recursive productions (e.g. "${rhsStr(Ai, recursive[0])}") with no base case, so it can never terminate. Add a non-recursive alternative for ${Ai}.`,
        )
      }

      changed = true
      const before = AiProds.map((r) => rhsStr(Ai, r))
      const prime = makePrimeName(Ai, usedNames)
      const newAiProds = nonRecursive.map((beta) => (beta[0] === EPSILON ? [prime] : [...beta, prime]))
      const primeProds = [...recursive.map((alpha) => (alpha.length ? [...alpha, prime] : [prime])), [EPSILON]]

      prodMap.set(Ai, newAiProds)
      prodMap.set(prime, primeProds)
      finalOrder.push(Ai, prime)

      steps.push({
        title: `Eliminate immediate left recursion in ${Ai}`,
        detail: `${Ai} -> ${Ai} α | β becomes ${Ai} -> β ${prime}, and a new non-terminal ${prime} -> α ${prime} | ε absorbs the recursive part.`,
        before,
        after: [...newAiProds.map((r) => rhsStr(Ai, r)), ...primeProds.map((r) => rhsStr(prime, r))],
      })
    } else {
      finalOrder.push(Ai)
    }
  }

  return { grammar: buildGrammar(grammar.start, finalOrder, prodMap), steps, changed }
}

function commonPrefixLength(a: string[], b: string[]): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/**
 * Left-factors the grammar: alternatives of a non-terminal that share a common
 * prefix are grouped behind a new A' non-terminal. Runs to a fixed point so
 * nested prefixes (revealed after the first factoring pass) get factored too.
 */
export function eliminateLeftFactoring(grammar: Grammar): TransformResult {
  const order = [...grammar.nonTerminals]
  const prodMap = new Map<string, string[][]>()
  for (const nt of order) prodMap.set(nt, getProductionsFor(grammar, nt).map((p) => p.rhs.slice()))
  const usedNames = new Set(order)

  const steps: TransformStep[] = []
  let changed = false
  let progress = true

  while (progress) {
    progress = false

    for (const A of [...order]) {
      const prods = prodMap.get(A)!
      const groups = new Map<string, string[][]>()
      for (const rhs of prods) {
        if (rhs[0] === EPSILON) continue
        if (!groups.has(rhs[0])) groups.set(rhs[0], [])
        groups.get(rhs[0])!.push(rhs)
      }

      const consumed = new Set<string[]>()
      const additions: string[][] = []

      for (const group of groups.values()) {
        if (group.length < 2) continue
        let lcpLen = group[0].length
        for (const rhs of group.slice(1)) lcpLen = Math.min(lcpLen, commonPrefixLength(group[0], rhs))
        if (lcpLen < 1) continue

        const prefix = group[0].slice(0, lcpLen)
        const prime = makePrimeName(A, usedNames)
        const primeAlts = group.map((rhs) => {
          const rest = rhs.slice(lcpLen)
          return rest.length ? rest : [EPSILON]
        })

        prodMap.set(prime, primeAlts)
        order.splice(order.indexOf(A) + 1, 0, prime)
        for (const rhs of group) consumed.add(rhs)
        additions.push([...prefix, prime])

        steps.push({
          title: `Left-factor ${A}`,
          detail: `${A}'s alternatives starting with "${prefix.join(' ')}" share a common prefix, so they were factored into ${A} -> ${prefix.join(' ')} ${prime}, with ${prime} holding what comes after the shared part.`,
          before: group.map((r) => rhsStr(A, r)),
          after: [rhsStr(A, [...prefix, prime]), ...primeAlts.map((r) => rhsStr(prime, r))],
        })

        changed = true
        progress = true
      }

      if (additions.length > 0) {
        const kept = prods.filter((rhs) => !consumed.has(rhs))
        prodMap.set(A, [...kept, ...additions])
      }
    }
  }

  return { grammar: buildGrammar(grammar.start, order, prodMap), steps, changed }
}

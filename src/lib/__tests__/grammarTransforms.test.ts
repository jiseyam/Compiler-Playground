import { describe, it, expect } from 'vitest'
import { parseGrammar, GrammarError, productionToString } from '../grammar'
import { eliminateLeftRecursion, eliminateLeftFactoring } from '../grammarTransforms'

function prodStrings(grammar: ReturnType<typeof parseGrammar>, lhs: string): string[] {
  return grammar.productions.filter((p) => p.lhs === lhs).map((p) => productionToString(p)).sort()
}

describe('eliminateLeftRecursion', () => {
  it('leaves a grammar with no left recursion unchanged', () => {
    const g = parseGrammar('E -> T E\'\nE\' -> + T E\' | #\nT -> id')
    const { grammar, changed, steps } = eliminateLeftRecursion(g)
    expect(changed).toBe(false)
    expect(steps).toHaveLength(0)
    expect(grammar.productions.map(productionToString)).toEqual(g.productions.map(productionToString))
  })

  it('eliminates direct left recursion for the classic expression grammar', () => {
    const g = parseGrammar(`
      E -> E + T | T
      T -> T * F | F
      F -> ( E ) | id
    `)
    const { grammar, changed } = eliminateLeftRecursion(g)
    expect(changed).toBe(true)

    for (const p of grammar.productions) {
      expect(p.rhs[0]).not.toBe(p.lhs)
    }

    expect(grammar.nonTerminals).toContain("E'")
    expect(grammar.nonTerminals).toContain("T'")
    expect(prodStrings(grammar, 'E')).toEqual(["E -> T E'"])
    expect(prodStrings(grammar, "E'")).toEqual(["E' -> + T E'", "E' -> ε"])
    expect(prodStrings(grammar, 'T')).toEqual(["T -> F T'"])
    expect(prodStrings(grammar, "T'")).toEqual(["T' -> * F T'", "T' -> ε"])
  })

  it('eliminates indirect left recursion (Dragon book example 4.20)', () => {
    const g = parseGrammar(`
      S -> A a | b
      A -> A c | S d | #
    `)
    const { grammar, changed } = eliminateLeftRecursion(g)
    expect(changed).toBe(true)

    for (const p of grammar.productions) {
      expect(p.rhs[0]).not.toBe(p.lhs)
    }

    expect(prodStrings(grammar, 'S')).toEqual(['S -> A a', 'S -> b'])
    expect(prodStrings(grammar, 'A')).toEqual(["A -> A'", 'A -> b d A\''])
    expect(prodStrings(grammar, "A'")).toEqual(["A' -> a d A'", "A' -> c A'", "A' -> ε"])
  })

  it('throws when a non-terminal has only left-recursive productions', () => {
    const g = parseGrammar('A -> A a')
    expect(() => eliminateLeftRecursion(g)).toThrow(GrammarError)
  })
})

describe('eliminateLeftFactoring', () => {
  it('leaves an already-factored grammar unchanged', () => {
    const g = parseGrammar('S -> a S | b')
    const { grammar, changed, steps } = eliminateLeftFactoring(g)
    expect(changed).toBe(false)
    expect(steps).toHaveLength(0)
    expect(grammar.productions.map(productionToString)).toEqual(g.productions.map(productionToString))
  })

  it('factors the classic if-then-else grammar', () => {
    const g = parseGrammar('S -> i c t S e S | i c t S | a')
    const { grammar, changed } = eliminateLeftFactoring(g)
    expect(changed).toBe(true)
    expect(grammar.nonTerminals).toContain("S'")
    expect(prodStrings(grammar, 'S')).toEqual(["S -> a", "S -> i c t S S'"])
    expect(prodStrings(grammar, "S'")).toEqual(["S' -> e S", "S' -> ε"])
  })

  it('factors nested common prefixes across multiple passes', () => {
    const g = parseGrammar('A -> a b c | a b d | a e')
    const { grammar, changed } = eliminateLeftFactoring(g)
    expect(changed).toBe(true)
    for (const nt of grammar.nonTerminals) {
      const rhss = grammar.productions.filter((p) => p.lhs === nt).map((p) => p.rhs[0])
      const counts = new Map<string, number>()
      for (const s of rhss) counts.set(s, (counts.get(s) ?? 0) + 1)
      for (const [, count] of counts) expect(count).toBe(1)
    }
  })
})

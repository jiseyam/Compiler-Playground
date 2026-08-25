import { describe, it, expect } from 'vitest'
import { parseGrammar, GrammarError } from '../grammar'
import { computeFirst, computeFollow } from '../firstFollowLeading'

const EXPR_GRAMMAR = `
E -> T E'
E' -> + T E' | #
T -> F T'
T' -> * F T' | #
F -> ( E ) | id
`

function symbolsOf(map: Map<string, { symbol: string }[]>, key: string): string[] {
  return (map.get(key) ?? []).map((e) => e.symbol).sort()
}

describe('parseGrammar', () => {
  it('parses productions and classifies terminals/non-terminals', () => {
    const g = parseGrammar(EXPR_GRAMMAR)
    expect(g.nonTerminals).toEqual(['E', "E'", 'T', "T'", 'F'])
    expect(g.terminals).toEqual(['(', ')', '*', '+', 'id'])
    expect(g.start).toBe('E')
  })

  it('throws on missing arrow', () => {
    expect(() => parseGrammar('E T')).toThrow(GrammarError)
  })

  it('throws on undefined non-terminal reference', () => {
    expect(() => parseGrammar('E -> T X')).toThrow(/undefined|no production/i)
  })

  it('throws on empty grammar', () => {
    expect(() => parseGrammar('   ')).toThrow(GrammarError)
  })
})

describe('computeFirst', () => {
  const g = parseGrammar(EXPR_GRAMMAR)
  const first = computeFirst(g)

  it('matches the textbook FIRST sets for the classic expression grammar', () => {
    expect(symbolsOf(first, 'F')).toEqual(['(', 'id'])
    expect(symbolsOf(first, "T'")).toEqual(['*', 'ε'])
    expect(symbolsOf(first, 'T')).toEqual(['(', 'id'])
    expect(symbolsOf(first, "E'")).toEqual(['+', 'ε'])
    expect(symbolsOf(first, 'E')).toEqual(['(', 'id'])
  })
})

describe('computeFollow', () => {
  const g = parseGrammar(EXPR_GRAMMAR)
  const first = computeFirst(g)
  const follow = computeFollow(g, first)

  it('matches the textbook FOLLOW sets', () => {
    expect(symbolsOf(follow, 'E')).toEqual(['$', ')'])
    expect(symbolsOf(follow, "E'")).toEqual(['$', ')'])
    expect(symbolsOf(follow, 'T')).toEqual(['$', ')', '+'])
    expect(symbolsOf(follow, "T'")).toEqual(['$', ')', '+'])
    expect(symbolsOf(follow, 'F')).toEqual(['$', ')', '*', '+'])
  })
})

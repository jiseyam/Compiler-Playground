import { describe, it, expect } from 'vitest'
import { parseGrammar } from '../grammar'
import { computeFirst, computeFollow } from '../firstFollowLeading'
import { buildLl1Table, runPredictiveParse, tokenizeInput } from '../ll1'

const EXPR_GRAMMAR = `
E -> T E'
E' -> + T E' | #
T -> F T'
T' -> * F T' | #
F -> ( E ) | id
`

function build(source: string) {
  const grammar = parseGrammar(source)
  const first = computeFirst(grammar)
  const follow = computeFollow(grammar, first)
  const table = buildLl1Table(grammar, first, follow)
  return { grammar, table }
}

describe('buildLl1Table', () => {
  it('produces a conflict-free table for the classic expression grammar', () => {
    const { table } = build(EXPR_GRAMMAR)
    expect(table.conflicts).toEqual([])
  })

  it('detects an LL(1) conflict for an ambiguous grammar', () => {
    const { table } = build(`
      S -> A | B
      A -> a
      B -> a
    `)
    expect(table.conflicts.length).toBeGreaterThan(0)
    expect(table.conflicts[0].nonTerminal).toBe('S')
    expect(table.conflicts[0].terminal).toBe('a')
  })
})

describe('runPredictiveParse', () => {
  const { grammar, table } = build(EXPR_GRAMMAR)

  it('accepts a valid arithmetic expression', () => {
    const result = runPredictiveParse(grammar, table, tokenizeInput('id + id * id'))
    expect(result.accepted).toBe(true)
    expect(result.steps.at(-1)?.action.kind).toBe('accept')
  })

  it('accepts a fully parenthesized expression', () => {
    const result = runPredictiveParse(grammar, table, tokenizeInput('( id + id ) * id'))
    expect(result.accepted).toBe(true)
  })

  it('rejects an incomplete expression', () => {
    const result = runPredictiveParse(grammar, table, tokenizeInput('id +'))
    expect(result.accepted).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects a mismatched terminal', () => {
    const result = runPredictiveParse(grammar, table, tokenizeInput('id id'))
    expect(result.accepted).toBe(false)
  })
})

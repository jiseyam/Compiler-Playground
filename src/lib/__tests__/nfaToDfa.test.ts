import { describe, it, expect } from 'vitest'
import { subsetConstruction, parseNfaDsl, type NfaDef } from '../nfaToDfa'

// Classic (a|b)*abb NFA (Aho–Ullman dragon book, non-epsilon form).
const AB_STAR_ABB: NfaDef = {
  states: ['q0', 'q1', 'q2', 'q3'],
  alphabet: ['a', 'b'],
  start: 'q0',
  accepting: ['q3'],
  transitions: [
    { from: 'q0', symbol: 'a', to: ['q0', 'q1'] },
    { from: 'q0', symbol: 'b', to: ['q0'] },
    { from: 'q1', symbol: 'b', to: ['q2'] },
    { from: 'q2', symbol: 'b', to: ['q3'] },
  ],
}

describe('subsetConstruction', () => {
  it('builds the textbook 4-state DFA for (a|b)*abb', () => {
    const dfa = subsetConstruction(AB_STAR_ABB)
    expect(dfa.states).toHaveLength(4)

    const byId = new Map(dfa.states.map((s) => [s.id, s]))
    expect(byId.get(dfa.start)?.nfaStates).toEqual(['q0'])

    const find = (from: string, symbol: string) => dfa.transitions.find((t) => t.from === from && t.symbol === symbol)?.to
    const A = dfa.start
    const B = find(A, 'a')!
    const C = find(B, 'b')!
    const D = find(C, 'b')!

    expect(find(A, 'b')).toBe(A)
    expect(find(B, 'a')).toBe(B)
    expect(find(C, 'a')).toBe(B)
    expect(find(D, 'a')).toBe(B)
    expect(find(D, 'b')).toBe(A)

    expect(byId.get(D)?.accepting).toBe(true)
    expect(byId.get(A)?.accepting).toBe(false)
    expect(byId.get(B)?.accepting).toBe(false)
    expect(byId.get(C)?.accepting).toBe(false)
  })
})

describe('parseNfaDsl', () => {
  it('parses a well-formed definition including multi-target transitions', () => {
    const nfa = parseNfaDsl({
      states: 'q0, q1, q2, q3',
      alphabet: 'a, b',
      start: 'q0',
      accepting: 'q3',
      transitions: 'q0 a q0 q1\nq0 b q0\nq1 b q2\nq2 b q3',
    })
    expect(nfa.transitions).toHaveLength(4)
    expect(nfa.transitions[0].to).toEqual(['q0', 'q1'])
  })

  it('throws when the start state is undefined', () => {
    expect(() =>
      parseNfaDsl({ states: 'q0,q1', alphabet: 'a', start: 'q9', accepting: 'q1', transitions: 'q0 a q1' }),
    ).toThrow(/start state/i)
  })

  it('throws on a malformed transition line', () => {
    expect(() =>
      parseNfaDsl({ states: 'q0,q1', alphabet: 'a', start: 'q0', accepting: 'q1', transitions: 'q0 a' }),
    ).toThrow(/malformed/i)
  })
})

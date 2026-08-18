import { describe, it, expect } from 'vitest'
import { tokenize, summarize } from '../lexer'

describe('tokenize', () => {
  it('classifies keywords, identifiers, numbers, and operators', () => {
    const tokens = tokenize('int x = 42 + y;')
    expect(tokens.map((t) => t.type)).toEqual([
      'keyword', 'identifier', 'operator', 'number', 'operator', 'identifier', 'special',
    ])
  })

  it('strips line comments', () => {
    const tokens = tokenize('int x; // this is a comment\nint y;')
    const comment = tokens.find((t) => t.type === 'comment')
    expect(comment?.value).toBe('// this is a comment')
  })

  it('strips block comments spanning multiple lines', () => {
    const tokens = tokenize('/* hello\nworld */ int x;')
    expect(tokens[0].type).toBe('comment')
    expect(tokens[0].value).toBe('/* hello\nworld */')
  })

  it('parses string and char literals', () => {
    const tokens = tokenize('char c = \'a\'; char* s = "hi";')
    const strings = tokens.filter((t) => t.type === 'string').map((t) => t.value)
    expect(strings).toEqual(["'a'", '"hi"'])
  })

  it('handles float and exponent numbers', () => {
    const tokens = tokenize('3.14 2e10 1.5e-3')
    expect(tokens.map((t) => t.value)).toEqual(['3.14', '2e10', '1.5e-3'])
  })

  it('matches multi-char operators greedily', () => {
    const tokens = tokenize('a == b && c')
    expect(tokens.map((t) => t.value)).toEqual(['a', '==', 'b', '&&', 'c'])
  })

  it('summarizes unique tokens per category', () => {
    const tokens = tokenize('int x; int y;')
    const summary = summarize(tokens)
    expect(summary.keywords).toEqual(['int'])
    expect(summary.identifiers).toEqual(['x', 'y'])
    expect(summary.specials).toEqual([';'])
  })
})

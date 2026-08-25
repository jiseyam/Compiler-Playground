import { describe, it, expect } from 'vitest'
import { compilePattern, runPattern, PatternError } from '../patternMatcher'

describe('compilePattern + runPattern', () => {
  it('a* accepts empty string and any run of a', () => {
    const aStar = compilePattern('a*')
    expect(runPattern(aStar, '').accepted).toBe(true)
    expect(runPattern(aStar, 'aaaa').accepted).toBe(true)
  })

  it('a* rejects anything containing b', () => {
    const aStar = compilePattern('a*')
    expect(runPattern(aStar, 'aab').accepted).toBe(false)
  })

  it('a*b+ requires at least one trailing b', () => {
    const aStarBPlus = compilePattern('a*b+')
    expect(runPattern(aStarBPlus, '').accepted).toBe(false)
    expect(runPattern(aStarBPlus, 'aaabb').accepted).toBe(true)
    expect(runPattern(aStarBPlus, 'bbb').accepted).toBe(true)
    expect(runPattern(aStarBPlus, 'aab a').accepted).toBe(false)
  })

  it('a*b+ rejects a after b', () => {
    const aStarBPlus = compilePattern('a*b+')
    expect(runPattern(aStarBPlus, 'abba').accepted).toBe(false)
  })

  it('abb matches only the exact literal', () => {
    const abb = compilePattern('abb')
    expect(runPattern(abb, 'abb').accepted).toBe(true)
    expect(runPattern(abb, 'ab').accepted).toBe(false)
    expect(runPattern(abb, 'abbb').accepted).toBe(false)
  })

  it('supports alternation and grouping', () => {
    const p = compilePattern('(a|b)*abb')
    expect(runPattern(p, 'abb').accepted).toBe(true)
    expect(runPattern(p, 'aababb').accepted).toBe(true)
    expect(runPattern(p, 'ab').accepted).toBe(false)
  })

  it('supports the optional operator', () => {
    const p = compilePattern('ab?c')
    expect(runPattern(p, 'ac').accepted).toBe(true)
    expect(runPattern(p, 'abc').accepted).toBe(true)
    expect(runPattern(p, 'abbc').accepted).toBe(false)
  })

  it('rejects malformed patterns', () => {
    expect(() => compilePattern('')).toThrow(PatternError)
    expect(() => compilePattern('a(b')).toThrow(PatternError)
    expect(() => compilePattern('*a')).toThrow(PatternError)
    expect(() => compilePattern('a)')).toThrow(PatternError)
  })

  it('supports escaping metacharacters as literals', () => {
    const p = compilePattern('a\\*b')
    expect(runPattern(p, 'a*b').accepted).toBe(true)
    expect(runPattern(p, 'aaab').accepted).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { PATTERNS, runPattern } from '../patternMatcher'

const aStar = PATTERNS.find((p) => p.id === 'a-star')!
const aStarBPlus = PATTERNS.find((p) => p.id === 'a-star-b-plus')!
const abb = PATTERNS.find((p) => p.id === 'abb')!

describe('runPattern', () => {
  it('a* accepts empty string and any run of a', () => {
    expect(runPattern(aStar, '').accepted).toBe(true)
    expect(runPattern(aStar, 'aaaa').accepted).toBe(true)
  })

  it('a* rejects anything containing b', () => {
    expect(runPattern(aStar, 'aab').accepted).toBe(false)
  })

  it('a*b+ requires at least one trailing b', () => {
    expect(runPattern(aStarBPlus, '').accepted).toBe(false)
    expect(runPattern(aStarBPlus, 'aaabb').accepted).toBe(true)
    expect(runPattern(aStarBPlus, 'bbb').accepted).toBe(true)
    expect(runPattern(aStarBPlus, 'aab a').accepted).toBe(false)
  })

  it('a*b+ rejects a after b', () => {
    expect(runPattern(aStarBPlus, 'abba').accepted).toBe(false)
  })

  it('abb matches only the exact literal', () => {
    expect(runPattern(abb, 'abb').accepted).toBe(true)
    expect(runPattern(abb, 'ab').accepted).toBe(false)
    expect(runPattern(abb, 'abbb').accepted).toBe(false)
  })
})

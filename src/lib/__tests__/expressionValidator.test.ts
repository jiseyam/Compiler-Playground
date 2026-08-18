import { describe, it, expect } from 'vitest'
import { validateExpression } from '../expressionValidator'

describe('validateExpression', () => {
  it('accepts a well-formed expression', () => {
    const r = validateExpression('(3 + 4) * x2 - 1')
    expect(r.valid).toBe(true)
  })

  it('accepts leading unary minus', () => {
    expect(validateExpression('-3 + 4').valid).toBe(true)
  })

  it('rejects unmatched closing paren', () => {
    const r = validateExpression('3 + 4)')
    expect(r.valid).toBe(false)
    expect(r.errorIndex).toBe(5)
  })

  it('rejects unclosed opening paren', () => {
    const r = validateExpression('(3 + 4')
    expect(r.valid).toBe(false)
  })

  it('rejects two operators in a row', () => {
    const r = validateExpression('3 + * 4')
    expect(r.valid).toBe(false)
    expect(r.errorIndex).toBe(4)
  })

  it('rejects two operands in a row', () => {
    const r = validateExpression('3 4')
    expect(r.valid).toBe(false)
  })

  it('rejects trailing operator', () => {
    const r = validateExpression('3 + 4 *')
    expect(r.valid).toBe(false)
  })

  it('rejects empty parens', () => {
    const r = validateExpression('()')
    expect(r.valid).toBe(false)
  })
})

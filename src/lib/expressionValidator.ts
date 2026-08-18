export type ExprTokenType = 'number' | 'operator' | 'lparen' | 'rparen' | 'identifier'

export interface ExprToken {
  type: ExprTokenType
  value: string
  index: number
}

export interface ValidationResult {
  valid: boolean
  message: string
  errorIndex?: number
  tokens: ExprToken[]
}

const OPERATORS = new Set(['+', '-', '*', '/', '%', '^'])

function tokenizeExpression(expr: string): ExprToken[] | { errorIndex: number; message: string } {
  const tokens: ExprToken[] = []
  let i = 0
  while (i < expr.length) {
    const c = expr[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '(') {
      tokens.push({ type: 'lparen', value: c, index: i })
      i++
      continue
    }
    if (c === ')') {
      tokens.push({ type: 'rparen', value: c, index: i })
      i++
      continue
    }
    if (OPERATORS.has(c)) {
      tokens.push({ type: 'operator', value: c, index: i })
      i++
      continue
    }
    if (/[0-9.]/.test(c)) {
      const start = i
      let seenDot = false
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        if (expr[i] === '.') {
          if (seenDot) return { errorIndex: i, message: `Number has a second decimal point at position ${i + 1}.` }
          seenDot = true
        }
        i++
      }
      tokens.push({ type: 'number', value: expr.slice(start, i), index: start })
      continue
    }
    if (/[a-zA-Z_]/.test(c)) {
      const start = i
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) i++
      tokens.push({ type: 'identifier', value: expr.slice(start, i), index: start })
      continue
    }
    return { errorIndex: i, message: `Unrecognized character "${c}" at position ${i + 1}.` }
  }
  return tokens
}

export function validateExpression(expr: string): ValidationResult {
  const trimmed = expr.trim()
  if (!trimmed) {
    return { valid: false, message: 'Expression is empty.', tokens: [] }
  }

  const tokenResult = tokenizeExpression(expr)
  if (!Array.isArray(tokenResult)) {
    return { valid: false, message: tokenResult.message, errorIndex: tokenResult.errorIndex, tokens: [] }
  }
  const tokens = tokenResult

  const isOperand = (t: ExprTokenType) => t === 'number' || t === 'identifier'

  let parenDepth = 0
  let expectOperand = true // true = expect operand/unary/lparen next, false = expect operator/rparen

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]

    if (t.type === 'lparen') {
      if (!expectOperand) {
        return {
          valid: false,
          message: `Unexpected "(" at position ${t.index + 1} — an operator was expected here.`,
          errorIndex: t.index,
          tokens,
        }
      }
      parenDepth++
      continue
    }

    if (t.type === 'rparen') {
      if (expectOperand) {
        return {
          valid: false,
          message: `Unexpected ")" at position ${t.index + 1} — an operand was expected here.`,
          errorIndex: t.index,
          tokens,
        }
      }
      parenDepth--
      if (parenDepth < 0) {
        return {
          valid: false,
          message: `Unmatched ")" at position ${t.index + 1} — no matching "(" was opened.`,
          errorIndex: t.index,
          tokens,
        }
      }
      continue
    }

    if (isOperand(t.type)) {
      if (!expectOperand) {
        return {
          valid: false,
          message: `Unexpected ${t.type} "${t.value}" at position ${t.index + 1} — an operator was expected here.`,
          errorIndex: t.index,
          tokens,
        }
      }
      expectOperand = false
      continue
    }

    if (t.type === 'operator') {
      if (expectOperand) {
        // Unary +/- is allowed at the start of an expression or right after "(" or another operator.
        if (t.value === '+' || t.value === '-') {
          continue
        }
        return {
          valid: false,
          message: `Operator "${t.value}" at position ${t.index + 1} has no left operand.`,
          errorIndex: t.index,
          tokens,
        }
      }
      expectOperand = true
      continue
    }
  }

  if (expectOperand) {
    const last = tokens[tokens.length - 1]
    return {
      valid: false,
      message: `Expression ends with an operator "${last.value}" — a trailing operand is missing.`,
      errorIndex: last.index,
      tokens,
    }
  }

  if (parenDepth > 0) {
    return {
      valid: false,
      message: `${parenDepth} unclosed "(" — expression has more "(" than ")".`,
      tokens,
    }
  }

  return { valid: true, message: 'Expression is valid: balanced parentheses and correct operator placement.', tokens }
}

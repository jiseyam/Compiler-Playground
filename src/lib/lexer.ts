export type TokenType =
  | 'keyword'
  | 'identifier'
  | 'number'
  | 'string'
  | 'operator'
  | 'special'
  | 'comment'
  | 'unknown'

export interface Token {
  type: TokenType
  value: string
  start: number
  end: number
  line: number
}

export const KEYWORDS = new Set([
  'int', 'float', 'double', 'char', 'void', 'long', 'short', 'unsigned', 'signed', 'bool',
  'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
  'return', 'goto', 'struct', 'union', 'enum', 'typedef', 'const', 'static', 'extern',
  'sizeof', 'volatile', 'class', 'public', 'private', 'protected', 'new', 'delete',
  'namespace', 'using', 'template', 'true', 'false', 'null', 'nullptr', 'auto',
])

// Longest-match-first operator table.
const OPERATORS = [
  '<<=', '>>=',
  '==', '!=', '<=', '>=', '&&', '||', '++', '--', '->', '+=', '-=', '*=', '/=', '%=',
  '&=', '|=', '^=', '<<', '>>', '::',
  '+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~', '.',
]

const SPECIALS = new Set(['(', ')', '{', '}', '[', ']', ';', ',', '?', ':'])

function isIdentStart(c: string) {
  return /[a-zA-Z_]/.test(c)
}
function isIdentPart(c: string) {
  return /[a-zA-Z0-9_]/.test(c)
}
function isDigit(c: string) {
  return /[0-9]/.test(c)
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let line = 1
  const n = source.length

  while (i < n) {
    const c = source[i]

    if (c === '\n') {
      line++
      i++
      continue
    }
    if (/\s/.test(c)) {
      i++
      continue
    }

    // Line comment
    if (c === '/' && source[i + 1] === '/') {
      const start = i
      while (i < n && source[i] !== '\n') i++
      tokens.push({ type: 'comment', value: source.slice(start, i), start, end: i, line })
      continue
    }

    // Block comment
    if (c === '/' && source[i + 1] === '*') {
      const start = i
      const startLine = line
      i += 2
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') line++
        i++
      }
      i = Math.min(i + 2, n)
      tokens.push({ type: 'comment', value: source.slice(start, i), start, end: i, line: startLine })
      continue
    }

    // String literal
    if (c === '"' || c === "'") {
      const quote = c
      const start = i
      const startLine = line
      i++
      while (i < n && source[i] !== quote) {
        if (source[i] === '\\') i++
        if (source[i] === '\n') line++
        i++
      }
      i = Math.min(i + 1, n)
      tokens.push({ type: 'string', value: source.slice(start, i), start, end: i, line: startLine })
      continue
    }

    // Number literal (int, float, exponent)
    if (isDigit(c) || (c === '.' && isDigit(source[i + 1] ?? ''))) {
      const start = i
      let seenDot = false
      let seenExp = false
      while (i < n) {
        const ch = source[i]
        if (isDigit(ch)) {
          i++
        } else if (ch === '.' && !seenDot && !seenExp) {
          seenDot = true
          i++
        } else if ((ch === 'e' || ch === 'E') && !seenExp) {
          seenExp = true
          i++
          if (source[i] === '+' || source[i] === '-') i++
        } else {
          break
        }
      }
      tokens.push({ type: 'number', value: source.slice(start, i), start, end: i, line })
      continue
    }

    // Identifier / keyword
    if (isIdentStart(c)) {
      const start = i
      while (i < n && isIdentPart(source[i])) i++
      const value = source.slice(start, i)
      tokens.push({
        type: KEYWORDS.has(value) ? 'keyword' : 'identifier',
        value,
        start,
        end: i,
        line,
      })
      continue
    }

    // Special symbols
    if (SPECIALS.has(c)) {
      tokens.push({ type: 'special', value: c, start: i, end: i + 1, line })
      i++
      continue
    }

    // Operators (longest match first)
    const op = OPERATORS.find((o) => source.startsWith(o, i))
    if (op) {
      tokens.push({ type: 'operator', value: op, start: i, end: i + op.length, line })
      i += op.length
      continue
    }

    // Unknown character
    tokens.push({ type: 'unknown', value: c, start: i, end: i + 1, line })
    i++
  }

  return tokens
}

export interface LexerSummary {
  keywords: string[]
  identifiers: string[]
  numbers: string[]
  strings: string[]
  operators: string[]
  specials: string[]
}

export function summarize(tokens: Token[]): LexerSummary {
  const uniq = (arr: string[]) => Array.from(new Set(arr))
  return {
    keywords: uniq(tokens.filter((t) => t.type === 'keyword').map((t) => t.value)),
    identifiers: uniq(tokens.filter((t) => t.type === 'identifier').map((t) => t.value)),
    numbers: uniq(tokens.filter((t) => t.type === 'number').map((t) => t.value)),
    strings: uniq(tokens.filter((t) => t.type === 'string').map((t) => t.value)),
    operators: uniq(tokens.filter((t) => t.type === 'operator').map((t) => t.value)),
    specials: uniq(tokens.filter((t) => t.type === 'special').map((t) => t.value)),
  }
}

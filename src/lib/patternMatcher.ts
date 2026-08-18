export interface PatternDef {
  id: string
  label: string
  description: string
  states: number
  accepting: number[]
  transition: (state: number, char: string) => number | null // null = dead state (reject)
}

export interface MatchStep {
  index: number // step number
  fromState: number
  toState: number | null
  char: string | null // null on the initial step (no char consumed yet)
  remaining: string
}

export interface MatchResult {
  accepted: boolean
  steps: MatchStep[]
  reason: string
}

export const PATTERNS: PatternDef[] = [
  {
    id: 'a-star',
    label: 'a*',
    description: 'Zero or more "a" characters, nothing else.',
    states: 1,
    accepting: [0],
    transition: (state, char) => (char === 'a' && state === 0 ? 0 : null),
  },
  {
    id: 'a-star-b-plus',
    label: 'a*b+',
    description: 'Zero or more "a" followed by one or more "b".',
    states: 2,
    accepting: [1],
    transition: (state, char) => {
      if (state === 0) {
        if (char === 'a') return 0
        if (char === 'b') return 1
        return null
      }
      if (state === 1) {
        if (char === 'b') return 1
        return null
      }
      return null
    },
  },
  {
    id: 'abb',
    label: 'abb',
    description: 'The exact literal string "abb".',
    states: 4,
    accepting: [3],
    transition: (state, char) => {
      if (state === 0 && char === 'a') return 1
      if (state === 1 && char === 'b') return 2
      if (state === 2 && char === 'b') return 3
      return null
    },
  },
]

export function runPattern(pattern: PatternDef, input: string): MatchResult {
  const steps: MatchStep[] = []
  let state: number | null = 0
  steps.push({ index: 0, fromState: 0, toState: 0, char: null, remaining: input })

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    const from = state as number
    const to: number | null = state === null ? null : pattern.transition(state, char)
    steps.push({ index: i + 1, fromState: from, toState: to, char, remaining: input.slice(i + 1) })
    state = to
    if (state === null) break
  }

  if (state === null) {
    return { accepted: false, steps, reason: `Rejected: no valid transition — the pattern "${pattern.label}" does not match.` }
  }
  if (pattern.accepting.includes(state)) {
    return { accepted: true, steps, reason: `Accepted in state q${state}, which is an accepting state for "${pattern.label}".` }
  }
  return { accepted: false, steps, reason: `Rejected: input consumed but ended in non-accepting state q${state}.` }
}

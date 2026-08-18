export const NFA_EPSILON = 'ε'

export interface NfaTransition {
  from: string
  symbol: string // NFA_EPSILON for an epsilon move
  to: string[]
}

export interface NfaDef {
  states: string[]
  alphabet: string[] // excludes epsilon
  start: string
  accepting: string[]
  transitions: NfaTransition[]
}

export interface DfaState {
  id: string
  nfaStates: string[]
  accepting: boolean
}

export interface DfaTransition {
  from: string
  symbol: string
  to: string
}

export interface SubsetStep {
  index: number
  description: string
  dfaState: string
  symbol?: string
  resultState?: string
  isNewState: boolean
}

export interface DfaResult {
  states: DfaState[]
  transitions: DfaTransition[]
  start: string
  steps: SubsetStep[]
}

export class NfaError extends Error {}

function transitionsFrom(nfa: NfaDef, state: string, symbol: string): string[] {
  return nfa.transitions.filter((t) => t.from === state && t.symbol === symbol).flatMap((t) => t.to)
}

function stateSetId(nfa: NfaDef, states: Set<string>): string {
  return nfa.states.filter((s) => states.has(s)).join(',')
}

function epsilonClosure(nfa: NfaDef, seed: Set<string>): Set<string> {
  const result = new Set(seed)
  const stack = [...seed]
  while (stack.length) {
    const s = stack.pop()!
    for (const next of transitionsFrom(nfa, s, NFA_EPSILON)) {
      if (!result.has(next)) {
        result.add(next)
        stack.push(next)
      }
    }
  }
  return result
}

function move(nfa: NfaDef, states: Set<string>, symbol: string): Set<string> {
  const result = new Set<string>()
  for (const s of states) {
    for (const next of transitionsFrom(nfa, s, symbol)) result.add(next)
  }
  return result
}

export function subsetConstruction(nfa: NfaDef): DfaResult {
  const steps: SubsetStep[] = []
  const startClosure = epsilonClosure(nfa, new Set([nfa.start]))
  const startId = stateSetId(nfa, startClosure)

  const dfaStates = new Map<string, Set<string>>()
  dfaStates.set(startId, startClosure)
  const queue = [startId]

  steps.push({
    index: 0,
    description: `Start state = ε-closure(${nfa.start}) = {${[...startClosure].join(', ')}}`,
    dfaState: startId,
    isNewState: true,
  })

  const transitions: DfaTransition[] = []

  while (queue.length) {
    const currentId = queue.shift()!
    const currentSet = dfaStates.get(currentId)!

    for (const symbol of nfa.alphabet) {
      const moved = move(nfa, currentSet, symbol)
      if (moved.size === 0) continue
      const closure = epsilonClosure(nfa, moved)
      const id = stateSetId(nfa, closure)
      const isNewState = !dfaStates.has(id)

      if (isNewState) {
        dfaStates.set(id, closure)
        queue.push(id)
      }
      transitions.push({ from: currentId, symbol, to: id })
      steps.push({
        index: steps.length,
        description: `δ({${currentId}}, ${symbol}) = ε-closure({${[...moved].join(', ')}}) = {${id}}${isNewState ? '  — new DFA state' : ''}`,
        dfaState: currentId,
        symbol,
        resultState: id,
        isNewState,
      })
    }
  }

  const states: DfaState[] = Array.from(dfaStates.entries()).map(([id, set]) => ({
    id,
    nfaStates: nfa.states.filter((s) => set.has(s)),
    accepting: [...set].some((s) => nfa.accepting.includes(s)),
  }))

  return { states, transitions, start: startId, steps }
}

/** Minimal DSL parser for NFA definitions used by the module's input form. */
export function parseNfaDsl(text: {
  states: string
  alphabet: string
  start: string
  accepting: string
  transitions: string
}): NfaDef {
  const states = text.states.split(',').map((s) => s.trim()).filter(Boolean)
  const alphabet = text.alphabet.split(',').map((s) => s.trim()).filter(Boolean)
  const start = text.start.trim()
  const accepting = text.accepting.split(',').map((s) => s.trim()).filter(Boolean)

  if (states.length === 0) throw new NfaError('Define at least one state.')
  if (!states.includes(start)) throw new NfaError(`Start state "${start}" is not in the state list.`)
  for (const a of accepting) {
    if (!states.includes(a)) throw new NfaError(`Accepting state "${a}" is not in the state list.`)
  }

  const transitions: NfaTransition[] = []
  const lines = text.transitions
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  for (const line of lines) {
    const parts = line.split(/\s+/)
    if (parts.length < 3) {
      throw new NfaError(`Malformed transition "${line}". Expected "from symbol to1 [to2 ...]".`)
    }
    const [from, symbol, ...to] = parts
    if (!states.includes(from)) throw new NfaError(`Transition references unknown state "${from}".`)
    if (symbol !== NFA_EPSILON && !alphabet.includes(symbol)) {
      throw new NfaError(`Transition uses symbol "${symbol}" which is not in the alphabet.`)
    }
    for (const t of to) {
      if (!states.includes(t)) throw new NfaError(`Transition references unknown state "${t}".`)
    }
    transitions.push({ from, symbol, to })
  }

  return { states, alphabet, start, accepting, transitions }
}

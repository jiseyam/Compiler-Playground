export interface NfaPreset {
  id: string
  label: string
  description: string
  states: string
  alphabet: string
  start: string
  accepting: string
  transitions: string
}

export const NFA_PRESETS: NfaPreset[] = [
  {
    id: 'ab-star-abb',
    label: '(a|b)*abb',
    description: 'Strings over {a,b} ending in "abb". The classic subset-construction textbook example.',
    states: 'q0, q1, q2, q3',
    alphabet: 'a, b',
    start: 'q0',
    accepting: 'q3',
    transitions: 'q0 a q0 q1\nq0 b q0\nq1 b q2\nq2 b q3',
  },
  {
    id: 'contains-aa',
    label: '(a|b)*aa(a|b)*',
    description: 'Strings over {a,b} that contain "aa" somewhere.',
    states: 'q0, q1, q2',
    alphabet: 'a, b',
    start: 'q0',
    accepting: 'q2',
    transitions: 'q0 a q0 q1\nq0 b q0\nq1 a q2\nq1 b q0\nq2 a q2\nq2 b q2',
  },
  {
    id: 'epsilon-a-or-b-star',
    label: '(a|b)* via ε-NFA',
    description: 'Union of "a*" and "b*" branches joined with epsilon transitions.',
    states: 'q0, q1, q2, q3, q4',
    alphabet: 'a, b',
    start: 'q0',
    accepting: 'q0, q1, q3',
    transitions: 'q0 ε q1\nq0 ε q3\nq1 a q2\nq2 a q2\nq2 ε q1\nq3 b q4\nq4 b q4\nq4 ε q3',
  },
]

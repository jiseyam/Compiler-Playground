import {
  ScanText,
  Regex,
  Sigma,
  Table2,
  GitBranch,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'

export interface ModuleMeta {
  path: string
  title: string
  description: string
  lab: string
  icon: LucideIcon
}

export const modules: ModuleMeta[] = [
  {
    path: '/lexer',
    title: 'Lexical Analyzer',
    description: 'Tokenize source code live and see keywords, identifiers, and operators classified in real time.',
    lab: 'Lab I',
    icon: ScanText,
  },
  {
    path: '/pattern-matcher',
    title: 'Pattern Recognizer',
    description: 'Watch a string get matched against a*, a*b+, and abb one character at a time.',
    lab: 'Lab II',
    icon: Regex,
  },
  {
    path: '/expression-validator',
    title: 'Expression Validator',
    description: 'Validate math expressions with balanced parens and correct operator placement, error pinpointed.',
    lab: 'Lab II',
    icon: Sigma,
  },
  {
    path: '/first-follow-leading',
    title: 'FIRST / FOLLOW / LEADING',
    description: 'Build FIRST, FOLLOW, and LEADING sets from a grammar with every derivation step shown.',
    lab: 'Lab III',
    icon: Waypoints,
  },
  {
    path: '/ll1-parser',
    title: 'LL(1) Parser',
    description: 'Generate a predictive parsing table and step through the stack-driven parse of an input string.',
    lab: 'Lab IV–V',
    icon: Table2,
  },
  {
    path: '/nfa-to-dfa',
    title: 'NFA → DFA Converter',
    description: 'Run subset construction on an NFA and watch the equivalent DFA get built state by state.',
    lab: 'Lab VI',
    icon: GitBranch,
  },
]

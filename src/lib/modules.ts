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
  navLabel: string
  description: string
  tag: string
  icon: LucideIcon
}

export const modules: ModuleMeta[] = [
  {
    path: '/lexer',
    title: 'Lexical Analyzer',
    navLabel: 'Lexer',
    description: 'Tokenize source code live and see keywords, identifiers, and operators classified in real time.',
    tag: 'Lexical Analysis',
    icon: ScanText,
  },
  {
    path: '/pattern-matcher',
    title: 'Pattern Recognizer',
    navLabel: 'Patterns',
    description: 'Watch a string get matched against a*, a*b+, and abb one character at a time.',
    tag: 'Finite Automata',
    icon: Regex,
  },
  {
    path: '/expression-validator',
    title: 'Expression Validator',
    navLabel: 'Expressions',
    description: 'Validate math expressions with balanced parens and correct operator placement, error pinpointed.',
    tag: 'Syntax Validation',
    icon: Sigma,
  },
  {
    path: '/first-follow-leading',
    title: 'FIRST / FOLLOW / LEADING',
    navLabel: 'FIRST/FOLLOW',
    description: 'Build FIRST, FOLLOW, and LEADING sets from a grammar with every derivation step shown.',
    tag: 'Grammar Analysis',
    icon: Waypoints,
  },
  {
    path: '/ll1-parser',
    title: 'LL(1) Parser',
    navLabel: 'LL(1)',
    description: 'Generate a predictive parsing table and step through the stack-driven parse of an input string.',
    tag: 'Predictive Parsing',
    icon: Table2,
  },
  {
    path: '/nfa-to-dfa',
    title: 'NFA → DFA Converter',
    navLabel: 'NFA→DFA',
    description: 'Run subset construction on an NFA and watch the equivalent DFA get built state by state.',
    tag: 'Automata Theory',
    icon: GitBranch,
  },
]

import { useMemo, useState } from 'react'
import { Sigma, Regex, CircleCheck, CircleX } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import SplitPane from '@/components/layout/SplitPane'
import Tabs from '@/components/ui/Tabs'
import Card from '@/components/ui/Card'
import ExportReportButton from '@/components/ui/ExportReportButton'
import ExpressionHighlighter from '@/components/viz/ExpressionHighlighter'
import PatternStepper from '@/components/viz/PatternStepper'
import ErrorPanel from '@/components/ui/ErrorPanel'
import { validateExpression, type ValidationResult } from '@/lib/expressionValidator'
import { PATTERN_EXAMPLES, PatternError, compilePattern, runPattern, type PatternDef, type MatchResult } from '@/lib/patternMatcher'
import { ReportBuilder, pdfFilename } from '@/lib/pdfReport'
import { useDebounce } from '@/hooks/useDebounce'

const TABS = [
  { key: 'expression', label: 'Expression Validator' },
  { key: 'pattern', label: 'Pattern Recognizer' },
]

function buildExpressionReport(expr: string, result: ValidationResult, discussion: string) {
  const r = new ReportBuilder(
    'Expression Validator',
    'Balanced Parentheses and Operator Placement Check',
    'Compiler Playground - Expression Validator',
  )

  r.heading('Given Expression')
  r.codeBlock([expr])

  if (result.tokens.length > 0) {
    r.heading('Tokenization')
    r.table({
      head: ['#', 'Type', 'Value'],
      rows: result.tokens.map((t, i) => [String(i + 1), t.type, t.value]),
      monospace: true,
      columnAlign: ['right', 'left', 'left'],
    })
  }

  r.heading('Validation Rules Checked')
  r.bulletList([
    'Parentheses must be balanced: every "(" has a matching ")" and vice versa.',
    'No two operators appear back to back (except a leading unary + or -).',
    'No two operands (numbers/identifiers) appear back to back with no operator between them.',
    'Parentheses may not be empty: "()" is rejected.',
    'The expression may not end with a trailing operator.',
    'Unary + and - are allowed at the start of the expression, right after "(", or right after another operator.',
  ])

  r.heading('Result')
  r.resultBanner(result.valid, result.message)
  if (!result.valid && result.errorIndex !== undefined) {
    r.subheading('Error location')
    r.codeBlock([expr, ' '.repeat(result.errorIndex) + '^-- here'])
  }

  r.heading('Discussion')
  r.paragraph(discussion)

  r.save(pdfFilename('Expression Validator'))
}

function buildPatternReport(pattern: PatternDef, input: string, result: MatchResult, discussion: string) {
  const r = new ReportBuilder(
    'Pattern Recognizer',
    'Regex Compilation via Thompson Construction and DFA Simulation',
    'Compiler Playground - Pattern Recognizer',
  )

  r.heading('Given Pattern and Input')
  r.keyValue([
    { label: 'Pattern', value: pattern.label },
    { label: 'Input string', value: input || '(empty)' },
  ])

  r.heading('Compiled Automaton')
  r.paragraph(pattern.description)
  r.keyValue([
    { label: 'States', value: String(pattern.states) },
    { label: 'Accepting states', value: pattern.accepting.map((s) => `q${s}`).join(', ') || 'none' },
  ])

  r.heading('State Trace')
  r.table({
    head: ['Step', 'From', 'Symbol', 'To'],
    rows: result.steps.map((s) => [
      String(s.index),
      `q${s.fromState}`,
      s.char ?? '(start)',
      s.toState === null ? 'dead' : `q${s.toState}`,
    ]),
    monospace: true,
    columnAlign: ['right', 'left', 'center', 'left'],
  })

  r.heading('Result')
  r.resultBanner(result.accepted, result.reason)

  r.heading('Discussion')
  r.paragraph(discussion)

  r.save(pdfFilename('Pattern Recognizer'))
}

export default function ExpressionValidator({ defaultTab = 'expression' }: { defaultTab?: 'expression' | 'pattern' }) {
  const [tab, setTab] = useState<string>(defaultTab)

  return (
    <PageShell
      title="Expression & Pattern Validator"
      description="Two related checks: balanced math expressions, and step-by-step regex-style pattern matching."
      icon={tab === 'expression' ? Sigma : Regex}
      tag={tab === 'expression' ? 'Syntax Validation' : 'Finite Automata'}
      actions={<Tabs tabs={TABS} active={tab} onChange={setTab} />}
    >
      {tab === 'expression' ? <ExpressionTab /> : <PatternTab />}
    </PageShell>
  )
}

function ExpressionTab() {
  const [expr, setExpr] = useState('(3 + 4) * x2 - 1')
  const debounced = useDebounce(expr, 150)
  const result = useMemo(() => validateExpression(debounced), [debounced])

  return (
    <SplitPane
      left={
        <div className="flex flex-col gap-4">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Math expression</label>
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            spellCheck={false}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-text outline-none focus:border-accent/50 transition-colors duration-150"
            placeholder="e.g. (3 + 4) * x2 - 1"
          />
          <p className="text-sm text-text-muted leading-relaxed">
            Checks balanced parentheses and correct operator placement (no two operators or two operands back to
            back, no empty parens, no trailing operator). Unary <code className="text-text">+</code> /{' '}
            <code className="text-text">-</code> is allowed.
          </p>
        </div>
      }
      right={
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <ExportReportButton
              moduleTitle="Expression Validator"
              category="Syntax Validation"
              problemStatement="Validate a math expression for balanced parentheses and correct operator placement, pinpointing the exact character where validation fails."
              inputGiven={expr}
              discussionDefault={result.message}
              onExport={(discussion) => buildExpressionReport(expr, result, discussion)}
            />
          </div>
          <div className="flex flex-col gap-4">
            <Card className="p-4">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Expression</h3>
              <ExpressionHighlighter expr={expr} errorIndex={result.errorIndex} />
            </Card>
            <div
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                result.valid ? 'border-teal/30 bg-teal-soft text-teal' : 'border-coral/30 bg-coral-soft text-coral'
              }`}
            >
              {result.valid ? <CircleCheck size={16} /> : <CircleX size={16} />}
              <span>{result.message}</span>
            </div>
          </div>
        </div>
      }
    />
  )
}

function PatternTab() {
  const [patternText, setPatternText] = useState('a*b+')
  const [input, setInput] = useState('aaabb')
  const debouncedPattern = useDebounce(patternText, 150)
  const debouncedInput = useDebounce(input, 150)

  const compiled = useMemo(() => {
    try {
      return { pattern: compilePattern(debouncedPattern), error: null as string | null }
    } catch (e) {
      return { pattern: null, error: e instanceof PatternError ? e.message : 'Failed to compile pattern.' }
    }
  }, [debouncedPattern])

  const result = useMemo(
    () => (compiled.pattern ? runPattern(compiled.pattern, debouncedInput) : null),
    [compiled.pattern, debouncedInput],
  )

  return (
    <SplitPane
      left={
        <div className="flex flex-col gap-4">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Pattern</label>
          <input
            value={patternText}
            onChange={(e) => setPatternText(e.target.value)}
            spellCheck={false}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-text outline-none focus:border-accent/50 transition-colors duration-150"
            placeholder="e.g. a*b+ or (a|b)*abb"
          />
          <p className="text-xs text-text-dim -mt-2">
            Supports literals, <code className="text-text">|</code> (or), <code className="text-text">*</code>{' '}
            (zero+), <code className="text-text">+</code> (one+), <code className="text-text">?</code> (optional),
            and <code className="text-text">(...)</code> grouping.
          </p>
          <div className="flex flex-wrap gap-2">
            {PATTERN_EXAMPLES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPatternText(p.pattern)}
                title={p.description}
                className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors duration-150 ${
                  patternText === p.pattern
                    ? 'border-accent/40 bg-accent-soft text-accent'
                    : 'border-border bg-surface text-text-muted hover:bg-surface-hover'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="text-xs font-medium text-text-muted uppercase tracking-wide mt-2">Input string</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-text outline-none focus:border-accent/50 transition-colors duration-150"
            placeholder="e.g. aaabb"
          />

          {compiled.error && <ErrorPanel message={compiled.error} />}
        </div>
      }
      right={
        compiled.pattern && result ? (
          <div>
            <div className="flex justify-end mb-4">
              <ExportReportButton
                moduleTitle="Pattern Recognizer"
                category="Finite Automata"
                problemStatement={`Match an input string against the pattern "${compiled.pattern.label}" step by step, showing the automaton state and consumed character at each step, ending in accept or reject.`}
                inputGiven={`Pattern: ${compiled.pattern.label}\nInput: ${input}`}
                discussionDefault={result.reason}
                onExport={(discussion) => buildPatternReport(compiled.pattern!, input, result, discussion)}
              />
            </div>
            <div>
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-4">
                State trace for "{compiled.pattern.label}"
              </h3>
              <PatternStepper result={result} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-text-dim">Fix the pattern to see the state trace.</div>
        )
      }
    />
  )
}

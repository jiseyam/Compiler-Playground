import { useMemo, useRef, useState } from 'react'
import { Sigma, Regex, CircleCheck, CircleX } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import SplitPane from '@/components/layout/SplitPane'
import Tabs from '@/components/ui/Tabs'
import Card from '@/components/ui/Card'
import ExportReportButton from '@/components/ui/ExportReportButton'
import ExpressionHighlighter from '@/components/viz/ExpressionHighlighter'
import PatternStepper from '@/components/viz/PatternStepper'
import { validateExpression } from '@/lib/expressionValidator'
import { PATTERNS, runPattern } from '@/lib/patternMatcher'
import { useDebounce } from '@/hooks/useDebounce'

const TABS = [
  { key: 'expression', label: 'Expression Validator' },
  { key: 'pattern', label: 'Pattern Recognizer' },
]

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
  const captureRef = useRef<HTMLDivElement>(null)

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
              captureRef={captureRef}
            />
          </div>
          <div ref={captureRef} className="flex flex-col gap-4">
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
  const [patternId, setPatternId] = useState(PATTERNS[1].id)
  const [input, setInput] = useState('aaabb')
  const debounced = useDebounce(input, 150)
  const pattern = PATTERNS.find((p) => p.id === patternId)!
  const result = useMemo(() => runPattern(pattern, debounced), [pattern, debounced])
  const captureRef = useRef<HTMLDivElement>(null)

  return (
    <SplitPane
      left={
        <div className="flex flex-col gap-4">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Pattern</label>
          <div className="flex gap-2">
            {PATTERNS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPatternId(p.id)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 ${
                  patternId === p.id
                    ? 'border-accent/40 bg-accent-soft text-text'
                    : 'border-border bg-surface text-text-muted hover:bg-surface-hover'
                }`}
              >
                <div className="font-mono text-sm text-accent">{p.label}</div>
                <div className="text-[11px] mt-0.5">{p.description}</div>
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
        </div>
      }
      right={
        <div>
          <div className="flex justify-end mb-4">
            <ExportReportButton
              moduleTitle="Pattern Recognizer"
              category="Finite Automata"
              problemStatement={`Match an input string against the pattern "${pattern.label}" step by step, showing the automaton state and consumed character at each step, ending in accept or reject.`}
              inputGiven={`Pattern: ${pattern.label}\nInput: ${input}`}
              discussionDefault={result.reason}
              captureRef={captureRef}
            />
          </div>
          <div ref={captureRef}>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-4">
              State trace for "{pattern.label}"
            </h3>
            <PatternStepper result={result} />
          </div>
        </div>
      }
    />
  )
}

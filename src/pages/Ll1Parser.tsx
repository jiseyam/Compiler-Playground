import { useEffect, useMemo, useRef, useState } from 'react'
import { Table2, Play, Pause, SkipBack, SkipForward, RotateCcw, AlertTriangle } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import SplitPane from '@/components/layout/SplitPane'
import CodeInput from '@/components/ui/CodeInput'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorPanel from '@/components/ui/ErrorPanel'
import ExportReportButton from '@/components/ui/ExportReportButton'
import ParseTable from '@/components/viz/ParseTable'
import StackAnimator from '@/components/viz/StackAnimator'
import { parseGrammar, GrammarError } from '@/lib/grammar'
import { computeFirst, computeFollow } from '@/lib/firstFollowLeading'
import { buildLl1Table, runPredictiveParse, tokenizeInput } from '@/lib/ll1'
import { useDebounce } from '@/hooks/useDebounce'
import { useLl1Store } from '@/store/ll1Store'

const SAMPLE_GRAMMAR = `E -> T E'
E' -> + T E' | #
T -> F T'
T' -> * F T' | #
F -> ( E ) | id`

export default function Ll1Parser() {
  const [source, setSource] = useState(SAMPLE_GRAMMAR)
  const [input, setInput] = useState('id + id * id')
  const debouncedSource = useDebounce(source, 150)
  const debouncedInput = useDebounce(input, 150)

  const { stepIndex, autoPlay, setStepIndex, next, prev, reset, setAutoPlay } = useLl1Store()

  const built = useMemo(() => {
    try {
      const grammar = parseGrammar(debouncedSource)
      const first = computeFirst(grammar)
      const follow = computeFollow(grammar, first)
      const table = buildLl1Table(grammar, first, follow)
      return { grammar, table, error: null as string | null }
    } catch (e) {
      const message = e instanceof GrammarError ? e.message : 'Failed to parse grammar.'
      return { grammar: null, table: null, error: message }
    }
  }, [debouncedSource])

  const parse = useMemo(() => {
    if (!built.grammar || !built.table) return null
    const tokens = tokenizeInput(debouncedInput)
    if (tokens.length === 0) return null
    return runPredictiveParse(built.grammar, built.table, tokens)
  }, [built.grammar, built.table, debouncedInput])

  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSource, debouncedInput])

  useEffect(() => {
    if (!autoPlay || !parse) return
    if (stepIndex >= parse.steps.length - 1) {
      setAutoPlay(false)
      return
    }
    const id = setTimeout(() => next(parse.steps.length - 1), 550)
    return () => clearTimeout(id)
  }, [autoPlay, stepIndex, parse, next, setAutoPlay])

  const currentStep = parse?.steps[Math.min(stepIndex, parse.steps.length - 1)]

  const highlight =
    currentStep?.action.kind === 'apply' && built.grammar
      ? { nt: currentStep.action.production.lhs, terminal: currentStep.input[0] }
      : null

  const captureRef = useRef<HTMLDivElement>(null)

  return (
    <PageShell
      title="LL(1) Parser"
      description="Build a predictive parsing table from FIRST/FOLLOW, then step through a table-driven parse."
      icon={Table2}
      tag="Predictive Parsing"
      actions={
        <ExportReportButton
          moduleTitle="LL(1) Parser"
          category="Predictive Parsing"
          problemStatement="Construct an LL(1) predictive parsing table from a grammar's FIRST/FOLLOW sets, detect conflicts, and simulate a stack-driven parse of an input string."
          inputGiven={`Grammar:\n${source}\n\nInput: ${input}`}
          discussionDefault={
            parse
              ? parse.accepted
                ? `The input string was accepted after ${parse.steps.length} parser steps.${built.table && built.table.conflicts.length ? ' Note: the table has unresolved LL(1) conflicts.' : ''}`
                : `Parsing failed: ${parse.error}`
              : 'Enter an input string to generate a discussion summary.'
          }
          captureRef={captureRef}
        />
      }
    >
      <SplitPane
        left={
          <div className="flex flex-col gap-4">
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Grammar</label>
            <CodeInput value={source} onChange={setSource} minHeight="200px" />
            {built.error && <ErrorPanel message={built.error} />}

            {built.table && built.table.conflicts.length > 0 && (
              <div className="rounded-xl border border-coral/30 bg-coral-soft p-4 text-sm text-coral">
                <div className="flex items-center gap-2 font-medium mb-2">
                  <AlertTriangle size={16} />
                  LL(1) conflict{built.table.conflicts.length > 1 ? 's' : ''} detected
                </div>
                <ul className="flex flex-col gap-1.5 list-disc list-inside">
                  {built.table.conflicts.map((c, i) => (
                    <li key={i}>
                      M[{c.nonTerminal}, {c.terminal}] is claimed by {c.productions.length} productions — the
                      grammar is not LL(1) (likely needs left-factoring or left-recursion removal).
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {built.table && (
              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Parsing table</h3>
                <ParseTable table={built.table} highlight={highlight} />
              </div>
            )}
          </div>
        }
        right={
          <div ref={captureRef} className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Input string (space-separated terminals)
              </label>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-text outline-none focus:border-accent/50 transition-colors duration-150"
                placeholder="e.g. id + id * id"
              />
            </div>

            {!parse && <p className="text-sm text-text-dim">Enter an input string to simulate the parse.</p>}

            {parse && currentStep && (
              <>
                <Card className="p-4">
                  <StackAnimator step={currentStep} />
                </Card>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setStepIndex(0)} disabled={stepIndex === 0}>
                      <SkipBack size={14} />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={prev} disabled={stepIndex === 0}>
                      Back
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => next(parse.steps.length - 1)}
                      disabled={stepIndex >= parse.steps.length - 1}
                    >
                      Step
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setStepIndex(parse.steps.length - 1)}
                      disabled={stepIndex >= parse.steps.length - 1}
                    >
                      <SkipForward size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={autoPlay ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setAutoPlay(!autoPlay)}
                      disabled={stepIndex >= parse.steps.length - 1}
                    >
                      {autoPlay ? <Pause size={14} /> : <Play size={14} />}
                      {autoPlay ? 'Pause' : 'Auto-play'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={reset}>
                      <RotateCcw size={14} />
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-text-dim">
                  Step {stepIndex + 1} of {parse.steps.length}
                </div>

                {stepIndex === parse.steps.length - 1 && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      parse.accepted
                        ? 'border-teal/30 bg-teal-soft text-teal'
                        : 'border-coral/30 bg-coral-soft text-coral'
                    }`}
                  >
                    {parse.accepted ? 'String accepted by the grammar.' : parse.error}
                  </div>
                )}
              </>
            )}
          </div>
        }
      />
    </PageShell>
  )
}

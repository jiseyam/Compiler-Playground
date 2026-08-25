import { useEffect, useMemo, useState } from 'react'
import { Table2, Play, Pause, SkipBack, SkipForward, RotateCcw, AlertTriangle } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import CodeInput from '@/components/ui/CodeInput'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ErrorPanel from '@/components/ui/ErrorPanel'
import ExportReportButton from '@/components/ui/ExportReportButton'
import ParseTable from '@/components/viz/ParseTable'
import StackTable from '@/components/viz/StackTable'
import SetTable from '@/components/viz/SetTable'
import LeftmostDerivation from '@/components/viz/LeftmostDerivation'
import ParseTreeView from '@/components/viz/ParseTreeView'
import {
  parseGrammar,
  GrammarError,
  productionsGroupedByLhs,
  productionToString,
  END_MARKER,
  type Grammar,
} from '@/lib/grammar'
import { eliminateLeftRecursion, eliminateLeftFactoring, type TransformResult } from '@/lib/grammarTransforms'
import { computeFirst, computeFollow, type SymbolSetMap } from '@/lib/firstFollowLeading'
import {
  buildLl1Table,
  runPredictiveParse,
  tokenizeInput,
  leftmostDerivationLines,
  buildParseTree,
  renderParseTreeCentered,
  type Ll1Table,
  type ParseResult,
} from '@/lib/ll1'
import { ReportBuilder, pdfFilename } from '@/lib/pdfReport'
import { useDebounce } from '@/hooks/useDebounce'
import { useLl1Store } from '@/store/ll1Store'

const SAMPLE_GRAMMAR = `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`

function buildReport(
  grammar: Grammar,
  recursion: TransformResult,
  factoring: TransformResult,
  first: SymbolSetMap,
  follow: SymbolSetMap,
  table: Ll1Table,
  inputTokens: string[],
  parse: ParseResult,
  discussion: string,
) {
  const r = new ReportBuilder(
    'LL(1) Parser',
    'Left Recursion Removal, Left Factoring, FIRST & FOLLOW, Parsing Table, Stack Implementation, and Parse Tree',
    'Compiler Playground - LL(1) Parser',
  )

  r.heading('Given Grammar')
  r.codeBlock(productionsGroupedByLhs(grammar).map((p) => p.text))
  r.keyValue([
    { label: 'Non-terminals', value: grammar.nonTerminals.join(', ') },
    { label: 'Terminals', value: grammar.terminals.join(', ') },
    { label: 'Start symbol', value: grammar.start },
  ])

  r.heading('Step 1: Remove Left Recursion')
  if (!recursion.changed) {
    r.paragraph('No left recursion was found in this grammar.')
  } else {
    recursion.steps.forEach((step, i) => {
      r.subheading(`${i + 1}. ${step.title}`)
      r.paragraph(step.detail)
      r.diffBlock(step.before, step.after)
    })
  }

  r.heading('Step 2: Remove Left Factoring')
  if (!factoring.changed) {
    r.paragraph('No left factoring was needed.')
  } else {
    factoring.steps.forEach((step, i) => {
      r.subheading(`${i + 1}. ${step.title}`)
      r.paragraph(step.detail)
      r.diffBlock(step.before, step.after)
    })
  }

  r.heading('Final Grammar')
  r.codeBlock(productionsGroupedByLhs(factoring.grammar).map((p) => p.text))

  r.heading('FIRST Sets')
  r.table({
    head: ['Non-terminal', 'FIRST'],
    rows: factoring.grammar.nonTerminals.map((nt) => [nt, `{ ${(first.get(nt) ?? []).map((e) => e.symbol).join(', ')} }`]),
    monospace: true,
  })

  r.heading('FOLLOW Sets')
  r.table({
    head: ['Non-terminal', 'FOLLOW'],
    rows: factoring.grammar.nonTerminals.map((nt) => [nt, `{ ${(follow.get(nt) ?? []).map((e) => e.symbol).join(', ')} }`]),
    monospace: true,
  })

  r.heading('Predictive Parsing Table')
  r.table({
    head: ['', ...table.cols],
    rows: table.rows.map((nt) => [
      nt,
      ...table.cols.map((t) => {
        const prods = table.cells.get(nt)?.get(t) ?? []
        return prods.map((p) => productionToString(p)).join('  |  ')
      }),
    ]),
    monospace: true,
  })

  if (table.conflicts.length > 0) {
    r.subheading('Conflicts')
    r.bulletList(
      table.conflicts.map(
        (c) =>
          `M[${c.nonTerminal}, ${c.terminal}] is claimed by ${c.productions.length} productions: ${c.productions
            .map((p) => productionToString(p))
            .join('  |  ')}`,
      ),
    )
  } else {
    r.paragraph('No cell of the table contains more than one production. The grammar is LL(1) and can be parsed without backtracking.')
  }

  r.heading('Stack Implementation')
  r.paragraph(
    `Input string: ${inputTokens.join(' ')} ${END_MARKER}. The stack is written with the bottom on the left and the top on the right; ${END_MARKER} marks the bottom of the stack and the end of input.`,
  )
  r.table({
    head: ['Stack', 'Input', 'Action'],
    rows: parse.steps.map((s) => [
      s.stack.join(' '),
      s.input.join(' '),
      s.action.kind === 'match'
        ? `match ${s.action.symbol}`
        : s.action.kind === 'apply'
          ? productionToString(s.action.production)
          : s.action.kind === 'accept'
            ? 'Accept'
            : s.action.message,
    ]),
    monospace: true,
  })

  const applySteps = parse.steps.filter((s) => s.action.kind === 'apply')
  if (applySteps.length > 0) {
    r.heading('Output (Sequence of Productions)')
    r.codeBlock(applySteps.map((s) => (s.action.kind === 'apply' ? productionToString(s.action.production) : '')))
  }

  if (parse.accepted) {
    const derivation = leftmostDerivationLines(inputTokens, parse.steps)
    if (derivation.length > 0) {
      r.heading('Leftmost Derivation')
      r.codeBlock([factoring.grammar.start, ...derivation.map((line) => `=> ${line}`)])
    }

    r.heading('Parse Tree')
    const tree = buildParseTree(factoring.grammar, parse.steps)
    r.codeBlock(renderParseTreeCentered(tree))
  }

  r.heading('Result')
  r.resultBanner(parse.accepted, parse.accepted ? 'The input string is valid — accepted by the grammar.' : 'The input string is not valid.')

  r.heading('Discussion')
  r.paragraph(discussion)

  r.save(pdfFilename('LL1 Parser'))
}

export default function Ll1Parser() {
  const [source, setSource] = useState(SAMPLE_GRAMMAR)
  const [input, setInput] = useState('id + id * id')
  const debouncedSource = useDebounce(source, 150)
  const debouncedInput = useDebounce(input, 150)

  const { stepIndex, autoPlay, setStepIndex, next, prev, reset, setAutoPlay } = useLl1Store()

  const built = useMemo(() => {
    try {
      const grammar = parseGrammar(debouncedSource)
      const recursion = eliminateLeftRecursion(grammar)
      const factoring = eliminateLeftFactoring(recursion.grammar)
      const first = computeFirst(factoring.grammar)
      const follow = computeFollow(factoring.grammar, first)
      const table = buildLl1Table(factoring.grammar, first, follow)
      return { grammar, recursion, factoring, first, follow, table, error: null as string | null }
    } catch (e) {
      const message = e instanceof GrammarError ? e.message : 'Failed to parse grammar.'
      return { grammar: null, recursion: null, factoring: null, first: null, follow: null, table: null, error: message }
    }
  }, [debouncedSource])

  const parse = useMemo(() => {
    if (!built.factoring || !built.table) return null
    const tokens = tokenizeInput(debouncedInput)
    if (tokens.length === 0) return null
    return runPredictiveParse(built.factoring.grammar, built.table, tokens)
  }, [built.factoring, built.table, debouncedInput])

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

  const atLastStep = !!parse && stepIndex >= parse.steps.length - 1
  const currentStep = parse?.steps[Math.min(stepIndex, parse.steps.length - 1)]
  const highlight =
    currentStep?.action.kind === 'apply' ? { nt: currentStep.action.production.lhs, terminal: currentStep.input[0] } : null

  return (
    <PageShell
      title="LL(1) Parser"
      description="Grammar goes through left recursion and left factoring elimination automatically, then FIRST/FOLLOW, the parsing table, and a stack-driven parse of your input string."
      icon={Table2}
      tag="Predictive Parsing"
      actions={
        <ExportReportButton
          moduleTitle="LL(1) Parser"
          category="Predictive Parsing"
          problemStatement="Eliminate left recursion and left factoring, build FIRST/FOLLOW and an LL(1) predictive parsing table, then simulate a stack-driven parse of an input string ending in its parse tree and leftmost derivation."
          inputGiven={`Grammar:\n${source}\n\nInput: ${input}`}
          discussionDefault={
            parse
              ? parse.accepted
                ? `The input string is valid and was accepted after ${parse.steps.length} parser steps.`
                : `The input string is not valid: ${parse.error}`
              : 'Enter an input string to generate a discussion summary.'
          }
          onExport={(discussion) => {
            if (built.grammar && built.recursion && built.factoring && built.first && built.follow && built.table && parse) {
              buildReport(
                built.grammar,
                built.recursion,
                built.factoring,
                built.first,
                built.follow,
                built.table,
                tokenizeInput(input),
                parse,
                discussion,
              )
            }
          }}
        />
      }
    >
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto p-5 lg:p-6 flex flex-col gap-6">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 block">Grammar</label>
            <CodeInput value={source} onChange={setSource} minHeight="140px" />
            {built.error && (
              <div className="mt-3">
                <ErrorPanel message={built.error} />
              </div>
            )}
          </div>

          {built.factoring && built.first && built.follow && built.table && (
            <>
              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Final grammar</h3>
                <Card className="p-4">
                  <ol className="flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-[13px] text-text">
                    {productionsGroupedByLhs(built.factoring.grammar).map((p, i) => (
                      <li key={p.lhs} className="flex gap-2">
                        <span className="text-text-dim w-5 text-right shrink-0">{i + 1}.</span>
                        {p.text}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
                    <span>
                      Non-terminals:{' '}
                      <span className="text-text font-mono">{built.factoring.grammar.nonTerminals.join(', ')}</span>
                    </span>
                    <span>
                      Terminals: <span className="text-text font-mono">{built.factoring.grammar.terminals.join(', ')}</span>
                    </span>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <SetTable title="FIRST" data={built.first} />
                <SetTable title="FOLLOW" data={built.follow} />
              </div>

              {built.table.conflicts.length > 0 && (
                <div className="rounded-xl border border-coral/30 bg-coral-soft p-4 text-sm text-coral">
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <AlertTriangle size={16} />
                    LL(1) conflict{built.table.conflicts.length > 1 ? 's' : ''} detected
                  </div>
                  <ul className="flex flex-col gap-1.5 list-disc list-inside">
                    {built.table.conflicts.map((c, i) => (
                      <li key={i}>
                        M[{c.nonTerminal}, {c.terminal}] is claimed by {c.productions.length} productions.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Predictive parsing table</h3>
                <ParseTable table={built.table} highlight={highlight} />
              </div>

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

              {parse && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide">Stack implementation</h3>
                  <StackTable steps={parse.steps} currentIndex={Math.min(stepIndex, parse.steps.length - 1)} />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setStepIndex(0)} disabled={stepIndex === 0}>
                        <SkipBack size={14} />
                      </Button>
                      <Button variant="secondary" size="sm" onClick={prev} disabled={stepIndex === 0}>
                        Back
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => next(parse.steps.length - 1)} disabled={atLastStep}>
                        Step
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setStepIndex(parse.steps.length - 1)} disabled={atLastStep}>
                        <SkipForward size={14} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={autoPlay ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setAutoPlay(!autoPlay)}
                        disabled={atLastStep}
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
                    Step {Math.min(stepIndex, parse.steps.length - 1) + 1} of {parse.steps.length}
                  </div>

                  {atLastStep && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                        parse.accepted
                          ? 'border-teal/30 bg-teal-soft text-teal'
                          : 'border-coral/30 bg-coral-soft text-coral'
                      }`}
                    >
                      {parse.accepted ? 'Valid — the input string is accepted by the grammar.' : 'Not valid.'}
                    </div>
                  )}

                  {atLastStep && parse.accepted && (
                    <>
                      <div>
                        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Leftmost derivation</h3>
                        <LeftmostDerivation
                          start={built.factoring.grammar.start}
                          lines={leftmostDerivationLines(tokenizeInput(debouncedInput), parse.steps)}
                        />
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Parse tree</h3>
                        <ParseTreeView lines={renderParseTreeCentered(buildParseTree(built.factoring.grammar, parse.steps))} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  )
}

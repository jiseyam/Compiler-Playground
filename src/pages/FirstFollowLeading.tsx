import { useMemo, useState } from 'react'
import { Waypoints } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import CodeInput from '@/components/ui/CodeInput'
import Card from '@/components/ui/Card'
import ErrorPanel from '@/components/ui/ErrorPanel'
import ExportReportButton from '@/components/ui/ExportReportButton'
import SetTable from '@/components/viz/SetTable'
import TransformSteps from '@/components/viz/TransformSteps'
import { parseGrammar, GrammarError, productionsGroupedByLhs, type Grammar } from '@/lib/grammar'
import { eliminateLeftRecursion, eliminateLeftFactoring, type TransformResult } from '@/lib/grammarTransforms'
import { computeFirst, computeFollow, type SymbolSetMap } from '@/lib/firstFollowLeading'
import { ReportBuilder, pdfFilename } from '@/lib/pdfReport'
import { useDebounce } from '@/hooks/useDebounce'

function buildReport(
  grammar: Grammar,
  recursion: TransformResult,
  factoring: TransformResult,
  first: SymbolSetMap,
  follow: SymbolSetMap,
  discussion: string,
) {
  const r = new ReportBuilder(
    'FIRST / FOLLOW Calculator',
    'Left Recursion Removal, Left Factoring, and FIRST & FOLLOW Sets',
    'Compiler Playground - FIRST / FOLLOW Calculator',
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
    r.paragraph('No left recursion was found in this grammar — it is left-recursion-free as given.')
  } else {
    recursion.steps.forEach((step, i) => {
      r.subheading(`${i + 1}. ${step.title}`)
      r.paragraph(step.detail)
      r.diffBlock(step.before, step.after)
    })
  }

  r.heading('Step 2: Remove Left Factoring')
  if (!factoring.changed) {
    r.paragraph('No left factoring was needed — no two alternatives of the same non-terminal share a common prefix.')
  } else {
    factoring.steps.forEach((step, i) => {
      r.subheading(`${i + 1}. ${step.title}`)
      r.paragraph(step.detail)
      r.diffBlock(step.before, step.after)
    })
  }

  r.heading('Final Grammar')
  r.paragraph('FIRST and FOLLOW below are computed on this grammar (after left recursion and left factoring elimination).')
  r.codeBlock(productionsGroupedByLhs(factoring.grammar).map((p) => p.text))
  r.keyValue([
    { label: 'Non-terminals', value: factoring.grammar.nonTerminals.join(', ') },
    { label: 'Terminals', value: factoring.grammar.terminals.join(', ') },
  ])

  r.heading('Step 3: FIRST Sets')
  r.table({
    head: ['Non-terminal', 'FIRST'],
    rows: factoring.grammar.nonTerminals.map((nt) => [nt, `{ ${(first.get(nt) ?? []).map((e) => e.symbol).join(', ')} }`]),
    monospace: true,
  })

  r.heading('Step 4: FOLLOW Sets')
  r.table({
    head: ['Non-terminal', 'FOLLOW'],
    rows: factoring.grammar.nonTerminals.map((nt) => [nt, `{ ${(follow.get(nt) ?? []).map((e) => e.symbol).join(', ')} }`]),
    monospace: true,
  })

  r.heading('Discussion')
  r.paragraph(discussion)

  r.save(pdfFilename('FIRST FOLLOW Calculator'))
}

const SAMPLE = `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`

export default function FirstFollowLeading() {
  const [source, setSource] = useState(SAMPLE)
  const debounced = useDebounce(source, 150)

  const result = useMemo(() => {
    try {
      const grammar = parseGrammar(debounced)
      const recursion = eliminateLeftRecursion(grammar)
      const factoring = eliminateLeftFactoring(recursion.grammar)
      const first = computeFirst(factoring.grammar)
      const follow = computeFollow(factoring.grammar, first)
      return { grammar, recursion, factoring, first, follow, error: null as string | null }
    } catch (e) {
      const message = e instanceof GrammarError ? e.message : 'Failed to parse grammar.'
      return { grammar: null, recursion: null, factoring: null, first: null, follow: null, error: message }
    }
  }, [debounced])

  return (
    <PageShell
      title="FIRST / FOLLOW Calculator"
      description="One production per line. Use | for alternatives and # (or ε) for epsilon. Left recursion and left factoring are removed automatically before FIRST / FOLLOW are computed."
      icon={Waypoints}
      tag="Grammar Analysis"
      actions={
        <ExportReportButton
          moduleTitle="FIRST FOLLOW Calculator"
          category="Grammar Analysis"
          problemStatement="Given a context-free grammar, eliminate left recursion and left factoring, then compute the FIRST and FOLLOW sets for every non-terminal, showing the derivation step responsible for each addition."
          inputGiven={source}
          discussionDefault={
            result.grammar
              ? `The input grammar has ${result.grammar.nonTerminals.length} non-terminal(s) and ${result.grammar.terminals.length} terminal(s). ${
                  result.recursion!.changed ? 'Left recursion was found and eliminated. ' : 'No left recursion was found. '
                }${
                  result.factoring!.changed ? 'Left factoring was applied. ' : 'No left factoring was needed. '
                }FIRST and FOLLOW were then computed via fixed-point iteration over the resulting grammar.`
              : 'Fix the grammar errors to generate a discussion summary.'
          }
          onExport={(discussion) => {
            if (result.grammar && result.recursion && result.factoring && result.first && result.follow) {
              buildReport(result.grammar, result.recursion, result.factoring, result.first, result.follow, discussion)
            }
          }}
        />
      }
    >
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto p-5 lg:p-6 flex flex-col gap-6">
          <div>
            <label className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2 block">Grammar</label>
            <CodeInput value={source} onChange={setSource} placeholder="E -> T E'" minHeight="140px" />
            {result.error && (
              <div className="mt-3">
                <ErrorPanel message={result.error} />
              </div>
            )}
            {result.grammar && (
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
                <span>
                  Non-terminals: <span className="text-text font-mono">{result.grammar.nonTerminals.join(', ')}</span>
                </span>
                <span>
                  Terminals: <span className="text-text font-mono">{result.grammar.terminals.join(', ')}</span>
                </span>
              </div>
            )}
          </div>

          {result.recursion && result.factoring && result.first && result.follow ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div>
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Left recursion</h3>
                  {result.recursion.changed ? (
                    <TransformSteps steps={result.recursion.steps} />
                  ) : (
                    <Card className="p-4 text-sm text-text-dim">No left recursion found — grammar unchanged.</Card>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Left factoring</h3>
                  {result.factoring.changed ? (
                    <TransformSteps steps={result.factoring.steps} />
                  ) : (
                    <Card className="p-4 text-sm text-text-dim">No left factoring needed — grammar unchanged.</Card>
                  )}
                </div>
              </div>

              {(result.recursion.changed || result.factoring.changed) && (
                <Card className="p-4">
                  <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                    Grammar used for FIRST / FOLLOW
                  </h3>
                  <ol className="flex flex-col gap-1.5 font-mono text-[13px] text-text">
                    {productionsGroupedByLhs(result.factoring.grammar).map((p, i) => (
                      <li key={p.lhs} className="flex gap-2">
                        <span className="text-text-dim w-5 text-right shrink-0">{i + 1}.</span>
                        {p.text}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
                    <span>
                      Non-terminals:{' '}
                      <span className="text-text font-mono">{result.factoring.grammar.nonTerminals.join(', ')}</span>
                    </span>
                    <span>
                      Terminals:{' '}
                      <span className="text-text font-mono">{result.factoring.grammar.terminals.join(', ')}</span>
                    </span>
                  </div>
                </Card>
              )}

              <div>
                <p className="text-xs text-text-dim mb-3">Hover any symbol to see why it was added.</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <SetTable title="FIRST" data={result.first} />
                  <SetTable title="FOLLOW" data={result.follow} />
                </div>
              </div>
            </div>
          ) : (
            !result.error && (
              <div className="text-sm text-text-dim">Fix the grammar to see the elimination steps and FIRST / FOLLOW sets.</div>
            )
          )}
        </div>
      </div>
    </PageShell>
  )
}

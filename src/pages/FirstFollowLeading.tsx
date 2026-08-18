import { useMemo, useRef, useState } from 'react'
import { Waypoints } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import SplitPane from '@/components/layout/SplitPane'
import CodeInput from '@/components/ui/CodeInput'
import Card from '@/components/ui/Card'
import ErrorPanel from '@/components/ui/ErrorPanel'
import ExportReportButton from '@/components/ui/ExportReportButton'
import SetTable from '@/components/viz/SetTable'
import { parseGrammar, GrammarError, productionToString } from '@/lib/grammar'
import { computeFirst, computeFollow, computeLeading } from '@/lib/firstFollowLeading'
import { useDebounce } from '@/hooks/useDebounce'

const SAMPLE = `E -> T E'
E' -> + T E' | #
T -> F T'
T' -> * F T' | #
F -> ( E ) | id`

export default function FirstFollowLeading() {
  const [source, setSource] = useState(SAMPLE)
  const debounced = useDebounce(source, 150)

  const result = useMemo(() => {
    try {
      const grammar = parseGrammar(debounced)
      const first = computeFirst(grammar)
      const follow = computeFollow(grammar, first)
      const leading = computeLeading(grammar)
      return { grammar, first, follow, leading, error: null as string | null }
    } catch (e) {
      const message = e instanceof GrammarError ? e.message : 'Failed to parse grammar.'
      return { grammar: null, first: null, follow: null, leading: null, error: message }
    }
  }, [debounced])

  const captureRef = useRef<HTMLDivElement>(null)

  return (
    <PageShell
      title="FIRST / FOLLOW / LEADING Calculator"
      description="One production per line. Use | for alternatives and # (or ε) for epsilon."
      icon={Waypoints}
      tag="Grammar Analysis"
      actions={
        <ExportReportButton
          moduleTitle="FIRST FOLLOW LEADING Calculator"
          category="Grammar Analysis"
          problemStatement="Given a context-free grammar, compute the FIRST, FOLLOW, and LEADING sets for every non-terminal, showing the derivation step responsible for each addition."
          inputGiven={source}
          discussionDefault={
            result.grammar
              ? `The grammar has ${result.grammar.nonTerminals.length} non-terminal(s) and ${result.grammar.terminals.length} terminal(s). FIRST, FOLLOW, and LEADING sets were computed via fixed-point iteration over all productions.`
              : 'Fix the grammar errors to generate a discussion summary.'
          }
          captureRef={captureRef}
        />
      }
    >
      <SplitPane
        left={
          <div className="flex flex-col gap-4">
            <CodeInput value={source} onChange={setSource} placeholder="E -> T E'" minHeight="240px" />
            {result.error && <ErrorPanel message={result.error} />}
            {result.grammar && (
              <Card className="p-4">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                  Parsed productions
                </h3>
                <ol className="flex flex-col gap-1.5 font-mono text-[13px] text-text">
                  {result.grammar.productions.map((p) => (
                    <li key={p.id} className="flex gap-2">
                      <span className="text-text-dim w-5 text-right shrink-0">{p.id}.</span>
                      {productionToString(p)}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
                  <span>
                    Non-terminals: <span className="text-text font-mono">{result.grammar.nonTerminals.join(', ')}</span>
                  </span>
                  <span>
                    Terminals: <span className="text-text font-mono">{result.grammar.terminals.join(', ')}</span>
                  </span>
                </div>
              </Card>
            )}
          </div>
        }
        right={
          result.first && result.follow && result.leading ? (
            <div ref={captureRef} className="flex flex-col gap-8">
              <p className="text-xs text-text-dim -mb-2">Hover any symbol to see why it was added.</p>
              <SetTable title="FIRST" data={result.first} />
              <SetTable title="FOLLOW" data={result.follow} />
              <SetTable title="LEADING" data={result.leading} />
            </div>
          ) : (
            <div className="text-sm text-text-dim">Fix the grammar to see FIRST / FOLLOW / LEADING sets.</div>
          )
        }
      />
    </PageShell>
  )
}

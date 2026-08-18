import { useMemo, useRef, useState } from 'react'
import { ScanText } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import SplitPane from '@/components/layout/SplitPane'
import CodeInput from '@/components/ui/CodeInput'
import Card from '@/components/ui/Card'
import ExportReportButton from '@/components/ui/ExportReportButton'
import { Table, THead, TRow, TH, TD } from '@/components/ui/Table'
import TokenChip from '@/components/viz/TokenChip'
import { tokenize, summarize } from '@/lib/lexer'
import { useDebounce } from '@/hooks/useDebounce'

const SAMPLE = `// Lab I sample program
int main() {
  int count = 0;
  float rate = 3.14;
  /* accumulate values
     while below the limit */
  while (count < 10) {
    count = count + 1;
  }
  return 0;
}
`

const LEGEND: { label: string; className: string }[] = [
  { label: 'Keyword', className: 'bg-accent-soft text-accent border-accent/30' },
  { label: 'Identifier', className: 'bg-teal-soft text-teal border-teal/30' },
  { label: 'Operator', className: 'bg-amber/15 text-amber border-amber/30' },
  { label: 'Number', className: 'bg-blue/15 text-blue border-blue/30' },
  { label: 'String', className: 'bg-teal-soft text-teal border-teal/30' },
  { label: 'Special symbol', className: 'bg-surface text-text-muted border-border' },
  { label: 'Comment (stripped)', className: 'bg-transparent text-text-dim border-border line-through' },
]

export default function Lexer() {
  const [source, setSource] = useState(SAMPLE)
  const debounced = useDebounce(source, 150)

  const tokens = useMemo(() => tokenize(debounced), [debounced])
  const summary = useMemo(() => summarize(tokens), [tokens])
  const codeTokens = tokens.filter((t) => t.type !== 'comment')
  const commentTokens = tokens.filter((t) => t.type === 'comment')
  const captureRef = useRef<HTMLDivElement>(null)

  return (
    <PageShell
      title="Lexical Analyzer"
      description="Type code on the left. Every token gets classified and colored on the right, live."
      icon={ScanText}
      lab="Lab I"
      actions={
        <ExportReportButton
          moduleTitle="Lexical Analyzer"
          lab="Lab I"
          problemStatement="Write a lexical analyzer that scans source code and classifies each token into keywords, identifiers, constants, operators, and special symbols, stripping comments in the process."
          inputGiven={source}
          discussionDefault={`The analyzer found ${codeTokens.length} tokens (${summary.keywords.length} keywords, ${summary.identifiers.length} identifiers, ${summary.numbers.length + summary.strings.length} constants, ${summary.operators.length} operators, ${summary.specials.length} special symbols) and stripped ${commentTokens.length} comment block(s).`}
          captureRef={captureRef}
        />
      }
    >
      <SplitPane
        left={
          <div className="flex flex-col gap-4">
            <CodeInput value={source} onChange={setSource} placeholder="Type or paste source code..." minHeight="420px" />
            <div className="flex flex-wrap gap-2">
              {LEGEND.map((l) => (
                <span
                  key={l.label}
                  className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-mono ${l.className}`}
                >
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        }
        right={
          <div ref={captureRef} className="flex flex-col gap-6">
            <Card className="p-4">
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                Token stream ({codeTokens.length})
              </h3>
              {codeTokens.length === 0 ? (
                <p className="text-sm text-text-dim">No tokens yet — start typing.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {codeTokens.map((t, i) => (
                    <TokenChip key={`${t.start}-${i}`} token={t} index={i} />
                  ))}
                </div>
              )}
            </Card>

            {commentTokens.length > 0 && (
              <Card className="p-4">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                  Comments stripped ({commentTokens.length})
                </h3>
                <div className="flex flex-col gap-1.5 font-mono text-[13px] text-text-dim">
                  {commentTokens.map((t, i) => (
                    <span key={i} className="line-through">
                      {t.value}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            <div>
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Summary</h3>
              <Table>
                <THead>
                  <TRow>
                    <TH>Category</TH>
                    <TH>Count</TH>
                    <TH>Values</TH>
                  </TRow>
                </THead>
                <tbody>
                  <SummaryRow label="Keywords" values={summary.keywords} />
                  <SummaryRow label="Identifiers (Variables)" values={summary.identifiers} />
                  <SummaryRow label="Constants (Numbers)" values={summary.numbers} />
                  <SummaryRow label="Constants (Strings)" values={summary.strings} />
                  <SummaryRow label="Operators" values={summary.operators} />
                  <SummaryRow label="Special Symbols" values={summary.specials} />
                </tbody>
              </Table>
            </div>
          </div>
        }
      />
    </PageShell>
  )
}

function SummaryRow({ label, values }: { label: string; values: string[] }) {
  return (
    <TRow>
      <TD className="font-sans text-text">{label}</TD>
      <TD>{values.length}</TD>
      <TD className="text-text-muted">{values.length ? values.join(', ') : '—'}</TD>
    </TRow>
  )
}

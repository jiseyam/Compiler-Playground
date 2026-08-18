import { useState } from 'react'
import { Info } from 'lucide-react'
import type { SymbolSetMap } from '@/lib/firstFollowLeading'
import { Table, THead, TRow, TH, TD } from '@/components/ui/Table'

export default function SetTable({ title, data }: { title: string; data: SymbolSetMap }) {
  const [hover, setHover] = useState<{ nt: string; symbol: string; reasons: string[] } | null>(null)

  return (
    <div>
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">{title}</h3>
      <Table>
        <THead>
          <TRow>
            <TH className="w-28">Non-terminal</TH>
            <TH>{title} set</TH>
          </TRow>
        </THead>
        <tbody>
          {Array.from(data.entries()).map(([nt, entries]) => (
            <TRow key={nt}>
              <TD className="text-accent font-medium">{nt}</TD>
              <TD>
                <div className="flex flex-wrap gap-1.5">
                  {entries.length === 0 && <span className="text-text-dim">—</span>}
                  {entries.map((e) => (
                    <span
                      key={e.symbol}
                      onMouseEnter={() => setHover({ nt, symbol: e.symbol, reasons: e.reasons })}
                      onMouseLeave={() => setHover(null)}
                      className="relative inline-flex items-center gap-1 rounded-md border border-border bg-bg-alt px-1.5 py-0.5 text-[12px] cursor-help hover:border-accent/40 hover:text-accent transition-colors duration-150"
                    >
                      {e.symbol}
                      {hover?.nt === nt && hover.symbol === e.symbol && (
                        <div className="absolute z-20 bottom-full left-0 mb-2 w-72 rounded-lg border border-border bg-surface p-3 text-left text-[12px] leading-relaxed text-text-muted shadow-xl font-sans normal-case">
                          <div className="flex items-center gap-1.5 text-text font-medium mb-1.5">
                            <Info size={12} className="text-accent" />
                            Why "{e.symbol}" ∈ {title}({nt})
                          </div>
                          <ul className="list-disc list-inside space-y-1">
                            {e.reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </span>
                  ))}
                </div>
              </TD>
            </TRow>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

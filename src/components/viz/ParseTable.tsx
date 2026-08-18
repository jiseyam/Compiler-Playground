import type { Ll1Table } from '@/lib/ll1'
import { productionToString } from '@/lib/grammar'
import { Table, THead, TRow, TH, TD } from '@/components/ui/Table'

interface ParseTableProps {
  table: Ll1Table
  highlight?: { nt: string; terminal: string } | null
}

export default function ParseTable({ table, highlight }: ParseTableProps) {
  return (
    <Table>
      <THead>
        <TRow>
          <TH className="w-24">NT \ T</TH>
          {table.cols.map((c) => (
            <TH key={c}>{c}</TH>
          ))}
        </TRow>
      </THead>
      <tbody>
        {table.rows.map((nt) => (
          <TRow key={nt}>
            <TD className="text-accent font-medium">{nt}</TD>
            {table.cols.map((col) => {
              const prods = table.cells.get(nt)?.get(col) ?? []
              const isConflict = prods.length > 1
              const isActive = highlight?.nt === nt && highlight?.terminal === col
              return (
                <TD
                  key={col}
                  className={`transition-colors duration-150 ${
                    isConflict
                      ? 'bg-coral-soft text-coral'
                      : isActive
                        ? 'bg-accent-soft text-text'
                        : 'text-text-muted'
                  }`}
                >
                  {prods.length === 0 ? (
                    <span className="text-text-dim">·</span>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {prods.map((p, i) => (
                        <span key={i} className={isConflict ? 'text-coral' : 'text-text'}>
                          {productionToString(p)}
                        </span>
                      ))}
                    </div>
                  )}
                </TD>
              )
            })}
          </TRow>
        ))}
      </tbody>
    </Table>
  )
}

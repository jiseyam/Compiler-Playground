import { useState } from 'react'
import { FileDown, X, Loader2 } from 'lucide-react'
import Button from './Button'

interface ExportReportButtonProps {
  moduleTitle: string
  category: string
  problemStatement: string
  inputGiven: string
  discussionDefault: string
  onExport: (discussion: string) => void
}

export default function ExportReportButton({
  moduleTitle,
  category,
  problemStatement,
  inputGiven,
  discussionDefault,
  onExport,
}: ExportReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [discussion, setDiscussion] = useState(discussionDefault)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setDiscussion(discussionDefault)
    setError(null)
    setOpen(true)
  }

  const handleExport = () => {
    setExporting(true)
    setError(null)
    try {
      onExport(discussion)
      setOpen(false)
    } catch {
      setError('Export failed. Try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={handleOpen}>
        <FileDown size={14} />
        Export report
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !exporting && setOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-text">Export report — {moduleTitle}</h3>
              <button
                onClick={() => setOpen(false)}
                disabled={exporting}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <div>
                <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                  Problem statement
                </div>
                <p className="text-text-muted">{problemStatement}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Input given</div>
                <p className="font-mono text-text-muted text-[13px] whitespace-pre-wrap break-all">{inputGiven}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1 block">
                  Discussion (editable)
                </label>
                <textarea
                  value={discussion}
                  onChange={(e) => setDiscussion(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-bg-alt px-3 py-2 text-sm text-text outline-none focus:border-accent/50 transition-colors duration-150 resize-y"
                />
              </div>
              <p className="text-xs text-text-dim">
                Generates a detailed, multi-page PDF ({category}) with every derivation step shown — not a screenshot.
              </p>
              {error && <p className="text-coral text-xs">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={exporting}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                {exporting ? 'Generating…' : 'Export PDF'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

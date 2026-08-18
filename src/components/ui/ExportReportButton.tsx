import { useState, type RefObject } from 'react'
import { FileDown, X, Loader2 } from 'lucide-react'
import Button from './Button'

function loadImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

interface ExportReportButtonProps {
  moduleTitle: string
  lab: string
  problemStatement: string
  inputGiven: string
  discussionDefault: string
  captureRef: RefObject<HTMLElement | null>
}

export default function ExportReportButton({
  moduleTitle,
  lab,
  problemStatement,
  inputGiven,
  discussionDefault,
  captureRef,
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

  const handleExport = async () => {
    const node = captureRef.current
    if (!node) {
      setError('Nothing to capture yet — generate some output first.')
      return
    }
    setExporting(true)
    setError(null)
    try {
      const [{ default: jsPDF }, { toPng }] = await Promise.all([import('jspdf'), import('html-to-image')])

      const imgData = await toPng(node, { backgroundColor: '#0d0d14', pixelRatio: 2, skipFonts: true })
      const naturalSize = await loadImageSize(imgData)

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 44
      const contentWidth = pageWidth - margin * 2
      let y = margin

      const section = (heading: string, body: string) => {
        doc.setFontSize(12)
        doc.setTextColor(20, 20, 30)
        doc.text(heading, margin, y)
        y += 16
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 95)
        const lines = doc.splitTextToSize(body, contentWidth)
        doc.text(lines, margin, y)
        y += lines.length * 13 + 20
      }

      doc.setFontSize(20)
      doc.setTextColor(20, 20, 30)
      doc.text(moduleTitle, margin, y)
      y += 18
      doc.setFontSize(10)
      doc.setTextColor(130, 130, 145)
      doc.text(`CSE 310 — Compiler Design · ${lab}`, margin, y)
      y += 30

      section('Problem Statement', problemStatement)
      section('Input Given', inputGiven)

      doc.setFontSize(12)
      doc.setTextColor(20, 20, 30)
      doc.text('Output', margin, y)
      y += 14

      let imgWidth = contentWidth
      let imgHeight = (naturalSize.height / naturalSize.width) * imgWidth
      const fullPageAvailable = pageHeight - margin * 2

      if (imgHeight > pageHeight - margin - y) {
        // Doesn't fit in what's left on this page — start a fresh page for it.
        doc.addPage()
        y = margin
        if (imgHeight > fullPageAvailable) {
          // Still too tall for an entire page — scale down uniformly rather than cropping.
          const scale = fullPageAvailable / imgHeight
          imgHeight = fullPageAvailable
          imgWidth = imgWidth * scale
        }
      }
      doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight)
      y += imgHeight + 24

      if (y > pageHeight - 120) {
        doc.addPage()
        y = margin
      }
      section('Discussion', discussion)

      const filename = `${moduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-lab-report.pdf`
      doc.save(filename)
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
              <h3 className="font-heading font-semibold text-text">Export as lab report</h3>
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

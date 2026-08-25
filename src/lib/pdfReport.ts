import { jsPDF } from 'jspdf'

/**
 * jsPDF's standard fonts (Helvetica/Times/Courier) only support WinAnsiEncoding.
 * Any character outside that range gets written as raw UTF-16 bytes into a
 * single-byte string, which renders as garbage (verified: 'ε' -> stray 'µ').
 * Everything that reaches the PDF goes through this map first.
 */
const PDF_UNSAFE_MAP: Record<string, string> = {
  'ε': 'eps',
  'α': 'alpha',
  'β': 'beta',
  'δ': 'delta',
  '→': '->',
  '⇒': '=>',
  '∈': 'in',
  '∪': 'union',
  '′': "'",
  '—': ' - ',
  '–': '-',
  '…': '...',
  '·': ' - ',
  '•': '-',
}

export function sanitizeForPdf(text: string): string {
  let out = text
  for (const [bad, good] of Object.entries(PDF_UNSAFE_MAP)) {
    if (out.includes(bad)) out = out.split(bad).join(good)
  }
  return out.replace(/[^\x00-\xFF]/g, '?')
}

export interface TableSpec {
  head: string[]
  rows: string[][]
  monospace?: boolean
  columnAlign?: ('left' | 'right' | 'center')[]
}

const COLOR = {
  heading: [22, 22, 32] as [number, number, number],
  accent: [99, 66, 210] as [number, number, number],
  body: [45, 45, 56] as [number, number, number],
  muted: [110, 110, 128] as [number, number, number],
  border: [205, 205, 218] as [number, number, number],
  headBg: [237, 233, 254] as [number, number, number],
  rowAltBg: [248, 247, 252] as [number, number, number],
  codeBg: [244, 244, 249] as [number, number, number],
  code: [35, 35, 45] as [number, number, number],
  calloutBg: [255, 249, 230] as [number, number, number],
  calloutBorder: [230, 200, 110] as [number, number, number],
  good: [20, 130, 100] as [number, number, number],
  bad: [190, 60, 70] as [number, number, number],
}

const MARGIN = 46

export class ReportBuilder {
  doc: jsPDF
  y: number
  pageWidth: number
  pageHeight: number
  contentWidth: number
  private footerText: string

  constructor(title: string, subtitle: string, footerText: string) {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' })
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.contentWidth = this.pageWidth - MARGIN * 2
    this.y = MARGIN
    this.footerText = footerText
    this.titleBlock(title, subtitle)
  }

  private titleBlock(title: string, subtitle: string) {
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(21)
    this.doc.setTextColor(...COLOR.heading)
    this.doc.text(sanitizeForPdf(title), MARGIN, this.y)
    this.y += 20

    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10.5)
    this.doc.setTextColor(...COLOR.muted)
    const lines = this.doc.splitTextToSize(sanitizeForPdf(subtitle), this.contentWidth) as string[]
    this.doc.text(lines, MARGIN, this.y)
    this.y += lines.length * 13 + 10

    this.doc.setDrawColor(...COLOR.border)
    this.doc.setLineWidth(1)
    this.doc.line(MARGIN, this.y, this.pageWidth - MARGIN, this.y)
    this.y += 22
  }

  /** Returns true if a new page was started. */
  private ensureSpace(needed: number): boolean {
    if (this.y + needed > this.pageHeight - MARGIN - 18) {
      this.doc.addPage()
      this.y = MARGIN
      return true
    }
    return false
  }

  heading(text: string) {
    this.ensureSpace(34)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(14)
    this.doc.setTextColor(...COLOR.accent)
    this.doc.text(sanitizeForPdf(text), MARGIN, this.y)
    this.y += 8
    this.doc.setDrawColor(...COLOR.accent)
    this.doc.setLineWidth(1.4)
    this.doc.line(MARGIN, this.y, MARGIN + 34, this.y)
    this.y += 16
  }

  subheading(text: string) {
    this.ensureSpace(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(11.5)
    this.doc.setTextColor(...COLOR.heading)
    this.doc.text(sanitizeForPdf(text), MARGIN, this.y)
    this.y += 16
  }

  paragraph(text: string) {
    if (!text) return
    this.doc.setFont('times', 'normal')
    this.doc.setFontSize(10.5)
    this.doc.setTextColor(...COLOR.body)
    const lines = this.doc.splitTextToSize(sanitizeForPdf(text), this.contentWidth) as string[]
    for (const line of lines) {
      this.ensureSpace(14)
      this.doc.text(line, MARGIN, this.y)
      this.y += 14
    }
    this.y += 6
  }

  /** "Label: value" line, e.g. "Terminals: (, ), +, id" */
  keyValue(pairs: { label: string; value: string }[]) {
    this.doc.setFontSize(9.5)
    let x = MARGIN
    const gap = 26
    for (const { label, value } of pairs) {
      const text = `${label}: `
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(...COLOR.muted)
      const labelWidth = this.doc.getTextWidth(sanitizeForPdf(text))
      this.doc.setFont('courier', 'normal')
      const valueText = sanitizeForPdf(value)
      const valueWidth = this.doc.getTextWidth(valueText)
      if (x + labelWidth + valueWidth > this.pageWidth - MARGIN) {
        x = MARGIN
        this.y += 15
        this.ensureSpace(15)
      }
      this.doc.setFont('helvetica', 'bold')
      this.doc.setTextColor(...COLOR.muted)
      this.doc.text(sanitizeForPdf(text), x, this.y)
      x += labelWidth
      this.doc.setFont('courier', 'normal')
      this.doc.setTextColor(...COLOR.heading)
      this.doc.text(valueText, x, this.y)
      x += valueWidth + gap
    }
    this.y += 20
  }

  bulletList(items: string[]) {
    this.doc.setFont('times', 'normal')
    this.doc.setFontSize(10)
    this.doc.setTextColor(...COLOR.body)
    for (const item of items) {
      const lines = this.doc.splitTextToSize(sanitizeForPdf(item), this.contentWidth - 14) as string[]
      this.ensureSpace(lines.length * 13 + 2)
      this.doc.text('-', MARGIN, this.y)
      this.doc.text(lines, MARGIN + 12, this.y)
      this.y += lines.length * 13 + 2
    }
    this.y += 6
  }

  /** Highlighted callout box for a rule/formula, e.g. "Rule: A -> Aa | b becomes ..." */
  callout(lines: string[]) {
    this.doc.setFont('courier', 'normal')
    this.doc.setFontSize(9.5)
    const lineHeight = 13
    const padding = 9
    const wrapped = lines.flatMap((l) => this.doc.splitTextToSize(sanitizeForPdf(l), this.contentWidth - padding * 2) as string[])
    const blockHeight = wrapped.length * lineHeight + padding * 2
    this.ensureSpace(blockHeight + 8)
    this.doc.setFillColor(...COLOR.calloutBg)
    this.doc.setDrawColor(...COLOR.calloutBorder)
    this.doc.setLineWidth(0.75)
    this.doc.roundedRect(MARGIN, this.y, this.contentWidth, blockHeight, 4, 4, 'FD')
    let ty = this.y + padding + 9
    this.doc.setTextColor(...COLOR.code)
    for (const line of wrapped) {
      this.doc.text(line, MARGIN + padding, ty)
      ty += lineHeight
    }
    this.y += blockHeight + 12
  }

  codeBlock(lines: string[]) {
    if (lines.length === 0) return
    this.doc.setFont('courier', 'normal')
    this.doc.setFontSize(9.5)
    const lineHeight = 13
    const padding = 10
    const wrapped = lines.flatMap((l) => this.doc.splitTextToSize(sanitizeForPdf(l), this.contentWidth - padding * 2) as string[])
    const blockHeight = wrapped.length * lineHeight + padding * 2
    this.ensureSpace(blockHeight + 8)
    this.doc.setFillColor(...COLOR.codeBg)
    this.doc.roundedRect(MARGIN, this.y, this.contentWidth, blockHeight, 4, 4, 'F')
    let ty = this.y + padding + 9
    this.doc.setTextColor(...COLOR.code)
    for (const line of wrapped) {
      this.doc.text(line, MARGIN + padding, ty)
      ty += lineHeight
    }
    this.y += blockHeight + 12
  }

  /** Two-column diff-style block: red strikethrough "before" lines above green "after" lines. */
  diffBlock(before: string[], after: string[]) {
    this.doc.setFont('courier', 'normal')
    this.doc.setFontSize(9.5)
    const lineHeight = 13
    const padding = 9
    const beforeLines = before.map((l) => sanitizeForPdf(l))
    const afterLines = after.map((l) => sanitizeForPdf(l))
    const blockHeight = (beforeLines.length + afterLines.length) * lineHeight + padding * 2 + 6
    this.ensureSpace(blockHeight + 8)
    this.doc.setFillColor(...COLOR.codeBg)
    this.doc.roundedRect(MARGIN, this.y, this.contentWidth, blockHeight, 4, 4, 'F')
    let ty = this.y + padding + 9
    this.doc.setTextColor(...COLOR.bad)
    for (const line of beforeLines) {
      this.doc.text(`- ${line}`, MARGIN + padding, ty)
      ty += lineHeight
    }
    ty += 4
    this.doc.setTextColor(...COLOR.good)
    for (const line of afterLines) {
      this.doc.text(`+ ${line}`, MARGIN + padding, ty)
      ty += lineHeight
    }
    this.y += blockHeight + 12
  }

  resultBanner(ok: boolean, text: string) {
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(10.5)
    const color = ok ? COLOR.good : COLOR.bad
    const lines = this.doc.splitTextToSize(sanitizeForPdf(text), this.contentWidth - 24) as string[]
    const lineHeight = 14
    const padding = 10
    const blockHeight = lines.length * lineHeight + padding * 2
    this.ensureSpace(blockHeight + 10)
    this.doc.setFillColor(ok ? 232 : 253, ok ? 246 : 234, ok ? 240 : 235)
    this.doc.setDrawColor(...color)
    this.doc.setLineWidth(1)
    this.doc.roundedRect(MARGIN, this.y, this.contentWidth, blockHeight, 5, 5, 'FD')
    this.doc.setTextColor(...color)
    let ty = this.y + padding + 9
    lines.forEach((line, i) => {
      this.doc.text((i === 0 ? (ok ? 'PASS  ' : 'FAIL  ') : '      ') + line, MARGIN + 12, ty)
      ty += lineHeight
    })
    this.y += blockHeight + 12
  }

  table({ head, rows, monospace, columnAlign }: TableSpec) {
    const font = monospace ? 'courier' : 'helvetica'
    const fontSize = monospace ? 8.7 : 9
    const cellPadX = 7
    const cellPadY = 6
    const lineHeight = fontSize + 3.2
    const colCount = head.length

    this.doc.setFont(font, 'normal')
    this.doc.setFontSize(fontSize)
    const rawWidths = head.map((h, i) => {
      let max = this.doc.getTextWidth(sanitizeForPdf(h)) + 4
      for (const r of rows) max = Math.max(max, this.doc.getTextWidth(sanitizeForPdf(r[i] ?? '')))
      return Math.min(max + cellPadX * 2, this.contentWidth * 0.6)
    })
    const totalRaw = rawWidths.reduce((a, b) => a + b, 0)
    const widths =
      totalRaw <= this.contentWidth
        ? rawWidths.map((w, i) => w + (i === colCount - 1 ? this.contentWidth - totalRaw : 0))
        : rawWidths.map((w) => (w * this.contentWidth) / totalRaw)

    const drawRow = (cells: string[], opts: { bold?: boolean; fill?: [number, number, number]; textColor?: [number, number, number] }) => {
      this.doc.setFont(font, opts.bold ? 'bold' : 'normal')
      this.doc.setFontSize(fontSize)
      const wrapped = cells.map((c, i) => this.doc.splitTextToSize(sanitizeForPdf(c || ''), widths[i] - cellPadX * 2) as string[])
      const rowLines = Math.max(...wrapped.map((w) => w.length), 1)
      const rowHeight = rowLines * lineHeight + cellPadY * 2
      const broke = this.ensureSpace(rowHeight)
      if (broke && !opts.bold) drawRow(head, { bold: true, fill: COLOR.headBg, textColor: COLOR.heading })

      let x = MARGIN
      if (opts.fill) {
        this.doc.setFillColor(...opts.fill)
        this.doc.rect(MARGIN, this.y, this.contentWidth, rowHeight, 'F')
      }
      this.doc.setDrawColor(...COLOR.border)
      this.doc.setLineWidth(0.5)
      this.doc.setTextColor(...(opts.textColor ?? COLOR.body))
      for (let i = 0; i < colCount; i++) {
        this.doc.rect(x, this.y, widths[i], rowHeight)
        const align = columnAlign?.[i] ?? 'left'
        let ty = this.y + cellPadY + fontSize * 0.85
        for (const line of wrapped[i]) {
          const lineWidth = this.doc.getTextWidth(line)
          const tx = align === 'right' ? x + widths[i] - cellPadX - lineWidth : align === 'center' ? x + (widths[i] - lineWidth) / 2 : x + cellPadX
          this.doc.text(line, tx, ty)
          ty += lineHeight
        }
        x += widths[i]
      }
      this.y += rowHeight
    }

    drawRow(head, { bold: true, fill: COLOR.headBg, textColor: COLOR.heading })
    rows.forEach((r, i) => drawRow(r, { fill: i % 2 === 1 ? COLOR.rowAltBg : undefined }))
    this.y += 14
  }

  spacer(n = 10) {
    this.y += n
  }

  save(filename: string) {
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(8.5)
      this.doc.setTextColor(...COLOR.muted)
      this.doc.text(sanitizeForPdf(this.footerText), MARGIN, this.pageHeight - 22)
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - MARGIN, this.pageHeight - 22, { align: 'right' })
    }
    this.doc.save(filename)
  }
}

export function pdfFilename(moduleTitle: string): string {
  return `${moduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report.pdf`
}

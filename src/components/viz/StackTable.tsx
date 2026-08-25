import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ParseStep } from '@/lib/ll1'
import { productionToString } from '@/lib/grammar'

function actionText(step: ParseStep): string {
  switch (step.action.kind) {
    case 'match':
      return `match ${step.action.symbol}`
    case 'apply':
      return productionToString(step.action.production)
    case 'accept':
      return 'Accept'
    case 'error':
      return step.action.message
  }
}

function actionTone(step: ParseStep): 'accent' | 'teal' | 'coral' {
  switch (step.action.kind) {
    case 'match':
      return 'teal'
    case 'apply':
      return 'accent'
    case 'accept':
      return 'teal'
    case 'error':
      return 'coral'
  }
}

export default function StackTable({ steps, currentIndex }: { steps: ParseStep[]; currentIndex: number }) {
  const visible = steps.slice(0, currentIndex + 1)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [currentIndex])

  return (
    <div ref={scrollRef} className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-surface text-text-muted text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left font-medium px-3 py-2.5">Stack</th>
            <th className="text-left font-medium px-3 py-2.5">Input</th>
            <th className="text-left font-medium px-3 py-2.5">Action</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {visible.map((step, i) => {
              const isCurrent = i === visible.length - 1
              const tone = actionTone(step)
              return (
                <motion.tr
                  key={step.index}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`border-t border-border ${
                    isCurrent ? (tone === 'coral' ? 'bg-coral-soft' : tone === 'teal' ? 'bg-teal-soft' : 'bg-accent-soft') : ''
                  }`}
                >
                  <td className="px-3 py-2.5 align-top font-mono text-[13px] text-text whitespace-nowrap">{step.stack.join(' ')}</td>
                  <td className="px-3 py-2.5 align-top font-mono text-[13px] text-text-muted whitespace-nowrap">{step.input.join(' ')}</td>
                  <td
                    className={`px-3 py-2.5 align-top font-mono text-[13px] whitespace-nowrap ${
                      tone === 'coral' ? 'text-coral' : tone === 'teal' ? 'text-teal' : 'text-accent'
                    }`}
                  >
                    {actionText(step)}
                  </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}

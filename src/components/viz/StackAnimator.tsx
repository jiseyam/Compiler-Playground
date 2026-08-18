import { AnimatePresence, motion } from 'framer-motion'
import type { ParseStep } from '@/lib/ll1'
import { productionToString } from '@/lib/grammar'
import { END_MARKER } from '@/lib/grammar'

function actionLabel(step: ParseStep): { text: string; tone: 'accent' | 'teal' | 'coral' } {
  switch (step.action.kind) {
    case 'match':
      return { text: `Match "${step.action.symbol}"`, tone: 'teal' }
    case 'apply':
      return { text: `Apply ${productionToString(step.action.production)}`, tone: 'accent' }
    case 'accept':
      return { text: 'Accept — input fully consumed', tone: 'teal' }
    case 'error':
      return { text: step.action.message, tone: 'coral' }
  }
}

export default function StackAnimator({ step }: { step: ParseStep }) {
  const label = actionLabel(step)
  const stackFromTop = [...step.stack].reverse()

  return (
    <div className="flex flex-col gap-5">
      <div
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
          label.tone === 'teal'
            ? 'border-teal/30 bg-teal-soft text-teal'
            : label.tone === 'coral'
              ? 'border-coral/30 bg-coral-soft text-coral'
              : 'border-accent/30 bg-accent-soft text-accent'
        }`}
      >
        {label.text}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Stack (top first)</h4>
          <div className="flex flex-col-reverse gap-1.5 items-start">
            <AnimatePresence initial={false}>
              {stackFromTop
                .slice()
                .reverse()
                .map((sym, i) => (
                  <motion.div
                    key={`${i}-${sym}`}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    className={`font-mono text-sm rounded-md border px-3 py-1.5 min-w-[3rem] text-center ${
                      i === 0
                        ? 'border-accent/50 bg-accent-soft text-accent font-semibold'
                        : sym === END_MARKER
                          ? 'border-border bg-bg-alt text-text-dim'
                          : 'border-border bg-surface text-text'
                    }`}
                  >
                    {sym}
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Remaining input</h4>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence initial={false}>
              {step.input.map((sym, i) => (
                <motion.span
                  key={`${i}-${sym}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`font-mono text-sm rounded-md border px-2.5 py-1 ${
                    i === 0
                      ? 'border-teal/50 bg-teal-soft text-teal font-semibold'
                      : 'border-border bg-surface text-text-muted'
                  }`}
                >
                  {sym}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

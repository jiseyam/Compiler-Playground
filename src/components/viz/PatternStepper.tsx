import { motion } from 'framer-motion'
import { ArrowRight, CircleCheck, CircleX } from 'lucide-react'
import type { MatchResult } from '@/lib/patternMatcher'

export default function PatternStepper({ result }: { result: MatchResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {result.steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: i * 0.06 }}
            className="flex items-center gap-2"
          >
            <div className="flex flex-col items-center">
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-full border font-mono text-sm ${
                  step.toState === null
                    ? 'border-coral/40 bg-coral-soft text-coral'
                    : 'border-accent/40 bg-accent-soft text-accent'
                }`}
              >
                {step.toState === null ? '×' : `q${step.toState}`}
              </span>
              {step.char && <span className="mt-1 text-[11px] text-text-dim font-mono">'{step.char}'</span>}
            </div>
            {i < result.steps.length - 1 && <ArrowRight size={14} className="text-text-dim shrink-0" />}
          </motion.div>
        ))}
      </div>

      <div
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
          result.accepted
            ? 'border-teal/30 bg-teal-soft text-teal'
            : 'border-coral/30 bg-coral-soft text-coral'
        }`}
      >
        {result.accepted ? <CircleCheck size={16} /> : <CircleX size={16} />}
        <span>{result.reason}</span>
      </div>
    </div>
  )
}

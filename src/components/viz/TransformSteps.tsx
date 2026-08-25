import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'
import type { TransformStep } from '@/lib/grammarTransforms'

export default function TransformSteps({ steps }: { steps: TransformStep[] }) {
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: i * 0.05 }}
        >
          <Card className="p-4">
            <div className="text-sm font-medium text-text mb-1">
              {i + 1}. {step.title}
            </div>
            <p className="text-xs text-text-muted mb-3 leading-relaxed">{step.detail}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex-1 flex flex-col gap-1 font-mono text-[13px] min-w-0">
                {step.before.map((line, j) => (
                  <div key={j} className="text-coral/90 line-through decoration-coral/40 break-all">
                    {line}
                  </div>
                ))}
              </div>
              <ArrowRight size={14} className="text-text-dim shrink-0 hidden sm:block" />
              <div className="flex-1 flex flex-col gap-1 font-mono text-[13px] min-w-0">
                {step.after.map((line, j) => (
                  <div key={j} className="text-teal break-all">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

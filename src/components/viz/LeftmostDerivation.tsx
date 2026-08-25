import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'

export default function LeftmostDerivation({ start, lines }: { start: string; lines: string[] }) {
  return (
    <Card className="p-4 overflow-x-auto">
      <div className="flex flex-col gap-1.5 font-mono text-[13px] text-text whitespace-nowrap">
        <div>{start}</div>
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: i * 0.05 }}
            className="flex gap-2"
          >
            <span className="text-text-dim shrink-0">{'⇒'}</span>
            <span>{line}</span>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}

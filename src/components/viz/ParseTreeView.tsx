import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'

export default function ParseTreeView({ lines }: { lines: string[] }) {
  return (
    <Card className="p-4 overflow-x-auto">
      <div className="flex flex-col font-mono text-[13px] text-text whitespace-pre">
        {lines.map((line, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, delay: i * 0.02 }}>
            {line}
          </motion.div>
        ))}
      </div>
    </Card>
  )
}

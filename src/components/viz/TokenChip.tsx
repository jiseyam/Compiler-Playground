import { motion } from 'framer-motion'
import type { Token } from '@/lib/lexer'

const STYLES: Record<Token['type'], string> = {
  keyword: 'bg-accent-soft text-accent border-accent/30',
  identifier: 'bg-teal-soft text-teal border-teal/30',
  operator: 'bg-amber/15 text-amber border-amber/30',
  number: 'bg-blue/15 text-blue border-blue/30',
  string: 'bg-teal-soft text-teal border-teal/30',
  special: 'bg-surface text-text-muted border-border',
  comment: 'bg-transparent text-text-dim border-border line-through',
  unknown: 'bg-coral-soft text-coral border-coral/30',
}

export default function TokenChip({ token, index }: { token: Token; index: number }) {
  const display = token.value === '\n' ? '\\n' : token.value
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.012, 0.4) }}
      className={`inline-flex items-center rounded-md border px-2 py-1 font-mono text-[13px] leading-none ${STYLES[token.type]}`}
      title={`${token.type} · line ${token.line}`}
    >
      {display}
    </motion.span>
  )
}

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageShellProps {
  title: string
  description?: string
  icon?: LucideIcon
  tag?: string
  actions?: ReactNode
  children: ReactNode
}

export default function PageShell({ title, description, icon: Icon, tag, actions, children }: PageShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col flex-1 min-h-0"
    >
      <header className="border-b border-border px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          {Icon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-0.5 flex items-center justify-center w-9 h-9 rounded-lg bg-accent-soft text-accent shrink-0"
            >
              <Icon size={18} strokeWidth={1.75} />
            </motion.div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-heading font-semibold text-text">{title}</h1>
              {tag && (
                <span className="text-[11px] font-medium text-teal bg-teal-soft border border-teal/30 rounded-full px-2 py-0.5">
                  {tag}
                </span>
              )}
            </div>
            {description && <p className="text-sm text-text-muted mt-1 max-w-2xl">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="flex-1 min-h-0">{children}</div>
    </motion.div>
  )
}

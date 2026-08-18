import { motion } from 'framer-motion'
import { ExternalLink, Terminal } from 'lucide-react'
import { modules } from '@/lib/modules'
import { Table, THead, TRow, TH, TD } from '@/components/ui/Table'

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="max-w-3xl mx-auto px-6 py-16"
    >
      <div className="flex items-center gap-2 text-accent mb-4">
        <Terminal size={20} />
        <span className="text-sm font-medium">About</span>
      </div>
      <h1 className="text-3xl font-heading font-semibold text-text mb-4">Compiler Playground</h1>
      <p className="text-text-muted leading-relaxed mb-6">
        Compiler Playground is an interactive companion to a Compiler Design course (CSE 310). Instead of reading
        static pseudocode, you type in source code, a grammar, or a string, and watch the classic compiler
        algorithms run — token by token, set by set, stack push by stack push.
      </p>
      <p className="text-text-muted leading-relaxed mb-10">
        Every module keeps its algorithm logic in a small, dependency-free TypeScript module, separate from the
        visualization — the same logic you'd write in a lab report, just animated instead of printed.
      </p>

      <h2 className="text-lg font-heading font-semibold text-text mb-4">Syllabus mapping</h2>
      <Table>
        <THead>
          <TRow>
            <TH>Module</TH>
            <TH>Lab reference</TH>
          </TRow>
        </THead>
        <tbody>
          {modules.map((m) => (
            <TRow key={m.path}>
              <TD className="font-sans text-text">{m.title}</TD>
              <TD className="text-text-muted">{m.lab}</TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      <div className="mt-12 pt-8 border-t border-border flex items-center justify-between text-sm text-text-muted">
        <span>Built for CSE 310, Compiler Design.</span>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-text transition-colors duration-150"
        >
          <ExternalLink size={15} /> GitHub
        </a>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { ExternalLink, SquareTerminal, Sparkles, Code2, Eye } from 'lucide-react'
import { modules } from '@/lib/modules'
import { Table, THead, TRow, TH, TD } from '@/components/ui/Table'

const PRINCIPLES = [
  {
    icon: Eye,
    title: 'See it, don’t just read it',
    body: 'Every algorithm runs step by step in front of you — tokens light up, sets build live, stacks push and pop — instead of a wall of pseudocode.',
  },
  {
    icon: Code2,
    title: 'Logic separate from visuals',
    body: 'Each module keeps its algorithm in a small, dependency-free TypeScript module, fully unit-tested, cleanly separated from the animation layer.',
  },
  {
    icon: Sparkles,
    title: 'Nothing to install',
    body: 'Everything runs client-side in your browser. No backend, no accounts — open a module and start typing.',
  },
]

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="max-w-3xl mx-auto px-6 py-16 sm:py-20"
    >
      <div className="flex items-center gap-2 text-accent mb-4">
        <SquareTerminal size={20} />
        <span className="text-sm font-medium">About</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-text mb-4 tracking-tight">
        Compiler Playground
      </h1>
      <p className="text-text-muted leading-relaxed mb-10 text-[15px]">
        Compiler theory is usually taught as a wall of pseudocode and static diagrams. Compiler Playground turns it
        into something you can poke at: type in code, a grammar, or a string, and watch the classic algorithms run
        in real time — token by token, set by set, stack push by stack push.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {PRINCIPLES.map((p) => (
          <div key={p.title} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-soft text-accent mb-3">
              <p.icon size={16} strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-semibold text-text mb-1.5">{p.title}</h3>
            <p className="text-[13px] text-text-muted leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-heading font-semibold text-text mb-4">What's covered</h2>
      <Table>
        <THead>
          <TRow>
            <TH>Module</TH>
            <TH>Topic</TH>
          </TRow>
        </THead>
        <tbody>
          {modules.map((m) => (
            <TRow key={m.path}>
              <TD className="font-sans text-text">{m.title}</TD>
              <TD className="text-text-muted">{m.tag}</TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      <div className="mt-12 pt-8 border-t border-border flex items-center justify-between text-sm text-text-muted">
        <span>Compiler Playground — learn compilers by watching them think.</span>
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

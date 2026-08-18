import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink, Keyboard, Eye, Lightbulb } from 'lucide-react'
import { modules } from '@/lib/modules'

const DEMO_TOKENS: { text: string; type: 'keyword' | 'identifier' | 'special' | 'operator' | 'number' }[] = [
  { text: 'function', type: 'keyword' },
  { text: 'sum', type: 'identifier' },
  { text: '(', type: 'special' },
  { text: 'a', type: 'identifier' },
  { text: ',', type: 'special' },
  { text: 'b', type: 'identifier' },
  { text: ')', type: 'special' },
  { text: '{', type: 'special' },
  { text: 'return', type: 'keyword' },
  { text: 'a', type: 'identifier' },
  { text: '+', type: 'operator' },
  { text: 'b', type: 'identifier' },
  { text: '*', type: 'operator' },
  { text: '2', type: 'number' },
  { text: ';', type: 'special' },
  { text: '}', type: 'special' },
]

const TOKEN_STYLES: Record<string, string> = {
  keyword: 'bg-accent-soft text-accent border-accent/30',
  identifier: 'bg-teal-soft text-teal border-teal/30',
  special: 'bg-surface text-text-muted border-border',
  operator: 'bg-amber/15 text-amber border-amber/30',
  number: 'bg-blue/15 text-blue border-blue/30',
}

function LiveDemoStrip() {
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const holdMs = 2600
    const revealMs = DEMO_TOKENS.length * 65
    const id = setTimeout(() => setCycle((c) => c + 1), revealMs + holdMs)
    return () => clearTimeout(id)
  }, [cycle])

  return (
    <div className="flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto min-h-[64px] items-center">
      {DEMO_TOKENS.map((t, i) => (
        <motion.span
          key={`${cycle}-${i}`}
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.065, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-flex items-center rounded-md border px-2 py-1 font-mono text-[12.5px] leading-none ${TOKEN_STYLES[t.type]}`}
        >
          {t.text}
        </motion.span>
      ))}
    </div>
  )
}

const STEPS = [
  {
    icon: Keyboard,
    title: 'Type your input',
    body: 'Paste code, write a grammar, or enter a string — whatever the module needs.',
  },
  {
    icon: Eye,
    title: 'Watch it animate',
    body: 'Every step of the algorithm plays out on screen instead of jumping straight to the answer.',
  },
  {
    icon: Lightbulb,
    title: 'See why, not just what',
    body: 'Hover a result to see the exact rule or derivation step that produced it.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-dot-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div
          aria-hidden
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-accent/20 blur-[110px] animate-blob-a"
        />
        <div
          aria-hidden
          className="absolute top-10 -right-32 w-[460px] h-[460px] rounded-full bg-teal/15 blur-[120px] animate-blob-b"
        />

        <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent-soft border border-accent/30 rounded-full px-3 py-1 mb-6"
          >
            Interactive compiler theory
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl font-heading font-semibold text-text leading-[1.08] tracking-tight"
          >
            Learn compilers by
            <br />
            watching them <span className="text-accent">think</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mt-6 text-base sm:text-lg text-text-muted max-w-2xl mx-auto"
          >
            Type in code, a grammar, or a string — and watch tokens light up, FIRST/FOLLOW sets build
            themselves, a parser stack animate step by step, or an NFA fold into a DFA on screen.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="mt-10 flex items-center justify-center gap-3"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/lexer"
                className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors duration-150 shadow-[0_0_0_1px_rgba(124,92,255,0.4)]"
              >
                Start with the Lexer
                <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <a
                href="#modules"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-surface-hover transition-colors duration-150"
              >
                Browse modules
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-16"
          >
            <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm px-6 py-6 max-w-2xl mx-auto">
              <div className="text-[11px] font-medium text-text-dim uppercase tracking-widest mb-4">
                Live · Lexical Analyzer
              </div>
              <LiveDemoStrip />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20 sm:py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ staggerChildren: 0.1 }}
          className="grid sm:grid-cols-3 gap-8"
        >
          {STEPS.map((s, i) => (
            <motion.div key={s.title} variants={fadeUp} transition={{ duration: 0.4 }} className="relative text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent-soft text-accent shrink-0">
                  <s.icon size={17} strokeWidth={1.75} />
                </div>
                <span className="text-xs font-medium text-text-dim">Step {i + 1}</span>
              </div>
              <h3 className="font-heading font-semibold text-text mb-1.5">{s.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="modules" className="max-w-6xl mx-auto px-6 py-16 sm:py-20 border-t border-border">
        <div className="mb-10">
          <h2 className="text-2xl font-heading font-semibold text-text">Modules</h2>
          <p className="text-sm text-text-muted mt-1">Six interactive tools, one per core topic.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <motion.div
              key={m.path}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Link
                to={m.path}
                className="group flex flex-col h-full rounded-2xl border border-border bg-surface p-5 transition-[border-color,background-color,box-shadow] duration-200 hover:border-accent/30 hover:bg-surface-hover hover:shadow-[0_16px_40px_-16px_rgba(124,92,255,0.35)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    whileHover={{ rotate: -6, scale: 1.08 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-soft text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-200"
                  >
                    <m.icon size={19} strokeWidth={1.75} />
                  </motion.div>
                  <span className="text-[11px] font-medium text-text-muted border border-border rounded-full px-2 py-0.5">
                    {m.tag}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-text mb-1.5">{m.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{m.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Open module
                  <motion.span className="inline-flex" initial={{ x: 0 }} whileHover={{ x: 3 }}>
                    <ArrowRight size={14} />
                  </motion.span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
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
      </footer>
    </div>
  )
}

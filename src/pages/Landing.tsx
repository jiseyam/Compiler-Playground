import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { modules } from '@/lib/modules'

export default function Landing() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-dot-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute inset-0 glow-radial" />
        <div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-block text-xs font-medium text-accent bg-accent-soft border border-accent/30 rounded-full px-3 py-1 mb-6"
          >
            CSE 310 · Compiler Design
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
            <Link
              to="/lexer"
              className="inline-flex items-center gap-2 rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-hover transition-colors duration-150 shadow-[0_0_0_1px_rgba(124,92,255,0.4)]"
            >
              Start with the Lexer
              <ArrowRight size={16} />
            </Link>
            <a
              href="#modules"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-surface-hover transition-colors duration-150"
            >
              Browse modules
            </a>
          </motion.div>
        </div>
      </section>

      <section id="modules" className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="mb-10">
          <h2 className="text-2xl font-heading font-semibold text-text">Modules</h2>
          <p className="text-sm text-text-muted mt-1">Six interactive tools, one per core topic in the syllabus.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <motion.div
              key={m.path}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                to={m.path}
                className="group flex flex-col h-full rounded-2xl border border-border bg-surface p-5 hover:border-border-hover hover:bg-surface-hover transition-colors duration-150 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-soft text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-150">
                    <m.icon size={19} strokeWidth={1.75} />
                  </div>
                  <span className="text-[11px] font-medium text-text-muted border border-border rounded-full px-2 py-0.5">
                    {m.lab}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-text mb-1.5">{m.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{m.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  Open module <ArrowRight size={14} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <span>Compiler Playground — built for CSE 310, Compiler Design.</span>
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

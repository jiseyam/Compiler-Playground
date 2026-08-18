import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, SquareTerminal, Info, ArrowUpRight, Sparkles } from 'lucide-react'
import { modules } from '@/lib/modules'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-accent to-[#5A3FE0] shadow-[0_4px_14px_-4px_rgba(124,92,255,0.7)] shrink-0">
        <SquareTerminal size={16} className="text-white" strokeWidth={2.25} />
      </div>
      <span className="font-heading font-semibold text-text leading-none">
        Compiler<span className="text-text-muted font-medium"> Playground</span>
      </span>
    </div>
  )
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="flex flex-col gap-4">
      <div>
        <div className="px-3 mb-2 text-[10.5px] font-semibold tracking-widest text-text-dim uppercase">Modules</div>
        <div className="flex flex-col gap-0.5">
          {modules.map((m) => {
            const active = isActive(m.path)
            return (
              <NavLink
                key={m.path}
                to={m.path}
                onClick={onNavigate}
                title={m.title}
                className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-surface-hover"
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                    className="absolute inset-0 rounded-lg bg-accent-soft border border-accent/30"
                  />
                )}
                <m.icon
                  size={17}
                  strokeWidth={1.75}
                  className={`relative shrink-0 transition-colors duration-150 ${active ? 'text-accent' : 'text-text-muted group-hover:text-text'}`}
                />
                <span
                  className={`relative truncate transition-colors duration-150 ${active ? 'text-text font-medium' : 'text-text-muted'}`}
                >
                  {m.title}
                </span>
              </NavLink>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <NavLink
          to="/about"
          onClick={onNavigate}
          className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-surface-hover"
        >
          {isActive('/about') && (
            <motion.span
              layoutId="sidebar-active-pill"
              transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              className="absolute inset-0 rounded-lg bg-accent-soft border border-accent/30"
            />
          )}
          <Info
            size={17}
            strokeWidth={1.75}
            className={`relative shrink-0 transition-colors duration-150 ${isActive('/about') ? 'text-accent' : 'text-text-muted'}`}
          />
          <span
            className={`relative transition-colors duration-150 ${isActive('/about') ? 'text-text font-medium' : 'text-text-muted'}`}
          >
            About
          </span>
        </NavLink>
      </div>
    </nav>
  )
}

function StartHereCard({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <NavLink
      to="/lexer"
      onClick={onNavigate}
      className="group relative flex items-center gap-3 rounded-xl border border-border bg-surface p-3 overflow-hidden transition-colors duration-150 hover:border-accent/30 hover:bg-surface-hover"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-br from-accent/10 via-transparent to-transparent" />
      <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-accent-soft text-accent shrink-0">
        <Sparkles size={14} />
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="text-[10.5px] text-text-dim uppercase tracking-wide leading-tight">New here?</div>
        <div className="text-[13px] font-medium text-text leading-tight">Start with the Lexer</div>
      </div>
      <ArrowUpRight
        size={14}
        className="relative shrink-0 text-text-dim transition-all duration-200 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </NavLink>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg-alt/95 backdrop-blur px-4 py-3">
        <NavLink to="/">
          <Logo />
        </NavLink>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-150"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-72 max-w-[85%] bg-bg-alt border-r border-border p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-150"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <div className="mt-auto pt-4">
              <StartHereCard onNavigate={() => setOpen(false)} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-border bg-bg-alt px-4 py-5">
        <NavLink to="/" className="px-2 mb-8">
          <Logo />
        </NavLink>
        <NavItems />
        <div className="mt-auto pt-4">
          <StartHereCard />
        </div>
      </aside>
    </>
  )
}

import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, SquareTerminal } from 'lucide-react'
import { modules } from '@/lib/modules'

function Logo() {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-accent to-[#5A3FE0] shadow-[0_4px_14px_-4px_rgba(124,92,255,0.7)]">
        <SquareTerminal size={16} className="text-white" strokeWidth={2.25} />
      </div>
      <span className="font-heading font-semibold text-text leading-none whitespace-nowrap">
        Compiler<span className="text-text-muted font-medium"> Playground</span>
      </span>
    </div>
  )
}

const navEntries = modules.map((m) => ({ path: m.path, label: m.navLabel, icon: m.icon }))

function DesktopLinks() {
  const location = useLocation()

  return (
    <nav className="hidden xl:flex items-center gap-1">
      {navEntries.map((item) => {
        const active = location.pathname === item.path
        return (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors duration-150 hover:text-text"
          >
            {active && (
              <motion.span
                layoutId="topnav-active-pill"
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                className="absolute inset-0 rounded-lg bg-accent-soft border border-accent/30"
              />
            )}
            <item.icon
              size={15}
              strokeWidth={1.75}
              className={`relative shrink-0 transition-colors duration-150 ${active ? 'text-accent' : 'text-text-muted'}`}
            />
            <span className={`relative transition-colors duration-150 ${active ? 'text-text font-medium' : 'text-text-muted'}`}>
              {item.label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const location = useLocation()

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="xl:hidden absolute left-0 right-0 top-full border-b border-border bg-bg-alt/98 backdrop-blur-md shadow-2xl z-40"
    >
      <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-0.5">
        {navEntries.map((item) => {
          const active = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                active ? 'bg-accent-soft text-text border border-accent/30' : 'text-text-muted hover:bg-surface-hover hover:text-text border border-transparent'
              }`}
            >
              <item.icon size={16} strokeWidth={1.75} className={active ? 'text-accent' : ''} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </motion.div>
  )
}

export default function TopNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-alt/90 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <NavLink to="/" onClick={() => setOpen(false)}>
          <Logo />
        </NavLink>

        <DesktopLinks />

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setOpen((v) => !v)}
            className="xl:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors duration-150"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>{open && <MobileMenu onClose={() => setOpen(false)} />}</AnimatePresence>
    </header>
  )
}

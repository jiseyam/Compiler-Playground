import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Terminal, Info } from 'lucide-react'
import { modules } from '@/lib/modules'

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {modules.map((m) => (
        <NavLink
          key={m.path}
          to={m.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
              isActive
                ? 'bg-accent-soft text-text border border-accent/30'
                : 'text-text-muted hover:bg-surface-hover hover:text-text border border-transparent'
            }`
          }
        >
          <m.icon size={17} strokeWidth={1.75} className="shrink-0" />
          <span className="truncate">{m.title}</span>
        </NavLink>
      ))}
      <NavLink
        to="/about"
        onClick={onNavigate}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 mt-2 border-t border-border pt-4 ${
            isActive ? 'text-text' : 'text-text-muted hover:text-text'
          }`
        }
      >
        <Info size={17} strokeWidth={1.75} className="shrink-0" />
        <span>About</span>
      </NavLink>
    </nav>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg-alt/95 backdrop-blur px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 font-heading font-semibold text-text">
          <Terminal size={20} className="text-accent" />
          Compiler Playground
        </NavLink>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85%] bg-bg-alt border-r border-border p-4 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <span className="font-heading font-semibold text-text">Modules</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-border bg-bg-alt px-4 py-5">
        <NavLink to="/" className="flex items-center gap-2 px-2 mb-8 font-heading font-semibold text-text">
          <Terminal size={20} className="text-accent" />
          <span>Compiler Playground</span>
        </NavLink>
        <NavItems />
        <div className="mt-auto pt-4 text-xs text-text-dim px-2">CSE 310 · Compiler Design</div>
      </aside>
    </>
  )
}

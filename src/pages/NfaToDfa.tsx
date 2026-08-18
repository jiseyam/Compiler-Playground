import { useMemo, useRef, useState } from 'react'
import { GitBranch } from 'lucide-react'
import PageShell from '@/components/layout/PageShell'
import SplitPane from '@/components/layout/SplitPane'
import ErrorPanel from '@/components/ui/ErrorPanel'
import ExportReportButton from '@/components/ui/ExportReportButton'
import { Table, THead, TRow, TH, TD } from '@/components/ui/Table'
import GraphCanvas from '@/components/viz/GraphCanvas'
import { parseNfaDsl, subsetConstruction, NfaError, NFA_EPSILON } from '@/lib/nfaToDfa'
import { NFA_PRESETS } from '@/lib/nfaPresets'
import { useDebounce } from '@/hooks/useDebounce'

export default function NfaToDfa() {
  const [presetId, setPresetId] = useState(NFA_PRESETS[0].id)
  const preset = NFA_PRESETS.find((p) => p.id === presetId)!

  const [form, setForm] = useState(preset)
  const debounced = useDebounce(form, 200)

  const loadPreset = (id: string) => {
    const p = NFA_PRESETS.find((x) => x.id === id)!
    setPresetId(id)
    setForm(p)
  }

  const built = useMemo(() => {
    try {
      const nfa = parseNfaDsl(debounced)
      const dfa = subsetConstruction(nfa)
      return { nfa, dfa, error: null as string | null }
    } catch (e) {
      const message = e instanceof NfaError ? e.message : 'Failed to parse NFA definition.'
      return { nfa: null, dfa: null, error: message }
    }
  }, [debounced])

  const captureRef = useRef<HTMLDivElement>(null)

  return (
    <PageShell
      title="NFA → DFA Converter"
      description="Define an NFA (epsilon transitions allowed), then watch subset construction build the equivalent DFA."
      icon={GitBranch}
      tag="Automata Theory"
      actions={
        <ExportReportButton
          moduleTitle="NFA to DFA Converter"
          category="Automata Theory"
          problemStatement="Convert a non-deterministic finite automaton (with epsilon transitions) into an equivalent deterministic finite automaton using the subset construction algorithm."
          inputGiven={`States: ${form.states}\nAlphabet: ${form.alphabet}\nStart: ${form.start}\nAccepting: ${form.accepting}\nTransitions:\n${form.transitions}`}
          discussionDefault={
            built.dfa
              ? `Subset construction produced ${built.dfa.states.length} DFA state(s) from ${built.nfa!.states.length} NFA state(s) in ${built.dfa.steps.length} steps.`
              : 'Fix the NFA definition to generate a discussion summary.'
          }
          captureRef={captureRef}
        />
      }
    >
      <SplitPane
        left={
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Preset</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {NFA_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadPreset(p.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors duration-150 ${
                      presetId === p.id
                        ? 'border-accent/40 bg-accent-soft text-accent'
                        : 'border-border bg-surface text-text-muted hover:bg-surface-hover'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-dim mt-1.5">{preset.description}</p>
            </div>

            <Field label="States (comma-separated)" value={form.states} onChange={(v) => setForm({ ...form, states: v })} />
            <Field label="Alphabet (comma-separated)" value={form.alphabet} onChange={(v) => setForm({ ...form, alphabet: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start state" value={form.start} onChange={(v) => setForm({ ...form, start: v })} />
              <Field label="Accepting states" value={form.accepting} onChange={(v) => setForm({ ...form, accepting: v })} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Transitions — one per line: <code className="text-text">from symbol to1 [to2 ...]</code> (use{' '}
                {NFA_EPSILON} for epsilon)
              </label>
              <textarea
                value={form.transitions}
                onChange={(e) => setForm({ ...form, transitions: e.target.value })}
                spellCheck={false}
                rows={8}
                className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-text outline-none focus:border-accent/50 transition-colors duration-150 resize-y"
              />
            </div>

            {built.error && <ErrorPanel message={built.error} />}
          </div>
        }
        right={
          built.nfa && built.dfa ? (
            <div ref={captureRef} className="flex flex-col gap-8">
              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">NFA</h3>
                <GraphCanvas
                  states={built.nfa.states.map((s) => ({ id: s, label: s, accepting: built.nfa!.accepting.includes(s) }))}
                  edges={built.nfa.transitions.flatMap((t) => t.to.map((to) => ({ source: t.from, target: to, label: t.symbol })))}
                  start={built.nfa.start}
                  height={260}
                />
              </div>

              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                  Subset construction steps
                </h3>
                <ol className="flex flex-col gap-1.5 text-[13px] font-mono text-text-muted max-h-48 overflow-y-auto pr-1">
                  {built.dfa.steps.map((s) => (
                    <li key={s.index} className={s.isNewState ? 'text-teal' : ''}>
                      {s.index + 1}. {s.description}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">
                  DFA ({built.dfa.states.length} states)
                </h3>
                <GraphCanvas
                  states={built.dfa.states.map((s) => ({ id: s.id, label: s.id, accepting: s.accepting }))}
                  edges={built.dfa.transitions.map((t) => ({ source: t.from, target: t.to, label: t.symbol }))}
                  start={built.dfa.start}
                  height={260}
                />
              </div>

              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">DFA transition table</h3>
                <Table>
                  <THead>
                    <TRow>
                      <TH>State</TH>
                      {built.nfa.alphabet.map((a) => (
                        <TH key={a}>{a}</TH>
                      ))}
                      <TH>Accepting</TH>
                    </TRow>
                  </THead>
                  <tbody>
                    {built.dfa.states.map((s) => (
                      <TRow key={s.id}>
                        <TD className={s.id === built.dfa!.start ? 'text-accent font-medium' : 'text-text'}>
                          {'{' + s.id + '}'}
                        </TD>
                        {built.nfa!.alphabet.map((a) => {
                          const to = built.dfa!.transitions.find((t) => t.from === s.id && t.symbol === a)?.to
                          return (
                            <TD key={a} className="text-text-muted">
                              {to ? '{' + to + '}' : '—'}
                            </TD>
                          )
                        })}
                        <TD>{s.accepting ? <span className="text-teal">yes</span> : <span className="text-text-dim">no</span>}</TD>
                      </TRow>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-dim">Fix the NFA definition to see the converted DFA.</div>
          )
        }
      />
    </PageShell>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm text-text outline-none focus:border-accent/50 transition-colors duration-150"
      />
    </div>
  )
}

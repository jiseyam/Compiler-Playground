interface Tab {
  key: string
  label: string
}

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors duration-150 ${
            active === t.key
              ? 'bg-accent-soft text-text border border-accent/30'
              : 'text-text-muted hover:text-text border border-transparent'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

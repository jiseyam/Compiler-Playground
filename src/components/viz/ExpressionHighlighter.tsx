export default function ExpressionHighlighter({ expr, errorIndex }: { expr: string; errorIndex?: number }) {
  if (errorIndex === undefined) {
    return <div className="font-mono text-sm text-teal whitespace-pre-wrap break-all">{expr}</div>
  }
  const before = expr.slice(0, errorIndex)
  const at = expr[errorIndex] ?? ' '
  const after = expr.slice(errorIndex + 1)
  return (
    <div className="font-mono text-sm whitespace-pre-wrap break-all">
      <span className="text-text-muted">{before}</span>
      <span className="bg-coral-soft text-coral border-b-2 border-coral rounded-sm px-0.5">{at}</span>
      <span className="text-text-muted">{after}</span>
    </div>
  )
}

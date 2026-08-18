import CodeMirror, { EditorView } from '@uiw/react-codemirror'

const darkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text)',
      fontSize: '13.5px',
      borderRadius: '12px',
      border: '1px solid var(--color-border)',
    },
    '.cm-content': {
      fontFamily: 'var(--font-mono)',
      padding: '14px',
      caretColor: 'var(--color-accent)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text-dim)',
      border: 'none',
      borderRight: '1px solid var(--color-border)',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--color-accent-soft) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(124, 92, 255, 0.06)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(124, 92, 255, 0.06)',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--color-accent)',
    },
  },
  { dark: true },
)

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export default function CodeInput({ value, onChange, placeholder, minHeight = '220px' }: CodeInputProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      theme={darkTheme}
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
      minHeight={minHeight}
    />
  )
}
